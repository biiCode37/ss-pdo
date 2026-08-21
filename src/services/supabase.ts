import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ponytail: cek konfigurasi sebelum membuat client aktif, cegah request ke domain placeholder publik (SOL-R6-026)
export const isSupabaseConfigured = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('placeholder')
);

// Gunakan URL dummy lokal yang aman jika belum dikonfigurasi, agar tidak mengirim request ke domain yang tidak dikenal
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'http://localhost:54321',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'anon-key-unconfigured'
);
