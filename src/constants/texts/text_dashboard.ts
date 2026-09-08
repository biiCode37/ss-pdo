/**
 * Kamus teks antarmuka: Header PUSM, selektor rute, tab navigasi bawah, kartu unit bus.
 */
export const TEXT_DASHBOARD = {
  APP_TITLE: 'PUSM',
  APP_SUBTITLE: 'PDO Utara Spreadsheet Mobile',
  TABS: {
    INPUT_SS: 'Input SS',
    DASHBOARD: 'Dashboard',
    UNIT_LIST: 'Daftar Unit',
    ACCUMULATION: 'Akumulasi',
  },
  SWITCHER: {
    REGIONAL_MONITORING: 'Wilayah',
    TITLE: 'Buka Dashboard Monitoring Wilayah & Laporan WA',
  },
  ROUTE_SELECTOR: {
    LABEL: 'Rute & Tanggal Operasional',
    SEARCH_PLACEHOLDER: 'Cari kode rute...',
    SELECT_ROUTE_PROMPT: 'Pilih Rute',
    NO_ROUTES_FOUND: 'Rute tidak ditemukan',
    ACCUMULATION_RANGE_LABEL: 'Rentang Akumulasi Tanggal',
    EXIT_ACCUMULATION: 'Kembali ke Harian',
  },
  UNIT_CARD: {
    ARMADA: 'Unit Bus',
    DRIVER: 'Pramudi',
    KM: 'KM Tempuh',
    TOA: 'TOA',
    MANUAL: 'Manual',
    TOTAL_PAX: 'Pelanggan',
    RITASE_DIFF: 'Selisih Ritase',
    STATUS_OPERASI: 'Status Operasi',
  },
} as const;
