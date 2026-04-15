import { createClient } from '@supabase/supabase-js';

// .env file se keys uthakar Supabase client banayein
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // console.error("CRITICAL ERROR: Supabase URL or Anon Key is missing in .env file.");
}

// Client ko banayein aur export kar dein
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// console.log("✅ Supabase client (anon) initialized from lib/supabaseClient.js");