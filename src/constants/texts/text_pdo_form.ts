/**
 * Kamus teks antarmuka: Form input operasional rute petugas PDO di lapangan.
 */
export const TEXT_PDO_FORM = {
  CARD_TITLE: 'Laporan Operasi Rute (PDO)',
  CARD_SUBTITLE: 'Input manual kesiapan armada & kondisi rute per shift',
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
    SECTION_TITLE: 'Interval Waktu Antara Bus (Headway)',
    FASTEST_LABEL: 'Headway Tercepat (menit)',
    SLOWEST_LABEL: 'Headway Terlama (menit)',
    UNIT: 'menit',
  },
  TRAFFIC_JAMS: {
    SECTION_TITLE: 'Titik Kemacetan Lintasan',
    ADD_SPOT_PLACEHOLDER: 'Tambah ruas jalan macet baru...',
    ADD_BTN: 'Tambah',
    NO_SPOTS: 'Belum ada titik macet dipilih',
  },
  ISSUES: {
    SECTION_TITLE: 'Catatan Kendala Operasional',
    PLACEHOLDER: 'Tuliskan hambatan seperti banjir, pengalihan rute, kecelakaan, mogok (opsional)...',
  },
  BUTTONS: {
    SUBMIT: 'Simpan & Kirim Laporan',
    SUBMITTING: 'Menyimpan Laporan...',
  },
  BADGES: {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
  },
} as const;
