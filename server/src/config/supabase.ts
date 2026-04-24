import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '.';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
