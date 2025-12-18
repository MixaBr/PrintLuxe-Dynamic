/**
 * @fileOverview A general-purpose AI assistant flow for the Telegram bot.
 * This flow acts as a router, deciding which specialized tool to call based on the user's query and state.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { handleGeneralQuestion } from '../tools/general-questions';
import { detectAndSaveName } from '../tools/user-profile';
import { getIntroduction } from '../tools/introduction';
import { createClient } from '@/lib/supabase/server';

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


// Main exported function for the webhook
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  // 1. Handle the highest priority: a new user. This is deterministic.
  if (input.isNewUser) {
    const response = getIntroduction(input.userName);
    return { response };
  }
  
  // 2. Handle a returning user in a new session. Also deterministic.
  if (input.isNewSession) {
    const response = `Здравствуйте, ${input.firstName || input.userName}! Рад вас снова видеть. Чем могу помочь?`;
    // We can then let the assistant answer the actual query in the same turn.
    // For simplicity now, we'll just greet. We can chain this with another call later.
  }

  // 3. For ongoing conversations, use the AI router flow.
  return assistantRouterFlow(input);
}


// Define the Tools for the AI to use
const tools = [detectAndSaveName, handleGeneralQuestion];

// Define the main router flow
const assistantRouterFlow = ai.defineFlow(
  {
    name: 'assistantRouterFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    
    // If we don't know the user's name yet, the primary goal is to get it.
    // We guide the model to prioritize this.
    const systemPrompt = !input.firstName
      ? `You are PrintLux Helper, a specialized AI assistant for PrintLux. Your primary goal is to get the user's name.
Analyze the user's message ('query').
- If the message looks like a person's name (e.g., 'Mike', 'Anna', 'Михаил'), call the 'detectAndSaveName' tool.
- If the message is a question or command (e.g., 'What services do you offer?'), call the 'handleGeneralQuestion' tool to answer it, and then POLITELY remind the user you are waiting for their name in your final response.`
      : `You are PrintLux Helper, a specialized AI assistant for PrintLux. Your goal is to be helpful, professional, and concise.
Call the 'handleGeneralQuestion' tool to answer the user's query. Greet the user by their name, '${input.firstName}', if it feels natural.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      tools,
      prompt: input.query,
      system: systemPrompt,
      // Pass additional data required by tools via config.
      config: {
        custom: { chatId: input.chatId }
      },
    });

    const toolResponse = response.toolRequest();

    // If no tool was called, generate a simple response.
    if (!toolResponse) {
       const directResponse = await handleGeneralQuestion(input.query);
       return { response: directResponse };
    }
    
    // Execute the tool chosen by the model
    const toolResult = await toolResponse.execute();

    // Generate the final, user-facing response based on the tool's output.
    const finalResponse = await ai.generate({
       model: 'googleai/gemini-2.5-flash',
       prompt: `The user said: "${input.query}". A tool was called and it returned the following data: "${toolResult}".
Formulate a natural, user-facing response in Russian based on this.
- If the tool was 'detectAndSaveName', the data is the detected name. Confirm with the user and ask how you can help.
- If the tool was 'handleGeneralQuestion', the data is the answer. Just provide this answer. If you were also asked to remind the user for their name, add that reminder politely at the end.`,
    });

    return { response: finalResponse.text };
  }
);
