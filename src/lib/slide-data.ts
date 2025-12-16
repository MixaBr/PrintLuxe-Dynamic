
import { supabase } from './supabaseClient';

// Type definitions for the structured data
export type Service = {
  icon: string;
  title: string;
  description: string;
};

export type Benefit = {
  icon: string;
  title: string;
  description: string;
};

export type HomePageData = {
  hero: { title: string; subtitle: string; };
  featured: { title: string; subtitle: string; ids: number[]; };
  services: { title: string; subtitle: string; list: Service[]; };
  benefits: { title: string; subtitle: string; list: Benefit[]; };
  error?: string; // Optional error field
};

// Default data structure to be used in case of any error
const defaultData: Omit<HomePageData, 'error'> = {
  hero: { title: 'Надежный сервис', subtitle: 'для вашей техники' },
  featured: { title: 'Витрина популярных позиций каталога', subtitle: 'Всегда в наличии', ids: [] },
  services: { title: 'Что мы предлагаем', subtitle: 'Комплексный подход', list: [] },
  benefits: { title: 'Почему выбирают нас', subtitle: 'Гарантия качества', list: [] },
};


// Helper to safely get and parse values
const getValue = (settings: { key: string; value: string }[] | null, key: string, defaultValue: string = ''): string => {
  const item = settings?.find(s => s.key === key);
  return item?.value ?? defaultValue;
};

const parseJson = <T>(jsonString: string, defaultVal: T): T => {
  if (!jsonString) return defaultVal;
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed === null) return defaultVal;
    return parsed as T;
  } catch (e) {
    console.error(`Failed to parse JSON for string: ${jsonString}`, e);
    return defaultVal;
  }
};

// Main function to fetch all home page data from Supabase
export async function getHomePageData(): Promise<HomePageData> {
  try {
    const keys = [
      'home_hero_title', 'home_hero_subtitle',
      'home_featured_parts_title', 'home_featured_parts_subtitle', 'home_featured_part_uuids',
      'home_services_title', 'home_services_subtitle', 'home_services_list',
      'home_benefits_title', 'home_benefits_subtitle', 'home_benefits_list'
    ];

    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys);

    if (error) {
      console.error('Error fetching home page settings from Supabase:', error);
      // FIX: Return only the error message, not the whole object
      return { ...defaultData, error: `Ошибка базы данных: ${error.message}` };
    }

    return {
      hero: {
        title: getValue(settings, 'home_hero_title', defaultData.hero.title),
        subtitle: getValue(settings, 'home_hero_subtitle', defaultData.hero.subtitle),
      },
      featured: {
        title: getValue(settings, 'home_featured_parts_title', defaultData.featured.title),
        subtitle: getValue(settings, 'home_featured_parts_subtitle', defaultData.featured.subtitle),
        ids: parseJson<number[]>(getValue(settings, 'home_featured_part_uuids'), []),
      },
      services: {
        title: getValue(settings, 'home_services_title', defaultData.services.title),
        subtitle: getValue(settings, 'home_services_subtitle', defaultData.services.subtitle),
        list: parseJson<Service[]>(getValue(settings, 'home_services_list'), []),
      },
      benefits: {
        title: getValue(settings, 'home_benefits_title', defaultData.benefits.title),
        subtitle: getValue(settings, 'home_benefits_subtitle', defaultData.benefits.subtitle),
        list: parseJson<Benefit[]>(getValue(settings, 'home_benefits_list'), []),
      },
    };
  } catch (e: any) {
      console.error('A critical error occurred in getHomePageData:', e);
      // FIX: Return only the error message, not the whole object
      return { ...defaultData, error: `Критическая ошибка сервера: ${e.message}` };
  }
}
