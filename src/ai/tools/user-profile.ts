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
    inputSchema: z.string().describe('The potential name extracted from the user query.'),
    outputSchema: z.string().describe("The detected name that was saved."),
  },
  async (potentialName, {custom}) => {
    const { chatId } = custom || {};

    if (!chatId) {
      console.error('detectAndSaveName tool was called without a chatId.');
      // Return the name so the AI can still use it, even if saving failed.
      return `I'll call you ${potentialName}, but I couldn't save it to your profile.`;
    }

    const detectedName = potentialName.trim();

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('chats')
      .update({ user_first_name: detectedName })
      .eq('chat_id', chatId);

    if (error) {
      console.error('Failed to save user name:', error);
      // Let the AI know the save failed but we can still use the name for the conversation.
      return `Failed to save name to profile, but I'll call you ${detectedName} for now.`;
    }

    // Return just the name on success. The LLM will formulate the final response.
    return detectedName;
  }
);

    