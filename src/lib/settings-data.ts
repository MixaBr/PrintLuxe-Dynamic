
import { createClient } from './supabase/server';

/**
 * Fetches the most recent 'updated_at' timestamp from the 'settings' table
 * for all entries matching a given key prefix.
 * This helps determine the last modification date for dynamic pages.
 *
 * @param keyPrefix - The prefix for the keys to look for (e.g., 'about_', 'contact_').
 * @returns A Date object of the last modification, or the current date as a fallback.
 */
export async function getPageLastModified(keyPrefix: string): Promise<Date> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('updated_at')
    .like('key', `${keyPrefix}%`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.updated_at) {
    console.error(`Error fetching last modified date for ${keyPrefix}:`, error?.message);
    // Return current date as a fallback to ensure the sitemap is always valid.
    return new Date();
  }

  return new Date(data.updated_at);
}

/**
 * Fetches the text for the running line from the 'settings' table.
 * @returns A promise that resolves to the text string or null.
 */
export async function getRunningLineText(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'running_line_text')
    .single();

  if (error) {
    console.error('Error fetching running line text:', error);
    return null;
  }

  return data?.value || null;
}
