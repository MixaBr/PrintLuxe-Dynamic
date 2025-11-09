
import { createClient } from './supabase/server';

export interface AboutPageData {
  main_title?: string;
  main_subtitle?: string;
  history_title?: string;
  history_p1?: string;
  history_p2?: string; // This might not be used based on the last user request, but good to have.
  mission_title?: string;
  mission_description?: string;
  values_title?: string;
  values_description?: string;
  workshop_image_url?: string;
  error?: string;
}

// This function fetches all key-value pairs from the settings table where the key starts with 'about_'.
// It then transforms the array of {key, value} into a single structured object.
export async function getAboutPageData(): Promise<AboutPageData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'about_%');

  if (error) {
    console.error('Error fetching about page data:', error);
    return { error: 'Не удалось загрузить данные для страницы.' };
  }

  if (!data) {
    return { error: 'Данные для страницы "О нас" не найдены.' };
  }

  // Transform the array of {key, value} into a single object e.g. { main_title: 'Value', ... }
  const aboutData = data.reduce<any>((acc, { key, value }) => {
    const cleanedKey = key.replace('about_', '');
    acc[cleanedKey] = value;
    return acc;
  }, {});

  return aboutData as AboutPageData;
}
