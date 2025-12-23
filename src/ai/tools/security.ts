
/**
 * @fileOverview A server-side tool for handling security-related actions.
 */
'use server';

import { createAdminClient } from "@/lib/supabase/service";

/**
 * Logs a security strike and, if the threshold is met, blocks the user.
 * 
 * @param chatId The Telegram chat ID of the user.
 * @param maliciousPrompt The prompt that was flagged as malicious.
 * @returns The user's new total strike count.
 */
export async function handleSecurityStrike(chatId: number, maliciousPrompt: string): Promise<number> {
    const supabase = createAdminClient();

    try {
        // 1. Log the new strike regardless.
        // This will now work since the UNIQUE constraint is removed.
        const { error: logError } = await supabase.from('security_strikes').insert({
            chat_id: chatId,
            last_malicious_prompt: maliciousPrompt,
        });

        if (logError) {
            // We still log the error, but we will proceed to count, as there might be old strikes.
            console.error('Error logging security strike:', logError);
        }

        // 2. Get the new total count of strikes for this user.
        const { count, error: countError } = await supabase
            .from('security_strikes')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId);

        if (countError) {
            console.error('Error counting security strikes:', countError);
            // On failure, return a high number to ensure user is blocked as a safety measure.
            return 99;
        }

        const strikeCount = count || 0;

        // 3. The blocking logic is handled in the calling flow (`assistant-flow.ts`)
        // which will check if strikeCount >= 2 and then update the `chats` table.
        // This function's only job is to log the event and return the new total count.
        
        return strikeCount;

    } catch (e: any) {
        console.error('Critical error in handleSecurityStrike:', e.message);
        // Return a high number on any unexpected critical failure to be safe.
        return 99;
    }
}
