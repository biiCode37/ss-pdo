/**
 * Kamus teks antarmuka: Form input operasional rute petugas PDO di lapangan.
 */
export const TEXT_PDO_FORM = {
  CARD_TITLE: 'Laporan Kondisi & Armada Rute',
  CARD_SUBTITLE: (code: string) => `Input fisik lapangan PDO ${code}`,
  ARMADA_SECTION: 'Armada Operasi (Renops / Realops Per Shift)',
  SHIFT_1: {
    TITLE: 'Shift 1',
    RENOPS_LABEL: 'Renops Shift 1',
    REALOPS_LABEL: 'Realops Shift 1',
  },
  SHIFT_2: {
    TITLE: 'Shift 2',
    RENOPS_LABEL: 'Renops Shift 2',
    REALOPS_LABEL: 'Realops Shift 2',
  },
  HEADWAY: {
    SECTION_TITLE: 'Waktu Antara (Headway)',
    FASTEST_LABEL: 'Headway Tercepat (Menit)',
    SLOWEST_LABEL: 'Headway Terlama (Menit)',
    UNIT: 'menit',
  },
  TRAFFIC_JAMS: {
    SECTION_TITLE: 'Titik Kemacetan Hari Ini (Tap untuk memilih)',
    ADD_SPOT_PLACEHOLDER: 'Tambah ruas jalan macet baru...',
    ADD_BTN: 'Tambah',
    NO_SPOTS: 'Belum ada titik macet dipilih',
  },
  ISSUES: {
    SECTION_TITLE: 'Catatan Kendala Operasional (Opsional)',
    PLACEHOLDER: 'Contoh: Realisasi berkurang karena perbaikan unit di pul...',
  },
  BUTTONS: {
    SUBMIT: 'Kirim Laporan Operasional',
    SUBMITTING: 'Menyimpan...',
  },
  BADGES: {
    DRAFT: 'Draft',
    SUBMITTED: 'Lengkap (Submitted)',
    VERIFIED: 'Terverifikasi',
  },
  TOAST_SUCCESS: 'Laporan operasional rute berhasil dikirim',
} as const;
