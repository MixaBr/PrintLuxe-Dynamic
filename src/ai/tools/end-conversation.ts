'use server';

import { ai } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

// A selection of polite closing messages.
const closingMessages = [
    "Был рад помочь! Если появятся новые вопросы, обращайтесь. Приятного вам дня!",
    "Всегда к вашим услугам. Было приятно пообщаться! До скорой встречи.",
    "Пожалуйста! Если что, я здесь. Хорошего вам вечера!",
];

export const endConversationTool = ai.defineTool(
    {
        name: 'endConversationTool',
        description: 'Use this tool to end the conversation when the user says goodbye or indicates they are finished.',
        inputSchema: z.object({
            p_chat_id: z.number().describe('The user\'s telegram chat ID.'),
        }),
        outputSchema: z.string(),
    },
    async ({ p_chat_id }) => {
        console.log(`Executing endConversationTool for chat ID: ${p_chat_id}`);

        const supabase = createAdminClient();

        // Set the session as inactive in the database.
        const { error } = await supabase
            .from('chats')
            .update({ is_session_active: false })
            .eq('chat_id', p_chat_id);

        if (error) {
            console.error('Error updating session to inactive:', error);
            // Even if the DB update fails, we should still say goodbye politely.
            return 'Спасибо за общение! До свидания.';
        }

        // Return a random closing message for a more natural feel.
        const randomMessage = closingMessages[Math.floor(Math.random() * closingMessages.length)];
        return randomMessage;
    }
);
