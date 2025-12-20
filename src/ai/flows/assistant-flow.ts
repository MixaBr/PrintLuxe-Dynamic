/**
 * @fileOverview A general-purpose AI assistant flow for the Telegram bot.
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
import { render } from 'genkit';

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

export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  if (input.isNewUser) {
    const response = await getIntroduction(input.userName);
    return { response };
  }

  const aiResponse = await assistantRouterFlow(input);
  return { response: aiResponse };
}

const tools = [detectAndSaveName, generalQuestionsTool, endConversationTool, knowledgeBaseTool];

// Helper to fetch prompts from the database
async function getPrompts() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', [
            'bot_prompt_unidentified_user',
            'bot_prompt_identified_user',
            'bot_prompt_expert'
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


const assistantRouterFlow = ai.defineFlow(
  {
    name: 'assistantRouterFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // 1. Fetch user data and all required prompts in parallel
    const [chatDataResult, prompts] = await Promise.all([
        createAdminClient().from('chats').select('us_first_name').eq('chat_id', input.chatId).single(),
        getPrompts()
    ]);
    
    const { data: chatData, error } = chatDataResult;

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

    const routerPrompt = render({
        template: routerPromptTemplate,
        context: {
            chatId: input.chatId,
            currentFirstName: currentFirstName,
        }
    });

    // 4. First LLM call (The Router) - decides which tool to use
    const routerResponse = await ai.generate({
      tools,
      prompt: input.query,
      system: routerPrompt,
    });

    // 5. Check if the knowledgeBaseTool was used
    const kbToolCall = routerResponse.toolCalls?.find(call => call.tool === 'knowledgeBaseTool');

    if (kbToolCall) {
        // If the knowledge base tool was called, it means the router identified a technical question.
        // The tool's output (context) is already available in routerResponse.toolOutput().
        const knowledgeContext = routerResponse.toolOutput(kbToolCall.id);
        
        if (!knowledgeContext || knowledgeContext.trim() === 'В базе знаний не найдено релевантной информации по вашему вопросу.') {
            return knowledgeContext || "Не удалось найти информацию по вашему запросу.";
        }

        // 6. Second LLM call (The Expert) - generates the final answer based on the context
        const expertPromptTemplate = prompts.bot_prompt_expert;
        const expertPrompt = render({
            template: expertPromptTemplate,
            context: {
                query: input.query,
                contextText: knowledgeContext
            }
        });
        
        const expertResponse = await ai.generate({
            prompt: expertPrompt,
            // No tools are passed here, as the expert's only job is to synthesize an answer.
        });
        
        return expertResponse.text;
    }

    // 7. If no special tool was used, return the direct text response from the router.
    return routerResponse.text;
  }
);
