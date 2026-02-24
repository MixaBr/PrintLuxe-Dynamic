/**
 * @fileOverview Server actions for the system maintenance page.
 */
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper function to check for admin role
async function isAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roleData, error } = await supabase
        .from('role_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
    
    if (error) {
        console.error("Role check error:", error);
        return false;
    }
    
    return roleData?.role === 'admin';
}

/**
 * Fetches the list of all user-created tables in the public schema.
 * @returns A promise that resolves to an array of table names or an error object.
 */
export async function getDatabaseTables(): Promise<{ tables?: string[]; error?: string; }> {
    if (!await isAdmin()) {
        return { error: 'Доступ запрещен. Требуются права администратора.' };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('get_user_tables');
    
    if (error) {
        console.error('Error fetching database tables:', error);
        return { error: `Не удалось получить список таблиц: ${error.message}` };
    }
    
    // The RPC returns an array of objects like [{ table_name: '...' }], so we map it.
    return { tables: data.map((item: { table_name: string }) => item.table_name) };
}

/**
 * Truncates a specific table, deleting all its data.
 * @param tableName The name of the table to reset.
 * @returns A promise that resolves to a success or error message.
 */
export async function resetTable(tableName: string): Promise<{ success?: string; error?: string; }> {
    if (!await isAdmin()) {
        return { error: 'Доступ запрещен. Требуются права администратора.' };
    }
    
    // Safety check to prevent accidental truncation of critical tables
    const protectedTables = ['profiles', 'role_users', 'roles'];
    if (protectedTables.includes(tableName)) {
        return { error: `Таблицу "${tableName}" нельзя очищать из этого интерфейса.` };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.rpc('truncate_table_by_name', { p_table_name: tableName });

    if (error) {
        console.error(`Error truncating table ${tableName}:`, error);
        return { error: `Ошибка при очистке таблицы "${tableName}": ${error.message}` };
    }

    revalidatePath('/admin/system');
    return { success: `Таблица "${tableName}" была успешно очищена.` };
}
