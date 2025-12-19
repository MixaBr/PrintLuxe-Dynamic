/**
 * @fileOverview A general-purpose AI assistant flow for the Telegram bot.
 * This file implements a sophisticated pipeline for processing incoming messages:
 * 1. Fetches global settings and the user's chat data from Supabase.
 * 2. Creates a new user if one doesn't exist.
 * 3. Performs a series of security and resource checks:
 *    - Blocked status check.
 *    - Daily quota check (resets every 24 hours).
 *    - Rate limit check (using a token bucket algorithm).
 * 4. If all checks pass, it determines if the session is new.
 * 5. Calls the AI assistant (`runAssistant`) with the user's query and session status.
 * 6. Sends the AI's response back to the user.
 * 7. If any check fails, it sends a predefined message to the user.
 * 8. All database writes for a single user are batched into one update call.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { handleGeneralQuestion } from '../tools/general-questions';
import { detectAndSaveName } from '../tools/user-profile';
import { getIntroduction } from '../tools/introduction';

// Define schemas for this flow
const AssistantInputSchema = z.object({
  query: z.string().describe('The user query from the Telegram chat.'),
  isNewUser: z.boolean().describe('True if this is the very first time the user is interacting with the bot.'),
  isNewSession: z.boolean().describe('True if this is the first message in a new conversation session.'),
  firstName: z.string().optional().nullable().describe("The user's first name, if known."),
  userName: z.string().optional().nullable().describe("The user's first name from their Telegram profile."),
  chatId: z.number().describe('The telegram chat ID of the user.'),
});
type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user query.'),
});
type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


// Main exported function for the webhook.
// This function now contains the deterministic logic and only calls the AI when necessary.
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  // 1. Handle the highest priority: a new user. This is deterministic, no AI needed.
  if (input.isNewUser) {
    const response = await getIntroduction(input.userName);
    return { response };
  }
  
  // 2. Handle a returning user in a new session. Also deterministic.
  if (input.isNewSession) {
    const response = `Здравствуйте, ${input.firstName || input.userName}! Рад вас снова видеть. Чем могу помочь?`;
    return { response };
  }

  // 3. For all other ongoing conversations, use the AI router flow.
  const aiResponse = await assistantRouterFlow(input);
  return { response: aiResponse };
}


// Define the Tools for the AI to use
const tools = [detectAndSaveName, handleGeneralQuestion];

// Define the main router flow
const assistantRouterFlow = ai.defineFlow(
  {
    name: 'assistantRouterFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: z.string(), // The flow now directly returns the string response
  },
  async (input) => {
    
    // The system prompt now adapts based on whether we know the user's name.
    const systemPrompt = !input.firstName
      ? `You are PrintLux Helper, a specialized AI assistant for PrintLux. Your primary goal is to get the user's name.
Analyze the user's message ('query').
- If the message looks like a person's name (e.g., 'Mike', 'Anna', 'Михаил'), you MUST call the 'detectAndSaveName' tool. Your final response should confirm their name and ask how you can help.
- For any other message, question, or command (e.g., 'What services do you offer?', 'hello'), you MUST call the 'handleGeneralQuestion' tool.
After using the 'handleGeneralQuestion' tool, you MUST POLITELY remind the user you are waiting for their name in your final response.
Example response after a general question: "Thanks for asking... Btw, I'm still waiting to know how I should address you."`
      : `You are PrintLux Helper, a specialized AI assistant for PrintLux. Your goal is to be helpful, professional, and concise.
You MUST call the 'handleGeneralQuestion' tool to answer the user's query. Greet the user by their name, '${input.firstName}', if it feels natural.`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      tools,
      prompt: input.query,
      system: systemPrompt,
      config: {
        // Pass the chatId to all tools automatically.
        custom: { chatId: input.chatId }
      },
    });

    // The 'generate' call with tools automatically handles the tool execution
    // and returns the final text response in a single step.
    // This is much more efficient.
    return response.text;
  }
);
