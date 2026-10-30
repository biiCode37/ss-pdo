export const TEXT_PAGE_MANAGEMENT = {
  TITLE: 'Manajemen Halaman',
  SUPERADMIN_BADGE: 'Superadmin Access Only',
  CATEGORIES: {
    ALL: 'Semua',
    PAGE: 'Halaman Utama',
    TAB: 'Sub-Halaman & Tab',
    MODAL: 'Fitur & Modal',
  },
  STATUS: {
    ACTIVE: 'Aktif',
    MAINTENANCE: 'Pemeliharaan',
    LOCKED: 'Terkunci',
    ACTIVE_DESC: 'Dapat diakses oleh seluruh pengguna',
    MAINTENANCE_DESC: 'Hanya dapat diakses oleh Superadmin',
    LOCKED_DESC: 'Halaman inti sistem tidak dapat dinonaktifkan',
  },
  ACCESS_RESTRICTED_DESC: 'Akses terbatas. Halaman ini hanya dapat diakses oleh Koordinator / Pimpinan.',
  MAINTENANCE: {
    TITLE: 'Sedang Dalam Pemeliharaan',
    DEFAULT_MESSAGE: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    BACK_TO_HOME: 'Kembali ke Dashboard',
  },
  SUPERADMIN_BANNER: {
    TEXT: 'Mode Pratinjau Superadmin: Halaman ini sedang dinonaktifkan untuk pengguna lain.',
    MANAGE_BTN: 'Kelola Akses',
  },
  TOAST: {
    UPDATE_SUCCESS: 'Status halaman berhasil diperbarui',
    UPDATE_FAILED: 'Gagal memperbarui status halaman',
    FETCH_FAILED: 'Gagal memuat konfigurasi halaman',
    FALLBACK_TO_DASHBOARD: 'Monitoring Wilayah sedang dalam pemeliharaan. Anda dialihkan ke Dashboard Operasional Rute.',
    MONITORING_UNDER_MAINTENANCE: 'Fitur Monitoring Wilayah saat ini sedang dalam pemeliharaan berkala oleh Administrator.',
  },
  PROFILE_MENU: {
    PAGE_MANAGEMENT: 'Manajemen Halaman',
    PAGE_MANAGEMENT_DESC: 'Atur aktif/nonaktif halaman & fitur aplikasi',
  },
} as const;
