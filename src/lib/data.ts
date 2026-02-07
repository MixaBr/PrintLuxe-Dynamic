
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

// Helper function for tiered pricing logic
async function getPriceForUser(product: any, user: User | null): Promise<number | null> {
    if (!user) {
        return product.price1; // Guest price
    }

    // Authenticated user: apply tiered pricing
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases')
        .eq('user_id', user.id)
        .single();

    if (profileError) {
        console.error(`Error fetching profile for user ${user.id} to determine price:`, profileError);
        return product.price2; // Fallback to base authenticated price
    }

    const totalPurchases = profile?.total_purchases || 0;

    // Fetching thresholds. Using a simple client here is fine for server-side logic.
    const { data: config, error: configError } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['price_tier3_threshold', 'price_tier4_threshold']);

    if (configError) {
        console.error('Error fetching pricing tier thresholds:', configError);
        return product.price2; // Fallback
    }

    const tier3Threshold = parseFloat(config?.find(c => c.key === 'price_tier3_threshold')?.value || '999999999');
    const tier4Threshold = parseFloat(config?.find(c => c.key === 'price_tier4_threshold')?.value || '999999999');

    if (totalPurchases >= tier4Threshold && product.price4 != null) {
        return product.price4;
    }
    if (totalPurchases >= tier3Threshold && product.price3 != null) {
        return product.price3;
    }
    
    return product.price2;
}

// This function now returns products with the correct prices based on auth status and tiers.
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

    const { data, error } = await supabaseQuery.order('name', { ascending: true });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    
    if (!data) return [];

    // Asynchronously apply role-based pricing for all fetched products
    const pricedProducts = await Promise.all(data.map(async (product) => {
        const price = await getPriceForUser(product, user);
        return {
            ...product,
            price: price,
        };
    }));

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

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching featured products by IDs:', error);
    return [];
  }

  // Process data on the server to include only the correct price.
  const pricedProducts = await Promise.all(data.map(async (product) => {
      const price = await getPriceForUser(product, user);
      return {
          ...product,
          price: price
      };
  }));

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
        const price = await getPriceForUser(data, user);
        return {
            ...data,
            price: price,
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
