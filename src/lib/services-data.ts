
'use server';

import { supabase } from './supabaseClient'; // Use simple client for ISR

export interface Service {
  title: string;
  description: string;
}

export interface ServicesPageData {
  main_title: string;
  main_subtitle: string;
  services: Service[];
  error?: string;
}

export async function getServicesPageData(): Promise<ServicesPageData> {
  const defaultData: ServicesPageData = {
    main_title: 'Наши Услуги',
    main_subtitle: 'Мы предлагаем широкий спектр услуг для вашей техники.',
    services: [],
  };

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'service%');

    if (error) {
      console.error('Error fetching services page data:', error);
      return { ...defaultData, error: 'Не удалось загрузить данные для страницы услуг.' };
    }

    if (!data) {
      return { ...defaultData, error: 'Данные для страницы услуг не найдены.' };
    }

    const settingsMap = data.reduce<Record<string, string>>((acc, { key, value }) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const services: Service[] = [];
    for (let i = 1; i <= 6; i++) {
      const title = settingsMap[`service_${i}_title`];
      const description = settingsMap[`service_${i}_description`];
      if (title && description) {
        services.push({ title, description });
      }
    }

    return {
      main_title: settingsMap.services_page_title || defaultData.main_title,
      main_subtitle: settingsMap.services_page_description || defaultData.main_subtitle,
      services,
    };
  } catch (e: any) {
    console.error('Critical error in getServicesPageData:', e);
    return { ...defaultData, error: `Критическая ошибка: ${e.message}` };
  }
}
