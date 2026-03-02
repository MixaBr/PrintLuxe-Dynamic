
import { createClient } from '@/lib/supabase/server';
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

export async function getAllProducts({ query, category, page = 1, limit = 1000, user: passedUser = undefined }: ProductQueryOptions = {}): Promise<Product[]> {
    const supabase = createClient();
    
    // If a user object isn't explicitly passed, try to get it from the session.
    const { data: { user } } = passedUser === undefined ? await supabase.auth.getUser() : { data: { user: passedUser } };

    // GUEST LOGIC
    if (!user) {
        let guestQuery = supabase
            .from('products')
            .select('*');

        if (query) { guestQuery = guestQuery.or(`name.ilike.%${query}%,article_number.ilike.%${query}%`); }
        if (category && category !== 'all') { guestQuery = guestQuery.eq('category', category); }
        if (limit) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            guestQuery = guestQuery.range(from, to);
        }
        const { data: productsData, error } = await guestQuery
            .order('weight', { ascending: false })
            .order('name', { ascending: true });

        if (error) {
            console.error('[getAllProducts] GUEST Supabase error:', error);
            return [];
        }
        return productsData.map(p => ({ ...p, price: p.price1 }));
    }

    // AUTHENTICATED USER LOGIC
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    if (profileError) {
        console.error(`[getAllProducts] AUTHENTICATED Profile fetch error for user ID ${user.id}:`, profileError);
        // Fallback to guest logic if profile is not found
        return getAllProducts({ query, category, page, limit, user: null });
    }

    let authQuery = supabase
        .from('products')
        .select('*');

    if (query) { authQuery = authQuery.or(`name.ilike.%${query}%,article_number.ilike.%${query}%`); }
    if (category && category !== 'all') { authQuery = authQuery.eq('category', category); }
    if (limit) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        authQuery = authQuery.range(from, to);
    }

    const { data: productsData, error: productsError } = await authQuery
        .order('weight', { ascending: false })
        .order('name', { ascending: true });

    if (productsError) {
        console.error(`[getAllProducts] AUTHENTICATED Products fetch error for user ID ${user.id}:`, productsError);
        return [];
    }

    const pricedProducts = productsData.map(product => {
        let finalPrice: number | null;

        if (profile.is_vip && product.price4 != null) {
            finalPrice = product.price4;
        } else if (product.accumulation != null && profile.total_purchases != null && profile.total_purchases > product.accumulation && product.price3 != null) {
            finalPrice = product.price3;
        } else {
            finalPrice = product.price2;
        }
        
        return { ...product, price: finalPrice };
    });

    return pricedProducts;
}


export async function getProductsCount({ query, category }: { query?: string; category?: string; }): Promise<number> {
    const supabase = createClient();
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


export async function getFeaturedProducts(ids: number[], user: User | null): Promise<Product[]> {
  const supabase = createClient();
  if (!ids || ids.length === 0) return [];

  const { data: productsData, error } = await supabase.from('products').select('*').in('id', ids);

  if (error) {
    console.error('[getFeaturedProducts] Error fetching by IDs:', error);
    return [];
  }
  
  if (!productsData) return [];

  if (!user) {
      return productsData.map(p => ({ ...p, price: p.price1 }));
  }

  const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_purchases, is_vip')
      .eq('user_id', user.id)
      .single();

   if (profileError) {
        return productsData.map(p => ({ ...p, price: p.price1 }));
    }
  
  const pricedProducts = productsData.map(product => {
      let finalPrice: number | null;

      if (profile.is_vip && product.price4 != null) {
          finalPrice = product.price4;
      } else if (product.accumulation != null && profile.total_purchases != null && profile.total_purchases > product.accumulation && product.price3 != null) {
          finalPrice = product.price3;
      } else {
          finalPrice = product.price2;
      }

      return { ...product, price: finalPrice };
  });

  return pricedProducts;
}

export async function getProductById(id: number, user: User | null): Promise<Product | null> {
    const supabase = createClient();
    const { data: productData, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error || !productData) {
        console.error(`[getProductById] Error fetching product ${id}:`, error);
        return null;
    }
  
    if (!user) {
        return { ...productData, price: productData.price1 };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    if (profileError) {
        return { ...productData, price: productData.price1 };
    }
    
    let finalPrice: number | null;

    if (profile.is_vip && productData.price4 != null) {
        finalPrice = productData.price4;
    } else if (productData.accumulation != null && productData.total_purchases != null && productData.total_purchases > productData.accumulation && productData.price3 != null) {
        finalPrice = productData.price3;
    } else {
        finalPrice = productData.price2;
    }

    return { ...productData, price: finalPrice };
}

export async function getAppBackground(): Promise<string | null> {
  const supabase = createClient();
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
