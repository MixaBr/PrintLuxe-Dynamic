'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

type FormState = {
    message: string;
    status: 'idle' | 'success' | 'error';
};

export async function updateSettings(prevState: FormState, formData: FormData): Promise<FormState> {
    const supabase = createAdminClient();
    const settingsToUpdate = [];

    for (const [key, value] of formData.entries()) {
        settingsToUpdate.push({
            key,
            value: value.toString()
        });
    }

    try {
        const updatePromises = settingsToUpdate.map(setting =>
            supabase
                .from('app_config')
                .update({ value: setting.value })
                .eq('key', setting.key)
        );

        const results = await Promise.all(updatePromises);
        
        const firstError = results.find(result => result.error);
        if (firstError?.error) {
            throw firstError.error;
        }

        revalidatePath('/', 'layout');
        
        return {
            status: 'success',
            message: 'Настройки успешно обновлены!'
        };

    } catch (error: any) {
        console.error('Error updating settings:', error);
        return {
            status: 'error',
            message: `Не удалось обновить настройки: ${error.message}`
        };
    }
}

/**
 * Deletes all documents from the knowledge base and resets the ID sequence.
 * This is now done by calling the `truncate_manual_knowledge` RPC function in the database.
 */
export async function clearKnowledgeBase(): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = createAdminClient();
        // Instead of deleting, we call a stored procedure (RPC) to truncate the table
        // and reset the primary key sequence. This is more efficient and cleaner.
        const { error } = await supabase.rpc('truncate_manual_knowledge');

        if (error) {
            throw new Error(`Ошибка Supabase RPC: ${error.message}. Убедитесь, что вы создали функцию truncate_manual_knowledge в вашей базе данных.`);
        }
        
        revalidatePath('/admin/content');
        return { success: true, message: 'База знаний успешно очищена, счетчик ID сброшен!' };

    } catch (e: any) {
        console.error('Failed to clear knowledge base:', e);
        return { success: false, message: `Не удалось очистить базу знаний: ${e.message}` };
    }
}
