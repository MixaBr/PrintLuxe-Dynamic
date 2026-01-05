
/**
 * @fileOverview A Genkit tool for detecting and saving a user's name.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/service';

export const detectAndSaveName = ai.defineTool(
  {
    name: 'detectAndSaveName',
    description: "Use this tool when the user's message is likely a person's name.",
    inputSchema: z.object({
        potentialName: z.string().describe('The potential name extracted from the user query.'),
    }),
    outputSchema: z.string().describe("The detected name that was saved."),
  },
  // The full 'input' from the main flow is available as the second argument (context)
  async ({ potentialName }, flowContext) => {
    
    const chatId = (flowContext as any)?.chatId;

    if (!chatId) {
      console.error('detectAndSaveName tool was called without a chatId in context.');
      // Return the name so the AI can still use it, even if saving failed.
      return `Я буду называть вас ${potentialName}, но не смог сохранить это в профиль.`;
    }

    const detectedName = potentialName.trim();

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('chats')
      .update({ us_first_name: detectedName }) // Corrected column name as per your instruction
      .eq('chat_id', chatId);

    if (error) {
      console.error('Failed to save user name:', error);
      // Let the AI know the save failed but we can still use the name for the conversation.
      return `Не удалось сохранить имя в профиль, но я буду называть вас ${detectedName}.`;
    }

    // Return just the name on success. The LLM will formulate the final response.
    return detectedName;
  }
);

    