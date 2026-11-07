// src/services/submissionReadinessService.ts
import { supabase, isSupabaseConfigured } from './supabase';
import { clearProxySession, getProxySession } from './googleSheets/transport';
import type { RouteCompleteness } from '../../supabase/functions/_shared/completeness.ts';

export interface ActiveRoute { id: number; route_code: string }
export interface RouteReadinessRow {
  route_id: number;
  route_code: string;
  completeness: RouteCompleteness | null;
  last_synced_at: string | null;
}
export interface SubmissionConfirmation {
  route_id: number;
  route_code: string;
  date: string;
  confirmed_by: string;
  confirmed_at: string;
  issues_at_confirm: number;
  reason: string | null;
  fingerprint_at_confirm: string | null;
}

const CONFIRMATION_COLUMNS =
  'route_id, route_code, date, confirmed_by, confirmed_at, issues_at_confirm, reason, fingerprint_at_confirm';

export async function fetchActiveRoutes(): Promise<ActiveRoute[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('routes').select('id, route_code').eq('is_active', true).order('route_code');
  if (error) throw error;
  return (data || []) as ActiveRoute[];
}

export async function fetchReadinessByDate(date: string): Promise<RouteReadinessRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('daily_route_reports')
    .select('route_id, route_code, completeness, last_synced_at')
    .eq('date', date);
  if (error) throw error;
  return (data || []) as RouteReadinessRow[];
}

export async function fetchConfirmationsInRange(start: string, end: string): Promise<SubmissionConfirmation[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('route_submission_confirmations')
    .select(CONFIRMATION_COLUMNS)
    .gte('date', start)
    .lte('date', end);
  if (error) throw error;
  return (data || []) as SubmissionConfirmation[];
}

export class ConfirmSubmissionError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function readErrorCode(error: unknown): Promise<string> {
  try {
    const body = await (error as { context?: Response })?.context?.json?.();
    return typeof body?.code === 'string' ? body.code : 'FAILED';
  } catch {
    return 'FAILED';
  }
}

export async function confirmRouteSubmission(input: {
  routeId: number;
  date: string;
  reason?: string;
}): Promise<SubmissionConfirmation> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ConfirmSubmissionError('OFFLINE');

  let session = await getProxySession();
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.functions.invoke('route-confirmation', {
      body: input,
      headers: session ? { 'x-proxy-session': session } : undefined,
    });
    if (!error && data?.confirmation) return data.confirmation as SubmissionConfirmation;

    const code = error ? await readErrorCode(error) : 'FAILED';
    if (code === 'PROXY_SESSION_INVALID' && attempt === 0) {
      clearProxySession();
      session = await getProxySession(true);
      if (session) continue;
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('google-auth-expired'));
    }
    throw new ConfirmSubmissionError(code);
  }
  throw new ConfirmSubmissionError('FAILED');
}

