
import { createClient } from '@supabase/supabase-js';

// This admin client is used for server-side operations that require bypassing RLS.
// It should only be used in trusted environments like serverless functions or backend servers.
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Important: prevent the admin client from storing any user sessions
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
