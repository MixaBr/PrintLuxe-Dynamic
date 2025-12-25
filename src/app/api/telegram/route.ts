
/**
 * @fileOverview The main webhook endpoint for handling Telegram updates.
 * This file implements a sophisticated pipeline for processing incoming messages:
 * 1. Fetches bot configuration from `app_config` and the user's chat data from `chats`.
 * 2. Checks if the user is blocked. If so, halts all further processing.
 * 3. Creates a new user if one doesn't exist, and logs their first session.
 * 4. Performs a series of security and resource checks (rate limits, daily quota).
 * 5. If a session is new (either by timeout or explicit closing), it now directly updates the `sessions` table to end the old session and create a new one. It also resets the session strike counter.
 * 6. Calls the AI assistant (`runAssistant`) which includes a security check before processing the query.
 * 7. Sends the AI's response back to the user and updates all relevant chat data in a single batch.
 */

import { runAssistant } from '@/ai/flows/assistant-flow';
import { createAdminClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

function render({ template, context }: { template: string; context: Record<string, any> }): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return context[key] !== undefined ? String(context[key]) : match;
    });
}

async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    console.log(`--- [DEBUG] Preparing to send message to chatId: ${chatId}`);
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    console.log(`--- [DEBUG] Successfully sent message to chatId: ${chatId}`);
  } catch (error) {
    console.error('--- [CRITICAL ERROR] Failed to send Telegram message:', error);
  }
}

export async function POST(req: Request) {
  console.log('--- [LOG] TELEGRAM WEBHOOK START ---');
  try {
    const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
      console.warn('--- [WARN] Unauthorized: Secret token mismatch. ---');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('--- [DEBUG] Awaiting request body...');
    const body = await req.json();
    console.log('--- [DEBUG] Request body received.');

    const message = body.message;

    if (!message || !message.text || !message.chat || !message.chat.id) {
      console.log('--- [LOG] Ignoring non-text message or invalid payload. ---');
      return NextResponse.json({ status: 'ok' });
    }

    const chatId = message.chat.id;
    const query = message.text;
    console.log(`--- [LOG] Received message from chatId: ${chatId}, query: "${query}" ---`);

    const supabase = createAdminClient();

    console.log('--- [LOG] Fetching app_config and chat data... ---');
    const [appConfigRes, chatRes] = await Promise.all([
      supabase.from('app_config').select('key, value').like('key', 'bot_%'),
      supabase.from('chats').select('*').eq('chat_id', chatId).single(),
    ]);
    console.log('--- [DEBUG] Fetched app_config and chat data.');
    
    console.log('--- [DEBUG] Raw database response for chat query:');
    console.log(JSON.stringify(chatRes, null, 2));

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

    if (chat && chat.is_blocked) {
        console.log(`--- [LOG] User ${chatId} is blocked. Halting processing. ---`);
        const blockedMessage = render({
            template: config.msgBlockedPermanent,
            context: { adminContacts: config.adminContacts }
        });
        await sendTelegramMessage(chatId, blockedMessage);
        return NextResponse.json({ status: 'ok' });
    }

    let isNewUser = false;

    if (!chat) {
      console.log(`--- [DEBUG] 'chat' is null or undefined. Entering new user creation path for chatId: ${chatId}. ---`);
      isNewUser = true;

      console.log('--- [DEBUG] Inserting new user into DB...');
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert({
          chat_id: chatId,
          username: message.chat.username,
          first_name: message.chat.first_name,
          last_message_at: now.toISOString(),
          session_start_at: now.toISOString(),
          is_session_active: true,
          quota_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          rate_limit_tokens: config.rateLimitMax,
          session_strike_count: 0,
        })
        .select()
        .single();
      console.log('--- [DEBUG] New user insertion finished.');

      if (newChatError) {
        console.error('--- [CRITICAL DEBUG] Error during new user INSERTION:', JSON.stringify(newChatError, null, 2));
        throw newChatError;
      }
      chat = newChat;

      console.log(`--- [LOG] New user created with chat_id: ${chat?.chat_id}. Creating initial session... ---`);
      await supabase.from('sessions').insert({ chat_id: chat.chat_id, started_at: now.toISOString() });
      console.log('--- [DEBUG] Initial session created.');
    } else {
      console.log(`--- [DEBUG] Found existing user with chat_id: ${chat.chat_id}. Proceeding as existing user. ---`);
    }

    const updates: Partial<typeof chat> = {};

    const quotaResetAt = new Date(chat.quota_reset_at);
    if (now > quotaResetAt) {
      console.log('--- [LOG] Daily quota reset. ---');
      updates.daily_quota_used = 0;
      updates.quota_reset_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    if ((updates.daily_quota_used ?? chat.daily_quota_used) >= config.dailyQuotaMax && !isNewUser) {
      console.log(`--- [LOG] User ${chatId} has reached daily quota. ---`);
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
       console.log(`--- [LOG] User ${chatId} is rate limited. ---`);
      await sendTelegramMessage(chatId, config.msgRateLimit);
      if (currentTokens !== chat.rate_limit_tokens) {
        await supabase.from('chats').update({ rate_limit_tokens: currentTokens }).eq('chat_id', chatId);
      }
      return NextResponse.json({ status: 'ok' });
    }

    updates.rate_limit_tokens = currentTokens - 1;
    updates.daily_quota_used = ((updates.daily_quota_used ?? chat.daily_quota_used) ?? 0) + 1;
    updates.last_message_at = now.toISOString();

    const minutesSinceLast = isNewUser ? Infinity : secondsPassed / 60;
    const sessionTimedOut = minutesSinceLast > config.sessionTimeout;
    const sessionWasClosed = chat.is_session_active === false;
    const isNewSession = !isNewUser && (sessionTimedOut || sessionWasClosed);

    if (isNewSession) {
      console.log(`--- [LOG] New session started for user ${chatId}. Reason: ${sessionTimedOut ? 'timeout' : 'explicitly closed'}. ---`);
      updates.session_start_at = now.toISOString();
      updates.is_session_active = true;
      updates.session_strike_count = 0; // Reset strike count on new session
      
      console.log('--- [LOG] Calling rotate_user_session RPC... ---');
      const { error: rpcError } = await supabase.rpc('rotate_user_session', {
        p_chat_id: chat.chat_id,
        p_ended_at: lastMessageAt.toISOString(),
        p_started_at: now.toISOString()
      });
      console.log('--- [DEBUG] RPC rotate_user_session finished.');
      
      if (rpcError) {
        console.error('--- [CRITICAL ERROR] Error calling rotate_user_session RPC:', rpcError);
        throw rpcError;
      }
      console.log('--- [LOG] RPC rotate_user_session finished successfully. ---');
    }

    if (Object.keys(updates).length > 0) {
        console.log('--- [LOG] Updating chat data in DB... ---');
        const { error: updateError } = await supabase.from('chats').update(updates).eq('chat_id', chatId);
        console.log('--- [DEBUG] Chat data update finished.');
        if (updateError) throw updateError;
    }
    
    console.log('--- [LOG] Running AI assistant... ---');
    const assistantResponse = await runAssistant({
      query,
      isNewUser,
      isNewSession,
      userName: chat.username,
      chatId: chat.chat_id,
    });
    console.log('--- [DEBUG] AI assistant finished.');
    
    console.log('--- [LOG] Sending response to Telegram... ---');
    await sendTelegramMessage(chatId, assistantResponse.response);
    console.log('--- [DEBUG] Response sent to Telegram.');
    console.log('--- [LOG] TELEGRAM WEBHOOK END ---');

  } catch (err: any) {
    console.error('--- [CRITICAL ERROR] Uncaught error in Telegram webhook:', err.message || err);
    console.error('--- [CRITICAL ERROR] Full error stack:', err.stack);
  }

  return NextResponse.json({ status: 'ok' });
}
