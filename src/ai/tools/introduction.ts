/**
 * @fileOverview A simple function to generate a welcome message for new users.
 * This is a simple formatter, not a Genkit tool or flow.
 */

const defaultWelcomeMessage = "Здравствуйте! Я PrintLux Helper, ваш AI-ассистент. Как я могу к вам обращаться?";

/**
 * Formats a welcome message for a new user using a template.
 * @param template - The template string, which can include {{userName}}.
 * @param userName - The user's name from their Telegram profile (optional).
 * @returns A formatted welcome string.
 */
export function getIntroduction(template?: string | null, userName?: string | null): string {
    const messageTemplate = template || defaultWelcomeMessage;

    // Replace placeholder if userName is provided.
    if (userName) {
        // This handles templates that might have a placeholder.
        return messageTemplate.replace('{{userName}}', userName);
    }

    // If no userName, return the template as is.
    // It's assumed to be a generic welcome message in this case.
    return messageTemplate;
}
