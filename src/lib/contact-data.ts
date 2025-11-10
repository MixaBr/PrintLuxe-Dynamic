
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
    map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.38533819864!2d37.6155613159307!3d55.75222098055453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa66eb1a3c1b5a57b!2sRed%20Square!5e0!3m2!1sen!2sru!4v1622033321487!5m2!1sen!2sru"
}

export async function getContactPageData(): Promise<ContactPageData> {
  const supabase = createClient();
  // Fetch a broader range of keys, including the new ones
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
        'contact_main_title', 
        'contact_main_subtitle', 
        'contact_info_title', 
        'contact_form_title',
        'pickup_address', // Use the correct key for the address
        'contact_phone_1', 
        'contact_phone_2', 
        'contact_email_main', 
        'contact_telegram_link', // New key
        'contact_viber_link',    // New key
        'contact_map_embed_url'
    ]);

  if (error) {
    console.error('Error fetching contact page data:', error);
    return { ...defaultData, error: 'Не удалось загрузить данные для страницы.' } as ContactPageData;
  }

  if (!data) {
    return { ...defaultData, error: 'Данные для страницы "Контакты" не найдены.' } as ContactPageData;
  }

  // Reduce data into a structured object, cleaning keys
  const settingsData = data.reduce<any>((acc, { key, value }) => {
    const cleanedKey = key.startsWith('contact_') ? key.substring(8) : key;
    if (value) {
        acc[cleanedKey] = value;
    }
    return acc;
  }, {});

  // Explicitly map pickup_address to address
  const finalData: Partial<ContactPageData> = {
      main_title: settingsData.main_title,
      main_subtitle: settingsData.main_subtitle,
      info_title: settingsData.info_title,
      form_title: settingsData.form_title,
      address: settingsData.pickup_address, // Map pickup_address to the address field
      phone_1: settingsData.phone_1,
      phone_2: settingsData.phone_2,
      email_main: settingsData.email_main,
      telegram_link: settingsData.telegram_link,
      viber_link: settingsData.viber_link,
      map_embed_url: settingsData.map_embed_url,
  }

  // Merge fetched data with defaults to ensure all fields are present
  return { ...defaultData, ...finalData };
}
