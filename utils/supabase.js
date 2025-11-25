import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get credentials from app.json (which you already have configured correctly)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey;

console.log('=== SUPABASE CONFIG ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey?.length);

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase credentials are missing!');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseKey);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;