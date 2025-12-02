'use server';

import { createClient } from './supabase/server';

/**
 * Fetches the company registration information from the 'settings' table.
 *
 * @returns A string containing the company information, or an error message.
 */
export async function getCompanyRegistrationInfo(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'company_registration_info')
    .single();

  if (error || !data?.value) {
    console.error('Error fetching company registration info:', error?.message);
    return 'Не удалось загрузить регистрационную информацию. Пожалуйста, попробуйте позже.';
  }

  return data.value;
}
