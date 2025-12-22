
/**
 * @fileOverview The main AI assistant flow for the Telegram bot.
 * This file orchestrates a multi-step process:
 * 1. A `securityGuardFlow` first checks if the user's query is malicious.
 * 2. If safe, it handles new users with an introduction.
 * 3. For existing users, it proceeds to the `assistantRouterFlow` which uses a single, powerful prompt from the database (`bot_prompt_router`) to decide which tool to use (knowledge base, general questions, etc.) and generate a final answer.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generalQuestionsTool } from '../tools/general-questions';
import { detectAndSaveName } from '../tools/user-profile';
import { getIntroduction } from '../tools/introduction';
import { createAdminClient } from '@/lib/supabase/service';
import { endConversationTool } from '../tools/end-conversation';
import { knowledgeBaseTool } from '../tools/knowledge-base-tool';
import { handleSecurityStrike } from '../tools/security';
import { googleAI } from '@genkit-ai/google-genai';

const AssistantInputSchema = z.object({
  query: z.string().describe('The user query from the Telegram chat.'),
  isNewUser: z.boolean().describe('True if this is the very first time the user is interacting with the bot.'),
  isNewSession: z.boolean().describe('True if this is the first message in a new conversation session.'),
  userName: z.string().optional().nullable().describe("The user's username from their Telegram profile."),
  chatId: z.number().describe('The telegram chat ID of the user.'),
});
type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


// Helper to fetch all required prompts from the database in one go.
async function getBotPrompts() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', [
            'bot_prompt_router', // The new unified router prompt
            'bot_prompt_security_guard',
            'bot_message_security_warning',
            'bot_message_blocked_permanent',
            'bot_admin_contacts',
            'bot_welcome_message'
        ]);

    if (error) {
        console.error('Error fetching prompts:', error);
        throw new Error('Could not load AI prompts from database.');
    }

    return data.reduce((acc, { key, value }) => {
        acc[key] = value || '';
        return acc;
    }, {} as Record<string, string>);
}

export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  const prompts = await getBotPrompts();

  // 1. Security First: Check if the prompt is malicious.
  const isMalicious = await securityGuardFlow({
    query: input.query,
    guardPrompt: prompts.bot_prompt_security_guard,
  });
  
  if (isMalicious) {
    const strikeCount = await handleSecurityStrike(input.chatId, input.query);
    let securityResponse: string;

    if (strikeCount >= 2) {
      securityResponse = prompts.bot_message_blocked_permanent.replace('{{adminContacts}}', prompts.bot_admin_contacts);
    } else {
      securityResponse = prompts.bot_message_security_warning;
    }
    return { response: securityResponse };
  }

  // 2. Handle brand new user.
  if (input.isNewUser) {
    const response = await getIntroduction(prompts.bot_welcome_message, input.userName);
    return { response };
  }

  // 3. Proceed with the normal flow if the query is safe.
  const aiResponse = await assistantRouterFlow({ ...input, routerPrompt: prompts.bot_prompt_router });
  return { response: aiResponse };
}

const securityGuardFlow = ai.defineFlow(
  {
    name: 'securityGuardFlow',
    inputSchema: z.object({ query: z.string(), guardPrompt: z.string() }),
    outputSchema: z.boolean(),
  },
  async ({ query, guardPrompt }) => {
    if (!guardPrompt) {
        console.warn("Security guard prompt is missing. Assuming query is safe.");
        return false;
    }
    
    // Create a single, clear prompt for the model.
    const finalPrompt = `${guardPrompt}\n\nUser Query: "${query}"`;

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: finalPrompt,
    });
    
    const responseText = llmResponse.text.trim().toLowerCase();
    return responseText === 'true';
  }
);


const tools = [detectAndSaveName, generalQuestionsTool, endConversationTool, knowledgeBaseTool];

const assistantRouterFlow = ai.defineFlow(
  {
    name: 'assistantRouterFlow',
    inputSchema: AssistantInputSchema.extend({ routerPrompt: z.string() }),
    outputSchema: z.string(),
  },
  async ({ routerPrompt, ...input }) => {
     if (!routerPrompt) {
        console.error("CRITICAL: bot_prompt_router is missing from the database.");
        return "Произошла критическая ошибка: не удалось загрузить основной промпт. Пожалуйста, обратитесь к администратору.";
    }

    // 1. Fetch user data to get their name
    const { data: chatData, error } = await createAdminClient()
      .from('chats')
      .select('us_first_name')
      .eq('chat_id', input.chatId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching user name:', error);
      // Don't fail the whole flow, just proceed without the name.
    }

    const currentFirstName = chatData?.us_first_name;
    
    // 2. Handle new session for a known user
    if (input.isNewSession && currentFirstName) {
        return `Приветствую Вас, ${currentFirstName}! Рад видеть! Чем могу сегодня Вам помочь?`;
    }

    // 3. Prepare the final router prompt by injecting real-time data.
    const finalRouterPrompt = routerPrompt
        .replace('{{chatId}}', String(input.chatId))
        .replace('{{currentFirstName}}', currentFirstName || 'null');

    // 4. Execute the main AI call with all tools available.
    // The AI will use the powerful system prompt to decide which tool to use (or none).
    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      system: finalRouterPrompt,
      prompt: input.query,
      tools,
      toolChoice: 'auto'
    });

    // 5. Return the final text response from the model.
    // Genkit v1.x handles the tool-calling loop automatically. If a tool was called,
    // its output is fed back into the model in a subsequent call, and `llmResponse.text`
    // will contain the final, synthesized answer. If no tool was called, it's the direct answer.
    return llmResponse.text;
  }
);
