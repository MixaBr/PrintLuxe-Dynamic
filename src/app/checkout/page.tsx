
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import { redirect } from 'next/navigation';
import type { Address } from '@/lib/definitions';

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    const { data: addresses } = await supabase.from('addresses').select('*').eq('profile_id', profile.id);
    
    userProfile = {
      id: user.id,
      email: user.email,
      profile: profile || {},
      addresses: (addresses as Address[]) || [],
    };
  }

  return <CheckoutClient user={userProfile} />;
}
