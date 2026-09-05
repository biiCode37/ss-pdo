import { supabase, isSupabaseConfigured } from '../supabase';
import type { ActivityLog } from '../../types/supabase';
import { readPendingActivityLogs, writePendingActivityLogs } from './audit';
import { upsertUserProfile } from './users';

const PENDING_PROFILE_SYNC_KEY = 'PDO_PROFILE_SYNC_PENDING';

export async function flushPendingLocalSync(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const pendingProfile = localStorage.getItem(PENDING_PROFILE_SYNC_KEY);
  if (pendingProfile) {
    try {
      const profile = JSON.parse(pendingProfile);
      await upsertUserProfile(profile);
      localStorage.removeItem(PENDING_PROFILE_SYNC_KEY);
    } catch (_e) {}
  }

  const logs = readPendingActivityLogs();
  if (logs.length > 0) {
    const remaining: ActivityLog[] = [];
    for (const log of logs) {
      try {
        const { error } = await supabase.from('activity_logs').insert([log]);
        if (error) remaining.push(log);
      } catch (_e) {
        remaining.push(log);
      }
    }
    writePendingActivityLogs(remaining);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushPendingLocalSync().catch(() => {});
  });
}
