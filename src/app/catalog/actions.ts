
'use server';

import { createClient } from "@/lib/supabase/server";

/**
 * Increments the view count of a product.
 * This is designed to be called and forgotten, without waiting for a response.
 * It uses an RPC call to a Postgres function for an atomic update.
 * 
 * IMPORTANT: You must create the corresponding function in your Supabase SQL editor:
 * 
 * CREATE OR REPLACE FUNCTION increment_product_view(product_id_to_update uuid)
 * RETURNS void AS $$
 *   UPDATE products
 *   SET views_count = views_count + 1
 *   WHERE id = product_id_to_update;
 * $$ LANGUAGE sql;
 * 
 * @param productId The UUID of the product to update.
 */
export async function incrementProductViewCount(productId: string) {
  if (!productId) return;
  
  const supabase = createClient();
  
  // We call the remote procedure and don't care about the result.
  // This is "fire and forget".
  // The .then() is just to prevent unhandled promise rejection warnings in the console.
  supabase.rpc('increment_product_view', { product_id_to_update: productId }).then(null, error => {
    // Log the error on the server if the RPC call fails for some reason
    console.error(`Failed to increment view count for product ${productId}:`, error);
  });
}
