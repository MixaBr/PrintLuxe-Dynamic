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
    return redirect('/login?error=' + encodeURIComponent(emailValidation.error.errors[0].message));
  }

  const passwordValidation = passwordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return redirect('/login?error=' + encodeURIComponent(passwordValidation.error.errors[0].message));
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=' + encodeURIComponent('Неверные учетные данные. Пожалуйста, попробуйте снова.'));
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