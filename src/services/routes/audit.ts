import { supabase, isSupabaseConfigured } from '../supabase';
import type { ActivityLog, SyncQueueBackup } from '../../types/supabase';

const PENDING_ACTIVITY_LOGS_KEY = 'PDO_PENDING_ACTIVITY_LOGS';

export function readPendingActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(PENDING_ACTIVITY_LOGS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePendingActivityLogs(logs: ActivityLog[]): void {
  try {
    localStorage.setItem(PENDING_ACTIVITY_LOGS_KEY, JSON.stringify(logs.slice(-100)));
  } catch (_e) {}
}

export async function logActivity(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured) {
    const userEmail = log.user_email || localStorage.getItem('PDO_USER_EMAIL') || 'unknown';
    const entry = { ...log, user_email: userEmail, timestamp: Date.now() };
    const pending = readPendingActivityLogs();
    pending.push(entry);
    writePendingActivityLogs(pending);
    return;
  }

  try {
    const userEmail = log.user_email || localStorage.getItem('PDO_USER_EMAIL') || 'unknown';
    await supabase.from('activity_logs').insert([{ ...log, user_email: userEmail }]);
  } catch (err) {
    console.error('[RouteService] Failed to log activity:', err);
    const pending = readPendingActivityLogs();
    pending.push(log);
    writePendingActivityLogs(pending);
  }
}

export async function backupSyncQueue(queueItem: SyncQueueBackup): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('sync_queue_backups').insert([queueItem]);
  } catch (err) {
    console.error('[RouteService] Failed to backup sync queue:', err);
  }
}
