import { NextRequest, NextResponse } from 'next/server';
import { runAssistant } from '@/ai/flows/assistant-flow';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(chatId: number, text: string) {
  const url = `${TELEGRAM_API_URL}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check for a message object
    if (body.message) {
      const chatId = body.message.chat.id;
      const userText = body.message.text;

      if (!userText) {
        // Handle non-text messages if needed
        await sendMessage(chatId, 'Я умею обрабатывать только текстовые сообщения.');
        return NextResponse.json({ status: 'ok' });
      }

      // Start a "typing..." action to show the bot is working
      await fetch(`${TELEGRAM_API_URL}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
      });

      // Call the Genkit AI assistant
      const assistantResponse = await runAssistant({ query: userText });

      // Send the AI's response back to the user
      await sendMessage(chatId, assistantResponse.response);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Add a GET handler for webhook setup verification if needed
export async function GET(req: NextRequest) {
    return NextResponse.json({ message: "Telegram webhook is ready. Use POST for messages." });
}
