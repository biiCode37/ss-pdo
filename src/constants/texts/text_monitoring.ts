/**
 * Kamus teks antarmuka: Dashboard Monitoring Wilayah 18 Rute untuk Korlap / Pimpinan.
 */
export const TEXT_MONITORING = {
  HEADER: {
    TITLE: 'Monitoring Wilayah Utara',
    SUBTITLE: 'Dashboard All Route & Rekapitulasi Harian Transjakarta',
    BTN_BACK: 'Operasi Rute',
    BTN_BACK_TITLE: 'Kembali ke Operasi Rute Tunggal',
    BTN_WA_REPORT: 'Buat Laporan WA',
    REFRESH_TITLE: 'Perbarui Data',
  },
  ERROR_STATE: {
    TITLE: 'Gagal Memuat Data',
    RETRY_BTN: 'Coba Lagi',
  },
  READINESS: {
    LABEL: 'Status Kelengkapan Laporan PDO Wilayah:',
    SUMMARY: (submitted: number, total: number, pct: number) =>
      `${submitted} / ${total} Rute Siap (${pct}%)`,
    LEGEND_VERIFIED: 'Terverifikasi:',
    LEGEND_SUBMITTED: 'Submitted:',
    LEGEND_DRAFT: 'Draft:',
    LEGEND_EMPTY: 'Belum Diisi:',
  },
  KPI: {
    FLEET_LABEL: 'Armada Wilayah',
    FLEET_UNIT: 'bus',
    FLEET_PCT: (pct: string) => `${pct}% Armada`,
    FLEET_BREAKDOWN: (s1: number, s2: number) => `S1: ${s1} | S2: ${s2}`,
    PASSENGER_LABEL: 'Total Pelanggan',
    PASSENGER_UNIT: 'org',
    PASSENGER_BREAKDOWN: (s1: string, s2: string) => `S1: ${s1} S2: ${s2}`,
    KM_LABEL: 'Total Jarak Tempuh',
    KM_UNIT: 'km',
    KM_AVG: (avg: string) => `Rerata / Bus: ${avg} km`,
    KM_AVG_LABEL: 'Rerata / Bus:',
    KM_ACHIEVE: (pct: string) => `Cap: ${pct}%`,
    SHIFT_DISTRIBUTION: 'Distribusi Shift',
    SHIFT_1_ROW: 'Shift 1:',
    SHIFT_2_ROW: 'Shift 2:',
  },
  TABS: {
    ALL_ROUTES: (count: number) => `Semua Rute (${count})`,
    ALL_LABEL: 'Semua Rute',
  },
  ROUTE_CARD: {
    OPEN_ROUTE_TITLE: 'Buka rute ini',
    HEADWAY_LABEL: (min: number, max: number) => `Headway: ${min} - ${max} mnt`,
    KORLAP_PREFIX: 'Korlap:',
    METRIC_ARMADA: 'Armada',
    METRIC_PASSENGERS: 'Pelanggan',
    METRIC_KM: 'KM Tempuh',
    KM_PER_BUS_PREFIX: 'KM/B:',
    JAM_PREFIX: 'Macet:',
    ISSUE_PREFIX: 'Kendala:',
    BTN_VERIFY: 'Verifikasi',
    BADGE_VERIFIED: 'Verified',
    BADGE_SUBMITTED: 'Submitted',
    BADGE_DRAFT: 'Draft',
    BADGE_EMPTY: 'Belum Diisi',
  },
} as const;
