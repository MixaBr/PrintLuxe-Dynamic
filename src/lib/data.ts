
import { createClient } from './supabase/server';
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

export async function getAllProducts({ query, category, page = 1, limit = 1000, user = null }: ProductQueryOptions = {}): Promise<Product[]> {
    console.log('--- [getAllProducts] START ---');
    const supabase = createClient();
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
        console.error('[getAllProducts] Supabase error fetching products:', error);
        return [];
    }
    
    if (!productsData) {
        console.log('[getAllProducts] No products found.');
        return [];
    }

    if (!user) {
        console.log('[getAllProducts] User is GUEST. Applying price1 for all products.');
        return productsData.map(product => ({
            ...product,
            price: product.price1,
        }));
    }

    console.log(`[getAllProducts] User is AUTHENTICATED. User ID: ${user.id}. Fetching profile...`);

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_purchases, is_vip')
        .eq('user_id', user.id)
        .single();
    
    if (profileError) {
        console.error('[getAllProducts] Error fetching profile:', profileError);
        console.log('[getAllProducts] PROFILE FETCH FAILED. Falling back to guest price (price1) for safety.');
         return productsData.map(product => ({
            ...product,
            price: product.price1,
        }));
    }

    const totalPurchases = profile?.total_purchases || 0;
    const isVip = profile?.is_vip || false;
    console.log(`[getAllProducts] Profile loaded: total_purchases = ${totalPurchases}, is_vip = ${isVip}`);

    const pricedProducts = productsData.map(product => {
        let finalPrice = product.price2; // Base price for authenticated user
        let priceTier = 'price2 (base)';

        if (isVip && product.price4 != null) {
            finalPrice = product.price4;
            priceTier = 'price4 (VIP)';
        } else if (product.accumulation != null && totalPurchases > product.accumulation && product.price3 != null) {
            finalPrice = product.price3;
            priceTier = `price3 (accumulation: ${totalPurchases} > ${product.accumulation})`;
        }
        
        console.log(`[getAllProducts] Pricing for product "${product.name}" (ID: ${product.id}): Final Price = ${finalPrice}, Tier = ${priceTier}`);

        return {
            ...product,
            price: finalPrice,
        };
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
  if (!ids || ids.length === 0) {
    return [];
  }

  const { data: productsData, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('[getFeaturedProducts] Error fetching featured products by IDs:', error);
    return [];
  }
  
  if (!productsData) return [];

  if (!user) {
      console.log('[getFeaturedProducts] User is GUEST. Applying price1.');
      return productsData.map(product => ({
          ...product,
          price: product.price1,
      }));
  }

  console.log(`[getFeaturedProducts] User is AUTHENTICATED. User ID: ${user.id}. Fetching profile...`);
  const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_purchases, is_vip')
      .eq('user_id', user.id)
      .single();

   if (profileError) {
        console.error('[getFeaturedProducts] Error fetching profile:', profileError);
        console.log('[getFeaturedProducts] PROFILE FETCH FAILED. Falling back to guest price (price1) for safety.');
         return productsData.map(product => ({
            ...product,
            price: product.price1,
        }));
    }

  const totalPurchases = profile?.total_purchases || 0;
  const isVip = profile?.is_vip || false;
  console.log(`[getFeaturedProducts] Profile loaded: total_purchases = ${totalPurchases}, is_vip = ${isVip}`);


  const pricedProducts = productsData.map(product => {
      let finalPrice = product.price2;
      let priceTier = 'price2 (base)';

      if (isVip && product.price4 != null) {
          finalPrice = product.price4;
          priceTier = 'price4 (VIP)';
      } else if (product.accumulation != null && totalPurchases > product.accumulation && product.price3 != null) {
          finalPrice = product.price3;
          priceTier = `price3 (accumulation: ${totalPurchases} > ${product.accumulation})`;
      }
      
      console.log(`[getFeaturedProducts] Pricing for product "${product.name}" (ID: ${product.id}): Final Price = ${finalPrice}, Tier = ${priceTier}`);

      return {
          ...product,
          price: finalPrice,
      };
  });
  console.log('--- [getFeaturedProducts] END ---');
  return pricedProducts;
}

export async function getProductById(id: string, user: User | null): Promise<Product | null> {
    console.log(`--- [getProductById] START for product ID: ${id} ---`);
    const supabase = createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') { 
            console.error(`[getProductById] Error fetching product with id ${id}:`, error);
        }
        return null;
    }
  
    if (data) {
        let finalPrice: number | null = null;
        let priceTier = 'N/A';

        if (!user) {
            finalPrice = data.price1;
            priceTier = 'price1 (guest)';
            console.log(`[getProductById] User is GUEST. Applying price1.`);
        } else {
            console.log(`[getProductById] User is AUTHENTICATED. User ID: ${user.id}. Fetching profile...`);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('total_purchases, is_vip')
                .eq('user_id', user.id)
                .single();
            
            if (profileError) {
                console.error('[getProductById] Error fetching profile:', profileError);
                console.log('[getProductById] PROFILE FETCH FAILED. Falling back to guest price (price1) for safety.');
                finalPrice = data.price1;
                priceTier = 'price1 (fallback)';
            } else {
                const totalPurchases = profile?.total_purchases || 0;
                const isVip = profile?.is_vip || false;
                console.log(`[getProductById] Profile loaded: total_purchases = ${totalPurchases}, is_vip = ${isVip}`);

                finalPrice = data.price2;
                priceTier = 'price2 (base)';
                if (isVip && data.price4 != null) {
                    finalPrice = data.price4;
                    priceTier = 'price4 (VIP)';
                } else if (data.accumulation != null && totalPurchases > data.accumulation && data.price3 != null) {
                    finalPrice = data.price3;
                    priceTier = `price3 (accumulation: ${totalPurchases} > ${data.accumulation})`;
                }
            }
        }
        
        console.log(`[getProductById] Pricing for product "${data.name}" (ID: ${data.id}): Final Price = ${finalPrice}, Tier = ${priceTier}`);
        console.log(`--- [getProductById] END for product ID: ${id} ---`);

        return {
            ...data,
            price: finalPrice,
        };
    }

    return null;
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
