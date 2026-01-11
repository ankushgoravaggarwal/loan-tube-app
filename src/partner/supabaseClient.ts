import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../services/apiService';

const supabaseUrl = API_CONFIG.SUPABASE_URL;
const supabaseKey = API_CONFIG.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 