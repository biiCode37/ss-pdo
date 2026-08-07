export interface Route {
  id: number;
  uuid: string;
  route_code: string;
  route_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  route_sheets?: RouteSheet[];
}

export interface RouteSheet {
  id: number;
  uuid: string;
  route_id: number;
  year: number;
  month: number;
  spreadsheet_id: string;
  sheet_url: string;
  tab_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id?: number;
  uuid?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'petugas';
  is_active?: boolean;
  last_login_at?: string;
  last_active_at?: string;
  total_active_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id?: number;
  uuid?: string;
  user_email: string;
  action: string;
  route_code?: string;
  details?: Record<string, any>;
  created_at?: string;
}

export interface SyncQueueBackup {
  id?: number;
  uuid?: string;
  user_email: string;
  spreadsheet_id: string;
  tab_name: string;
  row_index: number;
  payload: Record<string, any>;
  status: 'pending' | 'synced' | 'failed';
  error_message?: string;
  created_at?: string;
  synced_at?: string;
}

export interface DailyUnitSummary {
  id?: number;
  route_sheet_id?: number;
  route_code: string;
  year: number;
  month: number;
  day: number;
  unit: string;
  total_km: number;
  toa_shift1: number;
  manual_shift1: number;
  toa_shift2: number;
  manual_shift2: number;
  total_toa: number;
  total_passengers: number;
  keterangan?: string;
  created_at?: string;
  updated_at?: string;
}

