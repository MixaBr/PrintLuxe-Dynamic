/**
 * @fileOverview A Genkit tool for answering general questions based on database settings.
 */
'use server';

import { ai } from '@/ai/genkit';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Fetches and formats all settings from the Supabase database to create a context string.
async function getSettingsContext(): Promise<string> {
  const supabase = createClient();
  const { data: settingsData, error } = await supabase
    .from('settings')
    .select('key, value, description');

  if (error) {
    console.error('Error fetching settings:', error);
    return 'No business information available.';
  }

  // Format the settings into a single string for the prompt
  const context = settingsData
    .map((setting) => {
      return `Key: ${setting.key}\nDescription: ${setting.description}\nValue: ${setting.value}`;
    })
    .join('\n\n');

  return context;
}

export const handleGeneralQuestion = ai.defineTool(
  {
    name: 'handleGeneralQuestion',
    description: 'Use this tool to answer general questions from the user. The answer will be based on the business information provided in the database.',
    inputSchema: z.string().describe('The user question to be answered.'),
    outputSchema: z.string().describe('The answer to the question.'),
  },
  async (query) => {
    const settingsContext = await getSettingsContext();

    const { text } = await ai.generate({
        prompt: `You are a helpful assistant for PrintLux. Answer the user's question based *only* on the business information provided below. Keep the answer concise.
        
== Business Information ==
${settingsContext}
== End of Business Information ==

User's question: "${query}"`,
    });
    return text;
  }
);
