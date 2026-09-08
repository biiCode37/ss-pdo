/**
 * Kamus teks antarmuka: Modal Generator Laporan WhatsApp & template pesan Transjakarta.
 */
export const TEXT_WA_REPORT = {
  MODAL_TITLE: 'Generator Laporan WhatsApp',
  MODAL_SUBTITLE: 'Siap salin & kirim ke grup pimpinan',
  FORMAT_1_BTN: 'Format 1 (Komprehensif)',
  FORMAT_2_BTN: 'Format 2 (Rincian Shift)',
  FILTER_ALL: 'Semua Korlap',
  WARNING_UNSUBMITTED: (unsubmitted: number, total: number) =>
    `Perhatian: ${unsubmitted} dari ${total} rute belum mengirim laporan operasional harian. Laporan tetap dapat di-generate dengan data yang tersedia.`,
  COPY_BTN: 'Salin Teks',
  COPIED_BTN: 'Tersalin!',
  OPEN_WA_BTN: 'Buka WhatsApp',
  COPIED_TOAST: 'Teks laporan berhasil disalin ke clipboard',
  NO_DATA: 'Belum ada data laporan operasional untuk tanggal ini.',
  LOADING_PREVIEW: 'Memuat preview laporan...',
  SUPERVISOR_TABS: {
    ALL: (count: number) => `Semua Rute (${count})`,
    RANTO: (count: number) => `Ranto L.T. (${count})`,
    ABDUL: (count: number) => `Abdul Manan (${count})`,
    MOAMAR: (count: number) => `Moamar Z.A. (${count})`,
  },
  TEMPLATE: {
    TITLE: 'LAPORAN OPERASIONAL HARIAN',
    REGION_NAME: 'MIKROTRANS WILAYAH UTARA',
    GREETING: 'SELAMAT MALAM',
    FORMAT_1_TITLE: 'Laporan JUMLAH PELANGGAN & PENCAPAIAN Rata2 Kilometer / Bus  HARIAN Mikrotrans Jak Lingko Wilayah Utara',
    FORMAT_1_SUBTITLE: 'REKAPITULASI CAPAIAN LAYANAN',
    FORMAT_2_SUBTITLE: 'FORMAT   \t:\t[TOA]+[MANUAL]=JUMLAH PELANGGAN',
    FORMAT_2_SUBJECT: 'PERIHAL  \t:\tLAPORAN PELANGGAN',
    SHIFT_1_2: '1 & 2',
    SHIFT_1_TOTAL: '•Total Shift 1',
    SHIFT_2_TOTAL: '•Total Shift 2',
    CLOSING_FORMAT_1: '*_DEMIKIAN LAPORAN DIBUAT UNTUK DI KETAHUI PIMPINAN TERIMA KASIH_*',
    CLOSING_FORMAT_2: '```Demikian dilaporkan untuk diketahui Pimpinan.```',
  },
} as const;
