/**
 * @fileOverview The main webhook endpoint for handling Telegram updates.
 * This file implements a sophisticated pipeline for processing incoming messages:
 * 1. Fetches bot configuration from `app_config` and the user's chat data from `chats`.
 * 2. Creates a new user if one doesn't exist, and logs their first session.
 * 3. Performs a series of security and resource checks.
 * 4. If a session is new (either by timeout or explicit closing), it calls a dedicated Supabase function (`rotate_user_session`) to atomically handle session logging.
 * 5. Calls the AI assistant (`runAssistant`) with the user's query and session status.
 * 6. Sends the AI's response back to the user and updates all relevant chat data in a single batch.
 */

import { runAssistant } from '@/ai/flows/assistant-flow';
import { createAdminClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  try {
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const message = body.message;

    if (!message || !message.text || !message.chat || !message.chat.id) {
      return NextResponse.json({ status: 'ok' });
    }

    const chatId = message.chat.id;
    const query = message.text;

    const supabase = createAdminClient();

    // Fetch all bot configurations from the `app_config` table
    const [appConfigRes, chatRes] = await Promise.all([
      supabase.from('app_config').select('key, value').like('key', 'bot_%'),
      supabase.from('chats').select('*').eq('chat_id', chatId).single(),
    ]);

    const appConfig = appConfigRes.data?.reduce((acc, { key, value }) => {
      acc[key] = value ?? '';
      return acc;
    }, {} as Record<string, string>) || {};

    const config = {
      sessionTimeout: parseInt(appConfig.bot_session_timeout || '30', 10),
      rateLimitMax: parseInt(appConfig.bot_rate_limit_max || '5', 10),
      refillSeconds: parseInt(appConfig.bot_rate_limit_refill_seconds || '5', 10),
      dailyQuotaMax: parseInt(appConfig.bot_daily_quota_max || '100', 10),
      msgRateLimit: appConfig.bot_message_rate_limit || 'You are sending messages too fast. Please wait.',
      msgDailyQuota: appConfig.bot_message_daily_quota || 'You have reached your daily message limit. Try again tomorrow.',
      msgBlocked: appConfig.bot_message_blocked || 'Your access to the bot has been restricted.',
    };

    let chat = chatRes.data;
    let isNewUser = false;
    const now = new Date();

    if (!chat) {
      isNewUser = true;
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert({
          chat_id: chatId,
          username: message.chat.username,
          first_name: message.chat.first_name,
          last_message_at: now.toISOString(),
          session_start_at: now.toISOString(),
          is_session_active: true, // Explicitly set for new users
          quota_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          rate_limit_tokens: config.rateLimitMax,
        })
        .select()
        .single();

      if (newChatError) throw newChatError;
      chat = newChat;

      await supabase.from('sessions').insert({ chat_id: chatId, started_at: now.toISOString() });
    }

    const updates: Partial<typeof chat> = {};

    if (chat.is_blocked) {
      await sendTelegramMessage(chatId, config.msgBlocked);
      return NextResponse.json({ status: 'ok' });
    }

    const quotaResetAt = new Date(chat.quota_reset_at);
    if (now > quotaResetAt) {
      updates.daily_quota_used = 0;
      updates.quota_reset_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    if ((updates.daily_quota_used ?? chat.daily_quota_used) >= config.dailyQuotaMax && !isNewUser) {
      await sendTelegramMessage(chatId, config.msgDailyQuota);
      return NextResponse.json({ status: 'ok' });
    }

    const lastMessageAt = new Date(chat.last_message_at);
    const secondsPassed = (now.getTime() - lastMessageAt.getTime()) / 1000;
    const tokensToAdd = Math.floor(secondsPassed / config.refillSeconds);

    let currentTokens = chat.rate_limit_tokens;
    if (tokensToAdd > 0) {
      currentTokens = Math.min(currentTokens + tokensToAdd, config.rateLimitMax);
    }

    if (currentTokens < 1 && !isNewUser) {
      await sendTelegramMessage(chatId, config.msgRateLimit);
      if (currentTokens !== chat.rate_limit_tokens) {
        await supabase.from('chats').update({ rate_limit_tokens: currentTokens }).eq('chat_id', chatId);
      }
      return NextResponse.json({ status: 'ok' });
    }

    updates.rate_limit_tokens = currentTokens - 1;
    updates.daily_quota_used = ((updates.daily_quota_used ?? chat.daily_quota_used) ?? 0) + 1;
    updates.last_message_at = now.toISOString();

    // New session detection logic
    const minutesSinceLast = isNewUser ? Infinity : secondsPassed / 60;
    const sessionTimedOut = minutesSinceLast > config.sessionTimeout;
    const sessionWasClosed = chat.is_session_active === false;
    const isNewSession = !isNewUser && (sessionTimedOut || sessionWasClosed);

    if (isNewSession) {
      updates.session_start_at = now.toISOString();
      updates.is_session_active = true; // Mark the new session as active
      
      const { error: rpcError } = await supabase.rpc('rotate_user_session', {
        p_chat_id: chatId,
        p_ended_at: lastMessageAt.toISOString(),
        p_started_at: now.toISOString(),
      });

      if (rpcError) throw rpcError;
    }

    if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.from('chats').update(updates).eq('chat_id', chatId);
        if (updateError) throw updateError;
    }

    const assistantResponse = await runAssistant({
      query,
      isNewUser,
      isNewSession,
      userName: chat.username,
      chatId: chat.chat_id,
    });
    
    await sendTelegramMessage(chatId, assistantResponse.response);

  } catch (err: any) {
    console.error('Error in Telegram webhook:', err.message || err);
  }

  return NextResponse.json({ status: 'ok' });
}
