export type PageKey =
  | 'dashboard'
  | 'regional_monitoring'
  | 'user_management'
  | 'input'
  | 'analytics'
  | 'units'
  | 'regional_summary'
  | 'regional_wa_report'
  | 'a2_report'
  | 'accumulation';

export type PageCategory = 'page' | 'tab' | 'modal';

export type BulkActionType = 'set_status' | 'set_roles' | 'reset_default';

export interface AppPageSetting {
  page_key: PageKey;
  page_name: string;
  category: PageCategory;
  is_enabled: boolean;
  disabled_message: string;
  is_locked?: boolean; // True jika halaman sistem yang tidak boleh dimatikan
  allowed_roles: string[];
  allowed_user_emails: string[];
  denied_user_emails: string[];
  updated_at?: string;
  updated_by?: string;
}

export const ALL_ROLES = ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'] as const;
export const REGIONAL_ALLOWED_ROLES = ['superadmin', 'admin', 'korwil', 'korlap'] as const;
export const USER_MANAGEMENT_ALLOWED_ROLES = ['superadmin', 'admin'] as const;

export const DEFAULT_PAGE_SETTINGS: AppPageSetting[] = [
  {
    page_key: 'dashboard',
    page_name: 'Dashboard Operasional Rute',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'regional_monitoring',
    page_name: 'Monitoring 18 Rute Wilayah',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...REGIONAL_ALLOWED_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'user_management',
    page_name: 'Manajemen Pengguna RBAC',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...USER_MANAGEMENT_ALLOWED_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'input',
    page_name: 'Form Input Bus SS PDO',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'analytics',
    page_name: 'Analitik & Capaian Rute',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'units',
    page_name: 'Daftar Unit Armada',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'regional_summary',
    page_name: 'Tab Rekap Wilayah',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...REGIONAL_ALLOWED_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'regional_wa_report',
    page_name: 'Tab Generator Laporan WA',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...REGIONAL_ALLOWED_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'a2_report',
    page_name: 'Form Laporan Operasional A2',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
  {
    page_key: 'accumulation',
    page_name: 'Rekap Akumulasi Periode',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    allowed_roles: [...ALL_ROLES],
    allowed_user_emails: [],
    denied_user_emails: [],
  },
];
