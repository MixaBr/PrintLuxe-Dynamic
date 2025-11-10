
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
  map_embed_url?: string;
  error?: string;
}

const defaultData: ContactPageData = {
    main_title: "Свяжитесь с нами",
    main_subtitle: "Мы всегда рады помочь вам. Задайте вопрос или сделайте заказ.",
    info_title: "Контактная информация",
    form_title: "Отправить сообщение",
    address: "123456, г. Москва, ул. Центральная, д. 1, офис 101",
    phone_1: "+7 (495) 123-45-67",
    email_main: "contact@printlux.com",
    map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.38533819864!2d37.6155613159307!3d55.75222098055453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa66eb1a3c1b5a57b!2sRed%20Square!5e0!3m2!1sen!2sru!4v1622033321487!5m2!1sen!2sru"
}

export async function getContactPageData(): Promise<ContactPageData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'contact_%');

  if (error) {
    console.error('Error fetching contact page data:', error);
    return { ...defaultData, error: 'Не удалось загрузить данные для страницы.' };
  }

  if (!data) {
    return { ...defaultData, error: 'Данные для страницы "Контакты" не найдены.' };
  }

  const contactData = data.reduce<any>((acc, { key, value }) => {
    const cleanedKey = key.replace('contact_', '');
    if (value) { // Only add if value is not null or empty
        acc[cleanedKey] = value;
    }
    return acc;
  }, {});

  return { ...defaultData, ...contactData };
}
