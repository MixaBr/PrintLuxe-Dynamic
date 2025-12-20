/**
 * @fileOverview A server-side tool for handling security-related actions.
 */
'use server';

import { createAdminClient } from "@/lib/supabase/service";

/**
 * Calls a Supabase RPC function to log a security strike against a user
 * and returns the new strike count.
 * This function will automatically block the user in the 'chats' table
 * if the strike count threshold is met (as defined in the RPC function).
 * 
 * @param chatId The Telegram chat ID of the user.
 * @param maliciousPrompt The prompt that was flagged as malicious.
 * @returns The user's new total strike count.
 */
export async function handleSecurityStrike(chatId: number, maliciousPrompt: string): Promise<number> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc('handle_security_strike', {
            p_chat_id: chatId,
            p_malicious_prompt: maliciousPrompt
        });

        if (error) {
            console.error('Error calling handle_security_strike RPC:', error);
            // Return a high number to ensure blocking logic proceeds if RPC fails
            return 99; 
        }

        return data;

    } catch (e: any) {
        console.error('Critical error in handleSecurityStrike:', e.message);
        return 99;
    }
}
