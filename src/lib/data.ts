
import { supabase } from './supabaseClient';
import type { Product } from './definitions';
export type { Product } from './definitions';

interface ProductQueryOptions {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  isAuthenticated?: boolean;
}

// This function now returns products with the correct prices based on auth status.
export async function getAllProducts({ query, category, page = 1, limit = 1000, isAuthenticated = false }: ProductQueryOptions = {}): Promise<Product[]> {
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

  // Apply role-based pricing
  return data.map(product => ({
    ...product,
    price: isAuthenticated ? product.price2 : product.price1
  }));
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


// The function now accepts isAuthenticated to determine the price.
export async function getFeaturedProducts(ids: number[], isAuthenticated: boolean): Promise<Product[]> {
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

  // Process data on the server to include only the correct price.
  return data.map(product => ({
    ...product,
    price: isAuthenticated ? product.price2 : product.price1,
  }));
}

export async function getProductById(id: string, isAuthenticated: boolean): Promise<Product | undefined> {
    const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return undefined;
  }
  
  if (data) {
      return {
          ...data,
          price: isAuthenticated ? data.price2 : data.price1,
      }
  }

  return undefined;
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
