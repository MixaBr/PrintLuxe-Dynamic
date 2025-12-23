
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
        const { error: logError } = await supabase.from('security_strikes').insert({
            chat_id: chatId,
            prompt_text: maliciousPrompt, // CORRECTED column name
        });

        if (logError) {
            console.error('Error logging security strike:', logError);
            // Decide if we should proceed. For now, we will, but this is a potential failure point.
        }

        // 2. Get the new total count of strikes for this user.
        const { count, error: countError } = await supabase
            .from('security_strikes')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chatId);

        if (countError) {
            console.error('Error counting security strikes:', countError);
            return 99; // Return a high number to ensure blocking if counting fails.
        }

        const strikeCount = count || 0;

        // 3. If the strike count reaches the threshold, block the user.
        // This logic is now handled in the main assistant flow to ensure it's explicit.
        
        return strikeCount;

    } catch (e: any) {
        console.error('Critical error in handleSecurityStrike:', e.message);
        return 99; // Return a high number on critical failure.
    }
}
