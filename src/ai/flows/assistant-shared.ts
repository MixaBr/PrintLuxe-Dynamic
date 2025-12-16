/**
 * @fileOverview Shared schemas and types for the assistant flow.
 */

import { z } from 'genkit';

export const AssistantInputSchema = z.object({
  query: z.string().describe('The user query from the Telegram chat.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
