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
