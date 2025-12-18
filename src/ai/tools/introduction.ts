/**
 * @fileOverview A simple function to generate a welcome message for new users.
 * This is not a Genkit tool because its logic is deterministic and doesn't require an LLM.
 */
'use server';

/**
 * Generates a standardized welcome message for a new user.
 * @param userName - The user's name from their Telegram profile.
 * @returns A welcome string.
 */
export function getIntroduction(userName?: string | null): string {
    let response = "Здравствуйте! Я PrintLux Helper, ваш AI-ассистент по ремонту принтеров.";

    if (userName) {
        response += ` Могу ли я обращаться к вам как '${userName}'? Или, если вы предпочитаете другое имя, просто напишите его.`;
    } else {
        response += " Как я могу к вам обращаться?";
    }

    return response;
}
