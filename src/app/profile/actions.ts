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
    phone: string;
    gender: string | null;
    birth_date: string | null;
    telegram_link: string;
    viber_phone: string;
  } = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone: formData.get('phone') as string,
    gender: genderValue === 'not_selected' ? null : genderValue,
    birth_date: formData.get('birth_date') as string,
    telegram_link: formData.get('telegram_link') as string,
    viber_phone: formData.get('viber_phone') as string,
  };

  if (profileData.birth_date === '') {
      profileData.birth_date = null;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('user_id', user.id);

  if (updateError) {
    return redirect('/profile?error=' + encodeURIComponent('Не удалось обновить профиль: ' + updateError.message));
  }

  revalidatePath('/profile');

  redirect('/profile?success=' + encodeURIComponent('Профиль успешно обновлен!'));
}
