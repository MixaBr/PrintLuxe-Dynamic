'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const emailSchema = z.string().email({ message: 'Неверный формат email.' });
const passwordSchema = z.string().min(6, { message: 'Пароль должен содержать не менее 6 символов.' });

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  
  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    return { error: emailValidation.error.errors[0].message };
  }

  const passwordValidation = passwordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return { error: passwordValidation.error.errors[0].message };
  }

  const supabase = createClient()

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !authData.user) {
    return { error: 'Неверные учетные данные. Пожалуйста, попробуйте снова.' };
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('status')
    .eq('user_id', user.id)
    .single();

  if (profile && profile.status === 'archived') {
    // Immediately sign out to clear the session cookie that was just set.
    // This prevents the session from ever being established in the browser.
    await supabase.auth.signOut();
    
    // As a security measure, also revoke all tokens for this user on the server.
    const { error: adminSignOutError } = await supabase.auth.admin.signOut(user.id);
    if (adminSignOutError) {
        console.error("Admin sign out error:", adminSignOutError);
    }

    return { error: 'ACCOUNT_ARCHIVED' };
  }

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = row not found
    console.error("Profile fetch error:", profileError);
    // Also sign out here to be safe
    await supabase.auth.signOut();
    return { error: 'Произошла ошибка при проверке вашего профиля.' };
  }

  revalidatePath('/', 'layout')
  redirect('/profile')
}

export async function signUp(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    return { error: emailValidation.error.errors[0].message };
  }

  const passwordValidation = passwordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return { error: passwordValidation.error.errors[0].message };
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });

  if (error) {
    console.error('Sign up error:', error.message);
    if (error.message.includes('unique constraint')) {
        return { error: 'Пользователь с таким email уже существует.' };
    }
    return { error: `Произошла ошибка при регистрации: ${error.message}` };
  }
  
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: 'Пользователь с таким email уже существует, но не подтвержден.' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
