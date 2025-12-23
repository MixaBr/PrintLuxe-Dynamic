
/**
 * @fileOverview A server-side tool for handling security-related actions.
 */
'use server';

import { createAdminClient } from "@/lib/supabase/service";

/**
 * Logs a security strike event to the `security_strikes` table.
 * This function only records the event and does not perform any counting or blocking logic.
 * 
 * @param chatId The Telegram chat ID of the user.
 * @param maliciousPrompt The prompt that was flagged as malicious.
 */
export async function logSecurityStrike(chatId: number, maliciousPrompt: string): Promise<void> {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase.from('security_strikes').insert({
            chat_id: chatId,
            last_malicious_prompt: maliciousPrompt,
        });

        if (error) {
            console.error('Error logging security strike event:', error);
        }

    } catch (e: any) {
        console.error('Critical error in logSecurityStrike:', e.message);
    }
}
