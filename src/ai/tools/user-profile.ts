/**
 * @fileOverview A Genkit tool for detecting a user's name and saving it to the database.
 */
'use server';

import { ai } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

export const detectAndSaveName = ai.defineTool(
  {
    name: 'detectAndSaveName',
    description: "Detects a user's name from their message and saves it to their profile. Use this when the user's message is likely a name.",
    inputSchema: z.string().describe("The user's message that might contain their name."),
    outputSchema: z.string().describe("The detected name."),
  },
  async (potentialName, { custom }) => {
    const { chatId } = custom;

    if (!chatId) {
      throw new Error('Chat ID is required to save a name.');
    }

    // Here, we can add more sophisticated name detection logic if needed.
    // For now, we assume the input string *is* the name.
    const detectedName = potentialName; 

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('chats')
      .update({ us_first_name: detectedName })
      .eq('chat_id', chatId);

    if (error) {
      console.error('Failed to save user name:', error);
      // Even if saving fails, we return the name to the flow for a response.
      // The flow can decide how to handle the error.
      return `Failed to save name, but I'll call you ${detectedName}.`;
    }

    return detectedName;
  }
);
