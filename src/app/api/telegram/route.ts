
import { NextRequest, NextResponse } from 'next/server';
import { runAssistant } from '@/ai/flows/assistant-flow';
import { createClient } from '@/lib/supabase/server'; // Импортируем server-клиент Supabase

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// --- Функция для загрузки приветствия из БД ---
async function getWelcomeMessage(): Promise<string> {
  const supabase = createClient();
  const fallbackMessage = 'Здравствуйте! Я PrintLux Helper, ваш AI-ассистент по ремонту принтеров. Чем могу помочь?';

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'bot_welcome_message')
    .single();

  if (error) {
    console.error('Error fetching welcome message:', error.message);
    return fallbackMessage; // Возвращаем запасной вариант при ошибке
  }

  return data?.value || fallbackMessage; // Возвращаем значение из БД или запасной вариант
}

async function sendMessage(chatId: number, text: string) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  console.log(`Sending message to chat_id: ${chatId}, text: ${text}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text }),
    });
    const result = await response.json();
    if (!result.ok) {
      console.error('Error sending message to Telegram:', result);
    } else {
      console.log('Message sent successfully.');
    }
  } catch (error) {
    console.error('Error in sendMessage function:', error);
  }
}

export async function POST(req: NextRequest) {
  const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!secretToken || secretToken !== TELEGRAM_SECRET_TOKEN) {
    console.warn('Unauthorized webhook access attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('--- New POST request received (authorized) ---');
  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    if (body.message) {
      const chatId = body.message.chat.id;
      const userText = body.message.text;

      if (!userText) {
        await sendMessage(chatId, 'Я умею обрабатывать только текстовые сообщения.');
        return NextResponse.json({ status: 'ok' });
      }

      // --- Обработка команды /start с приветствием из БД ---
      if (userText.trim() === '/start') {
        console.log('Handling /start command');
        const welcomeMessage = await getWelcomeMessage(); // Получаем приветствие
        await sendMessage(chatId, welcomeMessage);
        return NextResponse.json({ status: 'ok' });
      }

      console.log('Sending to AI for processing...');
      await fetch(`${TELEGRAM_API_URL}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      });

      const assistantResponse = await runAssistant({ query: userText });
      console.log('AI Response:', assistantResponse.response);
      await sendMessage(chatId, assistantResponse.response);
    } else {
      console.log('No message found in body');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Error processing Telegram webhook:', error.message, error.stack);
    try {
      const body = await req.json().catch(() => ({}));
      if (body.message?.chat?.id) {
        await sendMessage(body.message.chat.id, 'Произошла внутренняя ошибка. Пожалуйста, попробуйте позже.');
      }
    } catch (e) {
      // ignore
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Telegram webhook is ready. Use POST for messages." });
}
