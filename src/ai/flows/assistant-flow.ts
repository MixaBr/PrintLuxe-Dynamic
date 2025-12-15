'use server';
/**
 * @fileOverview A general-purpose AI assistant flow for the Telegram bot.
 *
 * - assistantFlow - A function that handles user queries.
 * - AssistantInput - The input type for the assistantFlow function.
 * - AssistantOutput - The return type for the assistantFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AssistantInputSchema = z.object({
  query: z.string().describe('The user query from the Telegram chat.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

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
Your task is to provide helpful and concise answers to user questions.
Be friendly and professional.

User query: {{{query}}}
`,
});

// Define the main Genkit flow
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
