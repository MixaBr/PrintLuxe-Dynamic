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
        // Обновляем каждую настройку по ее ключу
        const updatePromises = settingsToUpdate.map(setting =>
            supabase
                .from('app_config')
                .update({ value: setting.value })
                .eq('key', setting.key)
        );

        const results = await Promise.all(updatePromises);
        
        // Проверяем на наличие ошибок в результатах
        const firstError = results.find(result => result.error);
        if (firstError?.error) {
            throw firstError.error;
        }

        // Перепроверка пути, чтобы новые настройки вступили в силу
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
 * Deletes all documents from the knowledge base.
 */
export async function clearKnowledgeBase(): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('manual_knowledge').delete().gt('id', 0); // Deletes all rows

        if (error) {
            throw new Error(`Ошибка Supabase: ${error.message}`);
        }
        
        revalidatePath('/admin/content');
        return { success: true, message: 'База знаний успешно очищена!' };

    } catch (e: any) {
        console.error('Failed to clear knowledge base:', e);
        return { success: false, message: `Не удалось очистить базу знаний: ${e.message}` };
    }
}
