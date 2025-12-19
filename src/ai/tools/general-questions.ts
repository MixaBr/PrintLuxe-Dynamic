import { ai } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

export const generalQuestionsTool = ai.defineTool(
    {
        name: 'generalQuestions',
        description: 'Tool for answering general questions about the company. Use this to get context about the company from the database.',
        inputSchema: z.object({}), // No parameters needed, it fetches context dynamically.
        outputSchema: z.string(),
    },
    async () => {
        // This tool is designed to run on the server side, where it has access to the database.
        console.log('Executing generalQuestionsTool to fetch company context from DB.');

        const supabase = createAdminClient();

        // The 'settings' table is expected to have 'key' and 'value' columns.
        // We fetch all settings to build a comprehensive context for the AI.
        const {
            data: settings,
            error,
        } = await supabase.from('settings').select('key, value');

        if (error) {
            console.error('Error fetching company settings:', error);
            return 'К сожалению, я не смог получить информацию о компании. Пожалуйста, попробуйте позже.';
        }

        if (!settings || settings.length === 0) {
            return 'Информация о компании не настроена. Не могу ответить на вопрос.';
        }

        // Dynamically build the context string from all available settings.
        let context = 'Контекст о компании:\n';
        for (const setting of settings) {
            // Replace underscores with spaces and capitalize for better readability in the context.
            const formattedKey = setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            context += `- ${formattedKey}: ${setting.value}\n`;
        }

        // This context is not returned to the user directly.
        // It's passed back to the AI model, which will then use this information
        // to answer the user's original question.
        return context;
    }
);
