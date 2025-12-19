/**
 * @fileOverview A Genkit tool for answering general questions.
 */
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const handleGeneralQuestion = ai.defineTool(
  {
    name: 'handleGeneralQuestion',
    description: "Use this tool for any general question, greeting, or command that is not a person's name.",
    inputSchema: z.object({
      question: z.string().describe('The user question or message.'),
      chatId: z.number().describe("The user's Telegram chat ID."),
    }),
    outputSchema: z.string().describe("A direct answer to the user's question."),
  },
  async (input) => {
    const { question, chatId } = input;

    if (!chatId) {
      // This is a fallback, but the system prompt should enforce passing it.
      console.error('handleGeneralQuestion tool was called without a chatId.');
    }

    // In a real app, you would use a knowledge base (RAG) here to find a real answer.
    // For now, we return a simple, placeholder answer. The LLM will then format this
    // into a polite, user-facing response.
    const answer = `This is a placeholder response for the question: "${question}". A real implementation would use a knowledge base to provide a detailed answer.`;
    
    return answer;
  }
);
