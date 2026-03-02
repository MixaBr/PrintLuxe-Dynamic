
'use server';

import { createAdminClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { User } from '@supabase/supabase-js';

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
  is_vip: boolean | null;
};

// Helper function to log admin actions
async function logAdminAction(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  adminUser: User,
  action: string,
  targetUser: { id: string; email?: string | undefined },
  details: object
) {
  const { error } = await supabaseAdmin.from('user_admin_audit_log').insert({
    admin_user_id: adminUser.id,
    admin_email: adminUser.email,
    target_user_id: targetUser.id,
    target_user_email: targetUser.email,
    action: action,
    details: details,
  });

  if (error) {
    console.error(`[Audit Log Failed] Action: ${action} on user ${targetUser.id} by admin ${adminUser.id}. Error:`, error);
  }
}

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
        is_vip: profile?.is_vip || false,
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
  const supabase = createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: 'Доступ запрещен. Требуются права администратора.' };
  }

  const supabaseAdmin = createAdminClient();
  
  try {
    // 1. Get old value for logging
    const { data: oldRoleData, error: oldRoleError } = await supabaseAdmin
      .from('role_users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (oldRoleError && oldRoleError.code !== 'PGRST116') throw oldRoleError;
    const oldRole = oldRoleData?.role || 'buyer';

    // 2. Perform the update
    const { error: upsertError } = await supabaseAdmin.from('role_users').upsert({ user_id: userId, role: role }, { onConflict: 'user_id' });
    if (upsertError) throw upsertError;

    // 3. Log the action
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUser && !targetUserError) {
        await logAdminAction(supabaseAdmin, adminUser, 'UPDATE_ROLE', { id: userId, email: targetUser.email }, {
            field: 'role',
            old_value: oldRole,
            new_value: role,
        });
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUserRole action Error]', error);
    return { error: `Не удалось обновить роль: ${error.message}` };
  }
}

// Action to update a user's status
export async function updateUserStatus(userId: string, status: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: 'Доступ запрещен. Требуются права администратора.' };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 1. Get old value for logging
    const { data: oldProfileData, error: oldProfileError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (oldProfileError && oldProfileError.code !== 'PGRST116') throw oldProfileError;
    const oldStatus = oldProfileData?.status || 'active';

    // 2. Perform the update
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: status })
      .eq('user_id', userId);
    if (updateError) throw updateError;
    
    // 3. Log the action
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUser && !targetUserError) {
      await logAdminAction(supabaseAdmin, adminUser, 'UPDATE_STATUS', { id: userId, email: targetUser.email }, {
        field: 'status',
        old_value: oldStatus,
        new_value: status,
      });
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUserStatus action Error]', error);
    return { error: `Не удалось обновить статус: ${error.message}` };
  }
}

// Action to update VIP status
export async function updateUserVipStatus(userId: string, isVip: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: 'Доступ запрещен. Требуются права администратора.' };
  }

  const supabaseAdmin = createAdminClient();
  
  try {
    // 1. Get old value for logging
    const { data: oldProfileData, error: oldProfileError } = await supabaseAdmin
      .from('profiles')
      .select('is_vip')
      .eq('user_id', userId)
      .single();

    if (oldProfileError && oldProfileError.code !== 'PGRST116') throw oldProfileError;
    const oldVipStatus = oldProfileData?.is_vip || false;
      
    // 2. Perform the update
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_vip: isVip, vip_since: isVip ? new Date().toISOString() : null })
      .eq('user_id', userId);
    if (updateError) throw updateError;
    
    // 3. Log the action
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUser && !targetUserError) {
      await logAdminAction(supabaseAdmin, adminUser, 'UPDATE_VIP_STATUS', { id: userId, email: targetUser.email }, {
        field: 'is_vip',
        old_value: oldVipStatus,
        new_value: isVip,
      });
    }
    
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[updateUserVipStatus action Error]', error);
    return { error: `Не удалось обновить VIP статус: ${error.message}` };
  }
}

// Action to delete a user
export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { error: 'Доступ запрещен. Требуются права администратора.' };
  }
  
  if (adminUser?.id === userId) {
    return { error: 'Вы не можете удалить свой собственный аккаунт.' };
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 1. Get user data before deleting for logging
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (targetUserError || !targetUser) {
        throw new Error(`Не удалось найти пользователя для удаления: ${targetUserError?.message || 'Пользователь не найден'}`);
    }
      
    // 2. Perform the deletion
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    // 3. Log the action
    await logAdminAction(supabaseAdmin, adminUser, 'DELETE_USER', { id: userId, email: targetUser.email }, {
      deleted_user_id: targetUser.id,
      deleted_user_email: targetUser.email,
      deleted_at: new Date().toISOString(),
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('[deleteUser action Error]', error);
    return { error: `Не удалось удалить пользователя: ${error.message}` };
  }
}
