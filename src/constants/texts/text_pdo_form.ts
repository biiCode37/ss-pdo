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
  A2_REPORT: {
    PILL_LABEL: 'Laporan A2',
    STATUS_VERIFIED: 'Terverifikasi',
    STATUS_SUBMITTED: 'Terkirim',
    MODAL_TITLE: 'Laporan Harian A2 Armada',
    SUBTITLE: (routeCode: string, date: string, shift: number) =>
      `Rute ${routeCode} • ${date} • Shift ${shift}`,
    RENOPS_TARGET_LABEL: 'Target Renops (Unit)',
    REALOPS_LABEL: 'Realisasi Operasi (Realops)',
    NOTES_SECTION_TITLE: 'Daftar Unit Berkendala / Catatan Khusus',
    PREFILL_BANNER: 'Draft catatan ditarik otomatis dari keterangan spreadsheet rute.',
    ADD_UNIT_BTN: '+ Tambah Catatan Unit',
    UNIT_BODY_PLACEHOLDER: 'No. Body (cth: TS.01)',
    SELECT_UNIT_PLACEHOLDER: '-- Pilih No. Body --',
    CUSTOM_UNIT_OPTION: '+ Input Manual / Unit Lain...',
    SWITCH_TO_DROPDOWN_BTN: 'Kembali ke Dropdown',
    NOTE_PLACEHOLDER: 'Keterangan kendala / status (cth: BA.01 Radiator)',
    REMOVE_UNIT_BTN: 'Hapus',
    SUBMIT_BTN: (shift: number) => `Kirim Laporan A2 Shift ${shift}`,
    SAVING_BTN: 'Menyimpan Laporan...',
    TOAST_SUCCESS: (shift: number) => `Laporan A2 Shift ${shift} berhasil disimpan`,
    ERROR_SUBMIT: 'Gagal menyimpan laporan A2 ke server. Silakan periksa jaringan dan coba lagi.',
  },
} as const;
