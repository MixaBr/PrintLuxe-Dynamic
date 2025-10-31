
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
  } = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone: formData.get('phone') as string,
    gender: genderValue === 'not_selected' ? null : genderValue,
    birth_date: formData.get('birth_date') as string,
  };
  
  // Ensure empty string is converted to null for the database
  if (profileData.birth_date === '') {
    profileData.birth_date = null;
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    // Optionally, redirect with an error message
    return redirect('/profile?error=' + encodeURIComponent('Не удалось обновить профиль.'));
  }

  revalidatePath('/profile');
  redirect('/profile?success=' + encodeURIComponent('Профиль успешно обновлен!'));
}
