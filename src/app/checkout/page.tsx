
import { createClient } from '@/lib/supabase/server';
import CheckoutClient from './CheckoutClient';
import { redirect } from 'next/navigation';
import type { Address } from '@/lib/definitions';

async function getPickupAddress() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'pickup_address')
        .single();
    
    if (error) {
        console.error("Error fetching pickup address:", error.message);
        return null;
    }
    return data.value;
}

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    const { data: addresses } = await supabase.from('addresses').select('*').eq('profile_id', profile?.id);
    
    userProfile = {
      id: user.id,
      email: user.email,
      profile: profile || {},
      addresses: (addresses as Address[]) || [],
    };
  }

  const pickupAddress = await getPickupAddress();

  return <CheckoutClient user={userProfile} pickupAddress={pickupAddress} />;
}
