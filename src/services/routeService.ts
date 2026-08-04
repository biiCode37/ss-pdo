import { supabase } from './supabase';
import type { Route, UserProfile, ActivityLog, SyncQueueBackup } from '../types/supabase';

const CACHE_KEY_ROUTES = 'PDO_CACHE_ROUTES';

export async function fetchRoutesWithSheets(): Promise<Route[]> {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_sheets(*)')
      .eq('is_active', true)
      .order('route_code', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) {
      localStorage.setItem(CACHE_KEY_ROUTES, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[RouteService] Offline/Error fetching from Supabase, loading local cache:', err);
  }

  const cached = localStorage.getItem(CACHE_KEY_ROUTES);
  return cached ? JSON.parse(cached) : [];
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { email: string; full_name: string }): Promise<void> {
  try {
    const { error } = await supabase.from('user_profiles').upsert(
      [
        {
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'email' }
    );
    if (error) console.error('[RouteService] Error upserting user profile:', error);
  } catch (err) {
    console.warn('[RouteService] Failed to upsert user profile (offline?):', err);
  }
}

export async function logActivity(log: ActivityLog): Promise<void> {
  try {
    await supabase.from('activity_logs').insert([log]);
  } catch (err) {
    console.error('[RouteService] Failed to log activity:', err);
  }
}

export async function backupSyncQueue(queueItem: SyncQueueBackup): Promise<void> {
  try {
    await supabase.from('sync_queue_backups').insert([queueItem]);
  } catch (err) {
    console.error('[RouteService] Failed to backup sync queue:', err);
  }
}
