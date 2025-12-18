/**
 * @fileOverview Shared schemas and types for the assistant flow.
 */

import { z } from 'genkit';

export const AssistantInputSchema = z.object({
  query: z.string().describe('The user query from the Telegram chat.'),
  settingsContext: z.string().optional().describe('A string containing all key-value pairs from the settings table.'),
  isNewSession: z.boolean().optional().describe('True if this is the first message in a conversation session.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;
