/**
 * @fileOverview A simple function to generate a welcome message for new users.
 * This is not a Genkit tool because its logic is deterministic and doesn't require an LLM.
 * It now dynamically fetches the welcome message from the database.
 */
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { render } from "genkit";

const defaultWelcomeMessage = "Здравствуйте! Я PrintLux Helper, ваш AI-ассистент. Как я могу к вам обращаться?";

/**
 * Generates a standardized welcome message for a new user by fetching a template from the database.
 * @param userName - The user's name from their Telegram profile (optional).
 * @returns A welcome string.
 */
export async function getIntroduction(userName?: string | null): Promise<string> {
    const supabase = createAdminClient();
    
    // Fetch the welcome message template from the app_config table.
    const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'bot_welcome_message')
        .single();
    
    if (error || !data?.value) {
        console.error("Could not fetch 'bot_welcome_message' from DB, using default.", error);
        // Fallback to a hardcoded default if the DB call fails.
        return render({
            template: defaultWelcomeMessage,
            context: { userName }
        });
    }

    // Use the template from the database.
    // The template can contain placeholders like {{userName}}.
    const welcomeTemplate = data.value;

    return render({
        template: welcomeTemplate,
        context: { userName: userName || '' } // Pass userName to be rendered in the template
    });
}
