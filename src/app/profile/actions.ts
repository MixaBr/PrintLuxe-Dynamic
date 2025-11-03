'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }
  
  const genderValue = formData.get('gender') as string;

  const profileData: {
    first_name: string;
    last_name: string;
    phone: string | null;
    gender: string | null;
    birth_date: string | null;
    telegram_link: string | null;
    viber_phone: string | null;
  } = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone: formData.get('phone') as string,
    gender: genderValue === 'not_selected' ? null : genderValue,
    birth_date: formData.get('birth_date') as string,
    telegram_link: formData.get('telegram_link') as string,
    viber_phone: formData.get('viber_phone') as string,
  };

  // Convert empty strings to null for nullable fields
  if (profileData.birth_date === '') {
      profileData.birth_date = null;
  }
  if (profileData.phone === '') {
      profileData.phone = null;
  }
  if (profileData.telegram_link === '') {
      profileData.telegram_link = null;
  }
  if (profileData.viber_phone === '') {
      profileData.viber_phone = null;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return redirect('/profile?error=' + encodeURIComponent('Не удалось обновить профиль: ' + updateError.message));
  }

  revalidatePath('/profile');
  redirect('/profile?success=' + encodeURIComponent('Профиль успешно обновлен!'));
}

export async function deleteAccount(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const token = formData.get('g-recaptcha-response') as string;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
      return redirect('/profile?error=' + encodeURIComponent('Пожалуйста, пройдите проверку reCAPTCHA.'));
  }

  // Verify reCAPTCHA token
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
          return redirect('/profile?error=' + encodeURIComponent('Проверка reCAPTCHA не удалась. Попробуйте еще раз.'));
      }
  } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return redirect('/profile?error=' + encodeURIComponent('Ошибка при проверке reCAPTCHA.'));
  }

  // Update profile status to 'archived'
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'archived' })
    .eq('user_id', user.id);

  if (updateError) {
    return redirect('/profile?error=' + encodeURIComponent('Не удалось удалить профиль: ' + updateError.message));
  }

  // Sign the user out from all devices/sessions
  await supabase.auth.signOut({ scope: 'global' });
  
  // Revalidate path and redirect
  revalidatePath('/'); // Revalidate the whole site to reflect logout
  redirect('/login?message=' + encodeURIComponent('Ваш аккаунт был успешно удален.'));
}


export async function addOrUpdateAddress(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Пользователь не авторизован' };
    }

    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();

    if (!profile) {
        return { error: 'Профиль пользователя не найден' };
    }

    const addressId = formData.get('id') as string;
    const addressData = {
        profile_id: profile.id,
        address_type: (formData.get('address_type') as string) || null,
        country: (formData.get('country') as string) || null,
        postal_code: (formData.get('postal_code') as string) || null,
        city: (formData.get('city') as string) || null,
        street: (formData.get('street') as string) || null,
        building: (formData.get('building') as string) || null,
        housing: (formData.get('housing') as string) || null,
        apartment: (formData.get('apartment') as string) || null,
    };

    let error;
    if (addressId) {
        // Update existing address
        const { error: updateError } = await supabase.from('addresses').update(addressData).eq('id', addressId);
        error = updateError;
    } else {
        // Create new address
        const { error: insertError } = await supabase.from('addresses').insert(addressData);
        error = insertError;
    }

    if (error) {
        console.error('Address operation error:', error);
        return { error: `Не удалось сохранить адрес: ${error.message}` };
    }

    revalidatePath('/profile');
    return { success: 'Адрес успешно сохранен!' };
}

export async function deleteAddress(addressId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Пользователь не авторизован' };
    }

    const { error } = await supabase.from('addresses').delete().eq('id', addressId);

    if (error) {
        console.error('Delete address error:', error);
        return { error: `Не удалось удалить адрес: ${error.message}` };
    }

    revalidatePath('/profile');
    return { success: 'Адрес успешно удален!' };
}
