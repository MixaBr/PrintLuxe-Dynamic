/**
 * @fileOverview The main webhook endpoint for handling Telegram updates.
 * This file implements a sophisticated pipeline for processing incoming messages:
 * 1. Fetches global settings and the user's chat data from Supabase.
 * 2. Creates a new user if one doesn't exist.
 * 3. Performs a series of security and resource checks:
 *    - Blocked status check.
 *    - Daily quota check (resets every 24 hours).
 *    - Rate limit check (using a token bucket algorithm).
 * 4. If all checks pass, it determines if the session is new.
 * 5. Calls the AI assistant (`runAssistant`) with the user's query and session status.
 * 6. Sends the AI's response back to the user.
 * 7. If any check fails, it sends a predefined message to the user.
 * 8. All database writes for a single user are batched into one update call.
 */

import { runAssistant } from '@/ai/flows/assistant-flow';
import { createAdminClient } from '@/lib/supabase/service'; // Use the admin client
import { NextResponse } from 'next/server';

// Helper function to send a message to the user via the Telegram API.
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

// Main POST handler for the Telegram webhook
export async function POST(req: Request) {
  try {
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const message = body.message;

    // Basic validation to ensure we have a message with text and a chat ID.
    if (!message || !message.text || !message.chat || !message.chat.id) {
      return NextResponse.json({ status: 'ok' }); // Not a message we can handle
    }

    const chatId = message.chat.id;
    const query = message.text;

    const supabase = createAdminClient(); // Use the admin client to bypass RLS

    // 1. Fetch settings and chat data in parallel for efficiency.
    const [settingsRes, chatRes] = await Promise.all([
      supabase.from('settings').select('key, value'),
      supabase.from('chats').select('*').eq('chat_id', chatId).single(),
    ]);

    // Process settings into a more usable key-value object.
    const settings = settingsRes.data?.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const config = {
      sessionTimeout: parseInt(settings.bot_session_timeout || '30', 10),
      rateLimitMax: parseInt(settings.bot_rate_limit_max || '5', 10),
      refillSeconds: parseInt(settings.bot_rate_limit_refill_seconds || '5', 10),
      dailyQuotaMax: parseInt(settings.bot_daily_quota_max || '100', 10),
      msgRateLimit: settings.bot_message_rate_limit || 'You are sending messages too fast. Please wait.',
      msgDailyQuota: settings.bot_message_daily_quota || 'You have reached your daily message limit. Try again tomorrow.',
      msgBlocked: settings.bot_message_blocked || 'Your access to the bot has been restricted.',
    };

    let chat = chatRes.data;
    let isNewUser = false;

    // 2. Find or Create User
    if (!chat) {
      isNewUser = true;
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert({
          chat_id: chatId,
          username: message.chat.username,
          first_name: message.chat.first_name, // This is from the Telegram profile
          last_message_at: new Date().toISOString(),
          quota_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          rate_limit_tokens: config.rateLimitMax,
        })
        .select()
        .single();

      if (newChatError) throw newChatError;
      chat = newChat;
    }

    const now = new Date();
    const updates: Partial<typeof chat> = {};

    // 3. Check #1: Blocked User
    if (chat.is_blocked) {
      await sendTelegramMessage(chatId, config.msgBlocked);
      return NextResponse.json({ status: 'ok' });
    }

    // 4. Check #2: Daily Quota
    const quotaResetAt = new Date(chat.quota_reset_at);
    if (now > quotaResetAt) {
      updates.daily_quota_used = 0;
      updates.quota_reset_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    if ((updates.daily_quota_used ?? chat.daily_quota_used) >= config.dailyQuotaMax && !isNewUser) {
      await sendTelegramMessage(chatId, config.msgDailyQuota);
      return NextResponse.json({ status: 'ok' });
    }

    // 5. Check #3: Rate Limiter
    const lastMessageAt = new Date(chat.last_message_at);
    const secondsPassed = (now.getTime() - lastMessageAt.getTime()) / 1000;
    const tokensToAdd = Math.floor(secondsPassed / config.refillSeconds);

    let currentTokens = chat.rate_limit_tokens;
    if (tokensToAdd > 0) {
      currentTokens = Math.min(currentTokens + tokensToAdd, config.rateLimitMax);
    }

    if (currentTokens < 1 && !isNewUser) {
      await sendTelegramMessage(chatId, config.msgRateLimit);
      // Even if rate limited, we update the token count in the DB.
      if (currentTokens !== chat.rate_limit_tokens) {
        await supabase.from('chats').update({ rate_limit_tokens: currentTokens }).eq('chat_id', chatId);
      }
      return NextResponse.json({ status: 'ok' });
    }

    // All checks passed, proceed with AI call.
    updates.rate_limit_tokens = currentTokens - 1; // Consume a token
    updates.daily_quota_used = (updates.daily_quota_used ?? chat.daily_quota_used) + 1;
    updates.last_message_at = now.toISOString();
    
    // Save usage updates immediately.
    const { error: updateError } = await supabase.from('chats').update(updates).eq('chat_id', chatId);
    if (updateError) throw updateError;


    // 6. Determine if it's a new session
    const minutesSinceLast = isNewUser ? Infinity : secondsPassed / 60;
    const isNewSession = !isNewUser && minutesSinceLast > config.sessionTimeout;
    
    // 7. Call the AI assistant with the full context
    const assistantResponse = await runAssistant({
      query,
      isNewUser,
      isNewSession,
      userName: chat.first_name, // Suggest the user's profile display name
      firstName: chat.user_first_name, // The name they want to be called
      chatId: chat.chat_id,
    });
    
    // 8. Send the final response to the user
    await sendTelegramMessage(chatId, assistantResponse.response);

  } catch (err: any) {
    console.error('Error in Telegram webhook:', err.message || err);
  }

  // Always return a 200 OK to Telegram
  return NextResponse.json({ status: 'ok' });
}

    