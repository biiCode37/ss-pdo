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
  OPEN_WA_BTN: 'Buka WhatsApp',
  COPIED_TOAST: 'Teks laporan berhasil disalin ke clipboard',
  NO_DATA: 'Belum ada data laporan operasional untuk tanggal ini.',
  TEMPLATE: {
    TITLE: 'LAPORAN OPERASIONAL HARIAN',
    REGION_NAME: 'MIKROTRANS WILAYAH UTARA',
    FORMAT_1_SUBTITLE: 'REKAPITULASI CAPAIAN LAYANAN',
    FORMAT_2_SUBTITLE: 'FORMAT : [TOA]+[MANUAL]=JUMLAH PELANGGAN',
  },
} as const;
