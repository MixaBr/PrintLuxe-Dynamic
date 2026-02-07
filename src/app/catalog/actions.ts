
'use server';

import { createClient } from '@/lib/supabase/server';
import { getProductById } from '@/lib/data';
import type { Product } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

/**
 * Fetches the full product details on the server, accounting for the user's authentication status and purchase history.
 * This is a Server Action designed to be called from Client Components.
 */
export async function getFullProductDetails(productId: string): Promise<Product | null> {
  // createClient from server.ts handles cookies internally.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch the product using the existing data-access function, 
  // passing the user object to calculate the correct tiered price.
  const product = await getProductById(productId, user);
  
  return product;
}

/**
 * Increments the view count for a given product.
 * This is a Server Action that can be called from any context.
 */
export async function incrementProductViewCount(productId: string) {
  const supabase = createClient();

  // Use a remote procedure call (RPC) in Supabase to increment the view count.
  const { error } = await supabase.rpc('increment_view_count', { product_id: productId });

  if (error) {
    console.error('Error incrementing view count:', error.message);
    // Decide if you want to throw the error or handle it silently.
    return; // Don't revalidate if there was an error.
  }

  // Optionally, you could revalidate a path here if needed, but it's likely not necessary for a simple view count.
  // For example: revalidatePath(`/catalog/${productId}`);
}
