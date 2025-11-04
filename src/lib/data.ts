
import { supabase } from './supabaseClient';
import type { Product } from './definitions';

interface ProductQueryOptions {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function getAllProducts({ query, category, page = 1, limit = 1000 }: ProductQueryOptions = {}): Promise<Product[]> {
  let supabaseQuery = supabase
    .from('products')
    .select('*', { count: 'exact' });

  if (query) {
    // Поиск по нескольким полям
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,article_number.ilike.%${query}%`);
  }

  if (category && category !== 'all') {
    supabaseQuery = supabaseQuery.eq('category', category);
  }

  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);
  }

  const { data, error } = await supabaseQuery.order('name', { ascending: true });


  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data;
}

export async function getProductsCount({ query, category }: { query?: string; category?: string; }): Promise<number> {
    let supabaseQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

    if (query) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,article_number.ilike.%${query}%`);
    }

    if (category && category !== 'all') {
        supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { count, error } = await supabaseQuery;

    if (error) {
        console.error('Error fetching products count:', error);
        return 0;
    }

    return count || 0;
}


export async function getFeaturedProducts(ids: number[]): Promise<Product[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching featured products by IDs:', error);
    return [];
  }

  return data;
}

export async function getProductById(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return undefined;
  }

  return data;
}

export async function getAppBackground(): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'app_background')
    .single();

  if (error) {
    console.error('Error fetching app background:', JSON.stringify(error, null, 2));
    return null;
  }

  return data?.value || null;
}
