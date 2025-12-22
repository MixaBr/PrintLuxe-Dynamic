
/**
 * @fileOverview The main AI assistant flow for the Telegram bot.
 * This file now orchestrates a multi-step process:
 * 1. A `securityGuardFlow` first checks if the user's query is malicious.
 * 2. If malicious, it calls `handleSecurityStrike` to log the attempt and potentially block the user.
 * 3. If safe, it proceeds to the `assistantRouterFlow` which handles the query as before.
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
            'bot_prompt_unidentified_user',
            'bot_prompt_identified_user',
            'bot_prompt_expert',
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
  const aiResponse = await assistantRouterFlow({ ...input, prompts });
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
    inputSchema: AssistantInputSchema.extend({ prompts: z.record(z.string()) }),
    outputSchema: z.string(),
  },
  async ({ prompts, ...input }) => {
    // 1. Fetch user data
    const { data: chatData, error } = await createAdminClient()
      .from('chats')
      .select('us_first_name')
      .eq('chat_id', input.chatId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching user name:', error);
      return 'Внутренняя ошибка: не удалось получить данные пользователя. Попробуйте позже.';
    }

    const currentFirstName = chatData?.us_first_name;

    // 2. Handle new session for a known user
    if (input.isNewSession && currentFirstName) {
        return `Приветствую Вас, ${currentFirstName}! Рад видеть! Чем могу сегодня Вам помочь?`;
    }

    // 3. Select the appropriate system prompt based on user identification status
    const routerPromptTemplate = currentFirstName
      ? prompts.bot_prompt_identified_user
      : prompts.bot_prompt_unidentified_user;

    const routerPrompt = routerPromptTemplate
        .replace('{{chatId}}', String(input.chatId))
        .replace('{{currentFirstName}}', currentFirstName || 'null');

    // 4. First LLM call (The Router) - decides which tool to use
    // Updated to use the correct GenerateOptions structure
    const routerResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      system: routerPrompt,
      prompt: input.query,
      tools,
    });

    // 5. Check if the knowledgeBaseTool was used and handle it.
    const kbToolCall = routerResponse.toolRequests?.find(
      (call) => call.toolRequest.name === 'knowledgeBaseTool'
    );

    if (kbToolCall) {
        // The tool was requested. Now we make a second call to get the expert answer.
        const expertPromptTemplate = prompts.bot_prompt_expert;
        const expertPrompt = expertPromptTemplate
            .replace('{{query}}', input.query)
            .replace('{{contextText}}', 'Используй информацию из предоставленных инструментов.');

        // The second call includes the history of the conversation, including the tool request.
        // Genkit will automatically resolve the tool and provide its output as context to the model.
        if (!routerResponse.message) {
             return "Произошла внутренняя ошибка при обработке вашего запроса.";
        }
        
        const expertResponse = await ai.generate({
          model: googleAI.model('gemini-1.5-flash-latest'),
          system: expertPrompt,
          messages: [
            routerResponse.message
          ],
          tools: [knowledgeBaseTool]
        });

        const expertText = expertResponse.text;

        if (expertText.includes("не найдено релевантной информации")) {
            return "К сожалению, в моей базе знаний нет ответа на ваш вопрос. Могу я помочь чем-то еще?";
        }

        return expertText;
    }


    // 7. If no special tool was used, return the direct text response from the router.
    return routerResponse.text;
  }
);
