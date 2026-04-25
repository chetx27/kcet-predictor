import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '⚠️  Supabase credentials not set. The server will start but DB queries will fail.\n' +
    '   Copy .env.example to .env and fill in your Supabase credentials.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
