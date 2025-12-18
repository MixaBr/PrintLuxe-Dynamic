/**
 * @fileOverview A general-purpose AI assistant flow for the Telegram bot.
 *
 * - assistantFlow - A function that handles user queries.
 */

import { ai } from '@/ai/genkit';
import { createClient } from '@/lib/supabase/server';
import {
  AssistantInput,
  AssistantInputSchema,
  AssistantOutput,
  AssistantOutputSchema,
} from './assistant-shared';

// This is the main exported function that the webhook will call.
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}

// Define the prompt for the AI model
const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `You are a helpful assistant for PrintLux, a printer repair and supply company.
Your name is PrintLux Helper.
Your task is to provide helpful and concise answers to user questions based on the provided business information.
Be friendly and professional.

Here is the business information from the database:
---
{{{settingsContext}}}
---

Based on the information above, please answer the following user query.
User query: {{{query}}}
`,
});

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

// Define the main Genkit flow
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const settingsContext = await getSettingsContext();
    const { output } = await assistantPrompt({ ...input, settingsContext });
    return output!;
  }
);
