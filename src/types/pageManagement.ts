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

export interface AppPageSetting {
  page_key: PageKey;
  page_name: string;
  category: PageCategory;
  is_enabled: boolean;
  disabled_message: string;
  is_locked?: boolean; // True jika halaman sistem yang tidak boleh dimatikan
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_PAGE_SETTINGS: AppPageSetting[] = [
  {
    page_key: 'dashboard',
    page_name: 'Dashboard Operasional Rute',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_monitoring',
    page_name: 'Monitoring 18 Rute Wilayah',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'user_management',
    page_name: 'Manajemen Pengguna RBAC',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'input',
    page_name: 'Form Input Bus SS PDO',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'analytics',
    page_name: 'Analitik & Capaian Rute',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'units',
    page_name: 'Daftar Unit Armada',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_summary',
    page_name: 'Tab Rekap Wilayah',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_wa_report',
    page_name: 'Tab Generator Laporan WA',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'a2_report',
    page_name: 'Form Laporan Operasional A2',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'accumulation',
    page_name: 'Rekap Akumulasi Periode',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
];
