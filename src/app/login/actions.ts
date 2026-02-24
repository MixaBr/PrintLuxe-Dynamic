
'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { cookies, headers } from "next/headers"

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

  // Update last login time
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
      // Log the error but don't block the login process
      console.error('Failed to update last login time:', updateError);
  }

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
  const consent = formData.get("consent") as string;

  if (consent !== 'true') {
    return { error: 'Вы должны дать согласие на обработку персональных данных.' };
  }

  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    return { error: emailValidation.error.errors[0].message };
  }

  const passwordValidation = passwordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return { error: passwordValidation.error.errors[0].message };
  }

  const token = formData.get('g-recaptcha-response') as string;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
      return { error: 'Пожалуйста, пройдите проверку reCAPTCHA.' };
  }

  try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${secretKey}&response=${token}`,
      });
      const recaptchaData = await response.json();

      if (!recaptchaData.success) {
          return { error: 'Проверка reCAPTCHA не удалась. Попробуйте еще раз.' };
      }
  } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return { error: 'Ошибка при проверке reCAPTCHA.' };
  }

  const supabase = createClient();

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

  if (data.user) {
    const adminSupabase = createAdminClient();
    const consentGivenAt = new Date();
    const userId = data.user.id;
    
    // Step 1: Update the profile with the consent timestamp.
    const { error: profileUpdateError } = await adminSupabase
      .from('profiles')
      .update({ pd_consent_given_at: consentGivenAt.toISOString() })
      .eq('user_id', userId);
    
    if (profileUpdateError) {
        console.error('Failed to save consent timestamp to profile:', profileUpdateError);
        // Continue, but log this critical failure.
    }

    // Step 2: Replicate the RPC logic by fetching the profile ID first.
    const { data: profileData, error: profileSelectError } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (profileSelectError) {
        console.error('Failed to fetch profile ID for audit log:', profileSelectError);
    } else if (profileData) {
        // Step 3: Directly insert the audit record.
        const { error: auditInsertError } = await adminSupabase
            .from('orders_pd_consent_audit')
            .insert({
                profile_id: profileData.id,
                old_pd_consent: false,
                new_pd_consent: true,
                changed_by: userId,
                operation: 'registration',
                changed_at: consentGivenAt.toISOString(),
                actor_type: 'user'
            });

        if (auditInsertError) {
            console.error('Failed to create registration consent audit record via direct insert:', auditInsertError);
        }
    } else {
        console.error('Could not find profile for audit log even after update. Profile ID not found for user_id:', userId);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
