import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../services/apiService';

const supabaseUrl = API_CONFIG.SUPABASE_URL;
const supabaseKey = API_CONFIG.SUPABASE_ANON_KEY;

// Only create Supabase client if both URL and key are provided
// Use dummy values if missing to prevent errors (client won't work but app won't crash)
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeSupabaseKey = supabaseKey || 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Missing Supabase environment variables - Supabase features will be disabled');
}

export const supabase = createClient(safeSupabaseUrl, safeSupabaseKey); 