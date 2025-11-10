
'use server';

import { createClient } from './supabase/server';

export interface ContactPageData {
  main_title?: string;
  main_subtitle?: string;
  info_title?: string;
  form_title?: string;
  address?: string;
  phone_1?: string;
  phone_2?: string;
  email_main?: string;
  telegram_link?: string;
  viber_link?: string;
  map_embed_url?: string;
  error?: string;
}

const defaultData: Partial<ContactPageData> = {
    main_title: "Свяжитесь с нами",
    main_subtitle: "Мы всегда рады помочь вам. Задайте вопрос или сделайте заказ.",
    info_title: "Контактная информация",
    form_title: "Отправить сообщение",
    map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2350.852182285878!2d27.59253407722746!3d53.90022897247345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dbcfae3146097d%3A0xb48b5785536551b8!2z0L_RgNC-0YHQvy4g0JzQsNC90YjQuNC90LAsIDgvMSwg0JzQuNC90YHQug!5e0!3m2!1sru!2sby!4v1720528224536!5m2!1sru!2sby"
}

export async function getContactPageData(): Promise<ContactPageData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
        'contact_main_title', 
        'contact_main_subtitle', 
        'contact_info_title', 
        'contact_form_title',
        'pickup_address',
        'contact_phone_1', 
        'contact_phone_2', 
        'contact_email_main', 
        'telegram_link', // Correct key for Telegram
        'viber_link',    // Correct key for Viber
        'contact_map_embed_url'
    ]);

  if (error) {
    console.error('Error fetching contact page data:', error);
    return { ...defaultData, error: 'Не удалось загрузить данные для страницы.' } as ContactPageData;
  }

  if (!data) {
    return { ...defaultData, error: 'Данные для страницы "Контакты" не найдены.' } as ContactPageData;
  }

  const settingsData = data.reduce<any>((acc, { key, value }) => {
    if (value) {
        acc[key] = value;
    }
    return acc;
  }, {});

  // Map the full keys to the desired simple property names.
  const finalData: Partial<ContactPageData> = {
      main_title: settingsData.contact_main_title,
      main_subtitle: settingsData.contact_main_subtitle,
      info_title: settingsData.contact_info_title,
      form_title: settingsData.contact_form_title,
      address: settingsData.pickup_address,
      phone_1: settingsData.contact_phone_1,
      phone_2: settingsData.contact_phone_2,
      email_main: settingsData.contact_email_main,
      telegram_link: settingsData.telegram_link, // Correctly map this
      viber_link: settingsData.viber_link,       // And this
      map_embed_url: settingsData.contact_map_embed_url,
  }

  return { ...defaultData, ...finalData };
}
