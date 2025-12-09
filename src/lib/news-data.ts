
import { createClient } from './supabase/server';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from './supabaseClient';

export interface News {
  id: string;
  created_at: string;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  featured_image_url?: string;
  status: 'draft' | 'published';
  published_at?: string;
}

/**
 * Fetches the most recent published news articles.
 * @param limit The number of news articles to fetch.
 * @returns A promise that resolves to an array of news articles.
 */
export async function getRecentNews(limit: number = 5): Promise<News[]> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent news:', error);
    return [];
  }

  return data;
}

/**
 * Formats a date string into a more readable format.
 * e.g., "1 января 2023"
 * @param dateString The date string to format.
 * @returns A formatted date string.
 */
export function formatNewsDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return format(date, 'd MMMM yyyy', { locale: ru });
    } catch (e) {
        console.error("Invalid date for formatting:", dateString, e);
        return "Неверная дата";
    }
}
