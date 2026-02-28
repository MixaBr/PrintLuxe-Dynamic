
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Merged type for our user list
export type UserWithRoleAndProfile = {
  id: string;
  email: string | undefined;
  created_at: string;
  last_sign_in_at: string | undefined;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  role: string;
};

// Action to get all users
export async function getUsers(): Promise<{ users: UserWithRoleAndProfile[], error?: string }> {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Fetch all users from auth.users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw new Error(`Ошибка при загрузке пользователей: ${authError.message}`);

    const userIds = authUsers.map(u => u.id);

    // 2. Fetch all corresponding profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', userIds);
    if (profilesError) throw new Error(`Ошибка при загрузке профилей: ${profilesError.message}`);

    // 3. Fetch all roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('role_users')
      .select('*')
      .in('user_id', userIds);
    if (rolesError) throw new Error(`Ошибка при загрузке ролей: ${rolesError.message}`);

    // 4. Merge the data
    const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
    const rolesMap = new Map(roles.map(r => [r.user_id, r.role]));

    const mergedUsers: UserWithRoleAndProfile[] = authUsers.map(user => {
      const profile = profilesMap.get(user.id);
      const role = rolesMap.get(user.id) || 'buyer'; // Default to 'buyer'

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        status: profile?.status || 'active',
        role,
      };
    });

    return { users: mergedUsers };
  } catch (error: any) {
    console.error('[getUsers action Error]', error);
    return { users: [], error: error.message };
  }
}

// Action to update a user's role
export async function updateUserRole(userId: string, role: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('role_users').upsert({ user_id: userId, role: role }, { onConflict: 'user_id' });
    if (error) throw error;
    
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUserRole action Error]', error);
    return { error: `Не удалось обновить роль: ${error.message}` };
  }
}

// Action to update a user's status
export async function updateUserStatus(userId: string, status: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ status: status })
      .eq('user_id', userId);
      
    if (error) throw error;
    
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUserStatus action Error]', error);
    return { error: `Не удалось обновить статус: ${error.message}` };
  }
}

// Action to delete a user
export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    // Prevent admin from deleting themselves
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.id === userId) {
      throw new Error('Вы не можете удалить свой собственный аккаунт.');
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteUser action Error]', error);
    return { error: `Не удалось удалить пользователя: ${error.message}` };
  }
}
