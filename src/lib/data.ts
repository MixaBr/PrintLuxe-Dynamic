
import { supabase } from './supabaseClient';
import type { Product } from './definitions';

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data;
}

export async function getFeaturedProducts(count: number): Promise<Product[]> {
    const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(count);

  if (error) {
    console.error('Error fetching featured products:', error);
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
