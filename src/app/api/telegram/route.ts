
import { NextRequest, NextResponse } from 'next/server';
import { runAssistant } from '@/ai/flows/assistant-flow';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  console.log(`Sending message to chat_id: ${chatId}, text: ${text}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
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
  console.log('--- New POST request received ---');
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

      // Если пользователь отправил /start, отвечаем приветствием
      if (userText.trim() === '/start') {
        console.log('Handling /start command');
        await sendMessage(chatId, 'Здравствуйте! Я PrintLux Helper, ваш AI-ассистент по ремонту принтеров. Чем могу помочь?');
        return NextResponse.json({ status: 'ok' });
      }

      // Для всех остальных сообщений используем AI
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
    // В случае ошибки отправляем сообщение об этом в чат, если возможно
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
