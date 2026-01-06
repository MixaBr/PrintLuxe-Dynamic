
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
  working_hours?: string;
  map_lat?: number;
  map_lng?: number;
  map_zoom?: number;
  map_marker_text?: string;
  error?: string;
}

const defaultData: Partial<ContactPageData> = {
    main_title: "Свяжитесь с нами",
    main_subtitle: "Мы всегда рады помочь вам. Задайте вопрос или сделайте заказ.",
    info_title: "Контактная информация",
    form_title: "Отправить сообщение",
    map_zoom: 17, // Default zoom
    map_marker_text: "Наш офис"
}

export async function getContactPageData(): Promise<ContactPageData> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
          'contcat_title',         // Правильное имя из БД
          'contcat_subtitls',      // Правильное имя из БД
          'contact_info_title', 
          'contact_form_title',
          'pickup_address',
          'contact_phone_1', 
          'contact_phone_2', 
          'contact_email_main', 
          'telegram_link',
          'viber_link',
          'contact_working_hours',
          'map_lat',
          'map_lng',
          'map_zoom',
          'map_marker_text'
      ]);

    if (error) {
      console.error('Ошибка при загрузке данных контактов из Supabase:', error);
      throw new Error('Не удалось выполнить запрос к базе данных.');
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

    const finalData: Partial<ContactPageData> = {
        main_title: settingsData.contcat_title,
        main_subtitle: settingsData.contcat_subtitls,
        info_title: settingsData.contact_info_title,
        form_title: settingsData.contact_form_title,
        address: settingsData.pickup_address,
        phone_1: settingsData.contact_phone_1,
        phone_2: settingsData.contact_phone_2,
        email_main: settingsData.contact_email_main,
        telegram_link: settingsData.telegram_link,
        viber_link: settingsData.viber_link,
        working_hours: settingsData.contact_working_hours,
        map_lat: settingsData.map_lat ? parseFloat(settingsData.map_lat) : undefined,
        map_lng: settingsData.map_lng ? parseFloat(settingsData.map_lng) : undefined,
        map_zoom: settingsData.map_zoom ? parseInt(settingsData.map_zoom, 10) : undefined,
        map_marker_text: settingsData.map_marker_text
    }

    return { ...defaultData, ...finalData };

  } catch (error) {
    console.error('Критическая ошибка при обработке данных для страницы контактов:', error);
    return { ...defaultData, error: 'Не удалось загрузить или обработать данные для страницы.' } as ContactPageData;
  }
}
