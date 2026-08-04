import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ponytail: cek konfigurasi tanpa fallback ke placeholder yang menyesatkan
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Buat client dengan URL/key kosong jika belum dikonfigurasi.
// Semua query akan gagal secara graceful di routeService (sudah ada try/catch).
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key'
);
