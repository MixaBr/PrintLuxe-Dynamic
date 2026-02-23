
'use server';

import { supabase } from './supabaseClient'; // Use simple client for ISR/SSG

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPageData {
  main_title: string;
  main_subtitle: string;
  faqs: FaqItem[];
  error?: string;
}

export async function getFaqPageData(): Promise<FaqPageData> {
  const defaultData: FaqPageData = {
    main_title: 'Часто задаваемые вопросы',
    main_subtitle: 'Здесь вы найдете ответы на самые популярные вопросы.',
    faqs: [],
  };

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'faq_%');

    if (error) {
      console.error('Error fetching FAQ page data:', error);
      return { ...defaultData, error: 'Не удалось загрузить данные для страницы FAQ.' };
    }

    if (!data) {
      return { ...defaultData, error: 'Данные для страницы FAQ не найдены.' };
    }

    const settingsMap = data.reduce<Record<string, string>>((acc, { key, value }) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const faqs: FaqItem[] = [];
    const questionKeys = Object.keys(settingsMap).filter(k => k.endsWith('_question')).sort();
    
    for (const qKey of questionKeys) {
        const baseKey = qKey.replace('_question', '');
        const aKey = `${baseKey}_answer`;
        
        const question = settingsMap[qKey];
        const answer = settingsMap[aKey];

        if (question && answer) {
            faqs.push({ question, answer });
        }
    }

    return {
      main_title: settingsMap.faq_page_title || defaultData.main_title,
      main_subtitle: settingsMap.faq_page_subtitle || defaultData.main_subtitle,
      faqs,
    };
  } catch (e: any) {
    console.error('Critical error in getFaqPageData:', e);
    return { ...defaultData, error: `Критическая ошибка: ${e.message}` };
  }
}
