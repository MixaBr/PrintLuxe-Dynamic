/**
 * @fileOverview The main webhook endpoint for handling Telegram updates.
 * This file implements a sophisticated pipeline for processing incoming messages:
 * 1. Fetches bot configuration from `app_config` and the user's chat data from `chats`.
 * 2. Checks if the user is blocked. If so, halts all further processing.
 * 3. Creates a new user if one doesn't exist, and logs their first session.
 * 4. Performs a series of security and resource checks (rate limits, daily quota).
 * 5. If a session is new (either by timeout or explicit closing), it now directly updates the `sessions` table to end the old session and create a new one.
 * 6. Calls the AI assistant (`runAssistant`) which includes a security check before processing the query.
 * 7. Sends the AI's response back to the user and updates all relevant chat data in a single batch.
 */

import { runAssistant } from '@/ai/flows/assistant-flow';
import { createAdminClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

// The 'render' function was removed from the 'genkit' package.
// This is a simple replacement that handles basic {{variable}} substitution.
function render({ template, context }: { template: string; context: Record<string, any> }): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? String(context[key]) : match;
    });
}

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
      msgBlockedPermanent: appConfig.bot_message_blocked_permanent || 'Your access to the bot has been permanently restricted. Contact support: {{adminContacts}}',
      adminContacts: appConfig.bot_admin_contacts || 'No contacts available.'
    };

    let chat = chatRes.data;
    const now = new Date();

    // Absolute Priority: Check if the user is already blocked.
    if (chat && chat.is_blocked) {
        const blockedMessage = render({
            template: config.msgBlockedPermanent,
            context: { adminContacts: config.adminContacts }
        });
        await sendTelegramMessage(chatId, blockedMessage);
        return NextResponse.json({ status: 'ok' });
    }

    let isNewUser = false;

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

      // Also create a session log for the new user
      await supabase.from('sessions').insert({ chat_id: chat.id, started_at: now.toISOString() });
    }

    const updates: Partial<typeof chat> = {};

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
      
      // FIX: Replace missing RPC call with direct SQL operations
      // 1. End the previous session
      const { error: updateSessionError } = await supabase
        .from('sessions')
        .update({ ended_at: lastMessageAt.toISOString() })
        .eq('chat_id', chat.id)
        .is('ended_at', null); // Ensure we only close active sessions
      
      if (updateSessionError) throw updateSessionError;

      // 2. Start a new session
      const { error: insertSessionError } = await supabase
        .from('sessions')
        .insert({ chat_id: chat.id, started_at: now.toISOString() });
        
      if (insertSessionError) throw insertSessionError;
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
