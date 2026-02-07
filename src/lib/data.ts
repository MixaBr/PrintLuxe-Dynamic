
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

export async function getAllProducts({ query, category, page = 1, limit = 1000, user: passedUser = null }: ProductQueryOptions = {}): Promise<Product[]> {
    console.log('--- [getAllProducts] START ---');
    const supabase = createClient();
    
    const user = passedUser ?? (await supabase.auth.getUser()).data.user;

    if (!user) {
        console.log('[getAllProducts] User determined as GUEST. Applying price1 for all products.');
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
        const { data: productsData, error } = await guestQuery.order('name', { ascending: true });

        if (error) {
            console.error('[getAllProducts] GUEST Supabase error:', error);
            return [];
        }
        return productsData.map(p => ({ ...p, price: p.price1 }));
    }

    // --- AUTHENTICATED USER LOGIC ---
    console.log(`[getAllProducts] User determined as AUTHENTICATED: ${user.id}.`);
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    if (profileError) {
        console.error('[getAllProducts] AUTHENTICATED Profile fetch error:', profileError);
        console.log('[getAllProducts] PROFILE FETCH FAILED. Falling back to GUEST price (price1) for safety.');
        // Recursively call itself but without a user to force guest pricing as a fallback
        return getAllProducts({ query, category, page, limit, user: null });
    }

    console.log(`[getAllProducts] Profile loaded: total_purchases=${profile.total_purchases}, is_vip=${profile.is_vip}`);

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

    const { data: productsData, error: productsError } = await authQuery.order('name', { ascending: true });

    if (productsError) {
        console.error('[getAllProducts] AUTHENTICATED Products fetch error:', productsError);
        return [];
    }

    const pricedProducts = productsData.map(product => {
        let finalPrice = product.price2;
        let priceTier = 'price2 (base)';

        if (profile.is_vip && product.price4 != null) {
            finalPrice = product.price4;
            priceTier = 'price4 (VIP)';
        } else if (product.accumulation != null && profile.total_purchases > product.accumulation && product.price3 != null) {
            finalPrice = product.price3;
            priceTier = `price3 (accumulation: ${profile.total_purchases} > ${product.accumulation})`;
        }
        
        console.log(`[getAllProducts] Pricing for "${product.name}": Final Price = ${finalPrice}, Tier = ${priceTier}`);

        return { ...product, price: finalPrice };
    });

    console.log('--- [getAllProducts] END ---');
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
  console.log('--- [getFeaturedProducts] START ---');
  const supabase = createClient();
  if (!ids || ids.length === 0) return [];

  const { data: productsData, error } = await supabase.from('products').select('*').in('id', ids);

  if (error) {
    console.error('[getFeaturedProducts] Error fetching by IDs:', error);
    return [];
  }
  
  if (!productsData) return [];

  if (!user) {
      console.log('[getFeaturedProducts] User is GUEST. Applying price1.');
      return productsData.map(p => ({ ...p, price: p.price1 }));
  }

  console.log(`[getFeaturedProducts] User is AUTHENTICATED: ${user.id}. Fetching profile...`);
  const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_purchases, is_vip')
      .eq('user_id', user.id)
      .single();

   if (profileError) {
        console.error('[getFeaturedProducts] Profile fetch error:', profileError);
        console.log('[getFeaturedProducts] PROFILE FETCH FAILED. Falling back to GUEST price (price1) for safety.');
        return productsData.map(p => ({ ...p, price: p.price1 }));
    }
  
  console.log(`[getFeaturedProducts] Profile loaded: total_purchases=${profile.total_purchases}, is_vip=${profile.is_vip}`);

  const pricedProducts = productsData.map(product => {
      let finalPrice = product.price2;
      let priceTier = 'price2 (base)';

      if (profile.is_vip && product.price4 != null) {
          finalPrice = product.price4;
          priceTier = 'price4 (VIP)';
      } else if (product.accumulation != null && profile.total_purchases > product.accumulation && product.price3 != null) {
          finalPrice = product.price3;
          priceTier = `price3 (accumulation: ${profile.total_purchases} > ${product.accumulation})`;
      }
      
      console.log(`[getFeaturedProducts] Pricing for "${product.name}": Final Price = ${finalPrice}, Tier = ${priceTier}`);

      return { ...product, price: finalPrice };
  });

  console.log('--- [getFeaturedProducts] END ---');
  return pricedProducts;
}

export async function getProductById(id: string, user: User | null): Promise<Product | null> {
    console.log(`--- [getProductById] START for product ID: ${id} ---`);
    const supabase = createClient();
    const { data: productData, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error || !productData) {
        console.error(`[getProductById] Error fetching product ${id}:`, error);
        return null;
    }
  
    if (!user) {
        console.log(`[getProductById] User is GUEST. Applying price1.`);
        return { ...productData, price: productData.price1 };
    }

    console.log(`[getProductById] User is AUTHENTICATED: ${user.id}. Fetching profile...`);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    if (profileError) {
        console.error('[getProductById] Profile fetch error:', profileError);
        console.log('[getProductById] PROFILE FETCH FAILED. Falling back to GUEST price (price1) for safety.');
        return { ...productData, price: productData.price1 };
    }

    console.log(`[getProductById] Profile loaded: total_purchases=${profile.total_purchases}, is_vip=${profile.is_vip}`);
    
    let finalPrice = productData.price2;
    let priceTier = 'price2 (base)';

    if (profile.is_vip && productData.price4 != null) {
        finalPrice = productData.price4;
        priceTier = 'price4 (VIP)';
    } else if (productData.accumulation != null && profile.total_purchases > productData.accumulation && productData.price3 != null) {
        finalPrice = productData.price3;
        priceTier = `price3 (accumulation: ${profile.total_purchases} > ${productData.accumulation})`;
    }
    
    console.log(`[getProductById] Pricing for "${productData.name}": Final Price = ${finalPrice}, Tier = ${priceTier}`);
    console.log(`--- [getProductById] END ---`);

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
