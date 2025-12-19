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

const tools = [detectAndSaveName, generalQuestionsTool, endConversationTool];

const assistantRouterFlow = ai.defineFlow(
  {
    name: 'assistantRouterFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Fetch the user's current name from the database at the beginning of every flow run.
    // This ensures we always have the most up-to-date information.
    const supabase = createAdminClient();
    const { data: chatData, error } = await supabase
      .from('chats')
      .select('us_first_name')
      .eq('chat_id', input.chatId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
      console.error('Error fetching user name:', error);
      // Fallback response if DB is down
      return 'Внутренняя ошибка: не удалось получить данные пользователя. Попробуйте позже.';
    }

    const currentFirstName = chatData?.us_first_name;

    // Special handling for a new session with a known user
    if (input.isNewSession && currentFirstName) {
        return `Приветствую Вас, ${currentFirstName}! Рад видеть! Чем могу сегодня Вам помочь?`;
    }

    const systemPrompt = !currentFirstName
      ? `Ты PrintLux Helper, русскоязычный AI-ассистент. Твоя главная цель — узнать имя пользователя. Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке.\nID чата: ${input.chatId}. Передавай его в любой инструмент, который его требует.\n\nПроанализируй сообщение:\n1.  **Приветствие** ('привет', 'здравствуй'): Ответь на приветствие и спроси имя. Пример: \"Приветствую Вас! Как я могу к Вам обращаться?\"\n2.  **Похоже на имя** ('Майкл', 'Анна'): Используй инструмент \'detectAndSaveName\'.\n3.  **Вопрос о компании** ('услуги', 'цены'): Используй инструмент \'generalQuestions\'. После этого вежливо напомни, что ждешь имя.\n4.  **Прощание** ('спасибо, до свидания', 'пока', 'это все'): Используй инструмент \'endConversationTool\'.\n5.  **Всё остальное** (просьба поболтать, общие вопросы): Ответь напрямую как дружелюбный собеседник. В конце ответа напомни про имя.`
      : `Ты PrintLux Helper, русскоязычный AI-ассистент. Ты общаешься с пользователем по имени ${currentFirstName}. Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке.\nID чата: ${input.chatId}. Передавай его в любой инструмент, который его требует.\n\nПроанализируй запрос:\n- Если пользователь хочет закончить разговор ('спасибо', 'до свидания', 'пока', 'я закончил'), используй инструмент \'endConversationTool\'.\n- Если он касается услуг, цен, продукции или заказов PrintLux, используй инструмент \'generalQuestions\'.\n- Если запрос НЕ касается деятельности компании (просьба поболтать, общие знания), ответь на него напрямую как дружелюбный собеседник. После своего ответа, вежливо предложи свою помощь по основной теме. Пример: \"...Кстати, если у вас будут вопросы о наших услугах, я готов помочь!\"`;

    const response = await ai.generate({
      tools,
      prompt: input.query,
      system: systemPrompt,
    });

    // The genkit flow automatically handles tool execution and resumes the flow.
    // The final, user-facing text is available in response.text.
    return response.text;
  }
);
