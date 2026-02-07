
import { supabase } from './supabaseClient';
import type { Product } from './definitions';
import type { User } from '@supabase/supabase-js';
export type { Product } from './definitions';

interface ProductQueryOptions {
  query?: string;
  category?: string;
  page?: number;
  limit?: number;
  user?: User | null;
}

// This function now returns products with the correct prices based on the new tiered logic.
export async function getAllProducts({ query, category, page = 1, limit = 1000, user = null }: ProductQueryOptions = {}): Promise<Product[]> {
    let supabaseQuery = supabase
        .from('products')
        .select('*');

    if (query) {
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

    const { data: productsData, error } = await supabaseQuery.order('name', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    
    if (!productsData) return [];

    // Guest users always get price1
    if (!user) {
        return productsData.map(product => ({
            ...product,
            price: product.price1,
        }));
    }

    // Authenticated users: Fetch profile once
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    const totalPurchases = profile?.total_purchases || 0;
    const isVip = profile?.is_vip || false;

    const pricedProducts = productsData.map(product => {
        let finalPrice = product.price2; // Default for authenticated user

        // Highest priority: VIP status
        if (isVip && product.price4 != null) {
            finalPrice = product.price4;
        } 
        // Second priority: Accumulation threshold for the specific product
        else if (product.accumulation != null && totalPurchases > product.accumulation && product.price3 != null) {
            finalPrice = product.price3;
        }

        return {
            ...product,
            price: finalPrice,
        };
    });

    return pricedProducts;
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


// The function now accepts the user object to determine the price.
export async function getFeaturedProducts(ids: number[], user: User | null): Promise<Product[]> {
  if (!ids || ids.length === 0) {
    return [];
  }

  const { data: productsData, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching featured products by IDs:', error);
    return [];
  }

  // Guest users
  if (!user) {
      return productsData.map(product => ({
          ...product,
          price: product.price1,
      }));
  }

  // Authenticated users: Fetch profile once
  const { data: profile } = await supabase
      .from('profiles')
      .select('total_purchases, is_vip')
      .eq('user_id', user.id)
      .single();

  const totalPurchases = profile?.total_purchases || 0;
  const isVip = profile?.is_vip || false;

  const pricedProducts = productsData.map(product => {
      let finalPrice = product.price2; // Default for authenticated user

      if (isVip && product.price4 != null) {
          finalPrice = product.price4;
      } else if (product.accumulation != null && totalPurchases > product.accumulation && product.price3 != null) {
          finalPrice = product.price3;
      }

      return {
          ...product,
          price: finalPrice,
      };
  });

  return pricedProducts;
}

export async function getProductById(id: string, user: User | null): Promise<Product | null> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { // Ignore 'No rows found' error
            console.error(`Error fetching product with id ${id}:`, error);
        }
        return null;
    }
  
    if (data) {
        let finalPrice = null;
        if (!user) {
            finalPrice = data.price1;
        } else {
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_purchases, is_vip')
                .eq('user_id', user.id)
                .single();
            
            const totalPurchases = profile?.total_purchases || 0;
            const isVip = profile?.is_vip || false;

            finalPrice = data.price2;
            if (isVip && data.price4 != null) {
                finalPrice = data.price4;
            } else if (data.accumulation != null && totalPurchases > data.accumulation && data.price3 != null) {
                finalPrice = data.price3;
            }
        }
        return {
            ...data,
            price: finalPrice,
        };
    }

    return null;
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
