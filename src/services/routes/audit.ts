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

// In-memory cache for activity logs (TTL 3 minutes)
interface ActivityLogCacheEntry {
  data: ActivityLog[];
  timestamp: number;
}
const activityLogCache = new Map<string, ActivityLogCacheEntry>();
const ACTIVITY_LOG_CACHE_TTL = 3 * 60 * 1000;

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
    // Invalidate activity log cache on new activity
    activityLogCache.clear();
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

/**
 * Mengambil log aktivitas untuk audit.
 * Dukungan filter kombinasi [rute, periode operasional, rentang waktu aksi].
 */
export async function fetchActivityLogs(options?: {
  limit?: number;
  userEmail?: string;
  actionPrefix?: string;
  forceRefresh?: boolean;
  routeCode?: string;
  periodYear?: number;
  periodMonth?: number;
  periodDay?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActivityLog[]> {
  if (!isSupabaseConfigured) return [];

  const cacheKey = JSON.stringify({
    limit: options?.limit || 100,
    userEmail: options?.userEmail || '',
    actionPrefix: options?.actionPrefix || '',
    routeCode: options?.routeCode || '',
    periodYear: options?.periodYear ?? '',
    periodMonth: options?.periodMonth ?? '',
    periodDay: options?.periodDay ?? '',
    dateFrom: options?.dateFrom || '',
    dateTo: options?.dateTo || '',
  });

  const now = Date.now();
  const cached = activityLogCache.get(cacheKey);

  // Return cached result if valid and not force-refreshing
  if (!options?.forceRefresh && cached && now - cached.timestamp < ACTIVITY_LOG_CACHE_TTL) {
    return cached.data;
  }

  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 100);

  if (options?.userEmail) {
    query = query.eq('user_email', options.userEmail);
  }
  if (options?.actionPrefix) {
    query = query.ilike('action', `${options.actionPrefix}%`);
  }
  if (options?.routeCode) {
    query = query.eq('route_code', options.routeCode);
  }
  if (options?.periodYear !== undefined && options?.periodYear !== null) {
    query = query.filter('details->>year', 'eq', String(options.periodYear));
  }
  if (options?.periodMonth !== undefined && options?.periodMonth !== null) {
    query = query.filter('details->>month', 'eq', String(options.periodMonth));
  }
  if (options?.periodDay !== undefined && options?.periodDay !== null) {
    query = query.filter('details->>day', 'eq', String(options.periodDay));
  }
  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom);
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[RouteService] Error fetching activity logs:', error);
    return [];
  }

  const result = (data as ActivityLog[]) || [];
  activityLogCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}
