/**
 * Kamus teks antarmuka: Modal Generator Laporan WhatsApp & template pesan Transjakarta.
 */
export const TEXT_WA_REPORT = {
  MODAL_TITLE: 'Generator Laporan WhatsApp',
  MODAL_SUBTITLE: 'Siap salin & kirim ke grup pimpinan',
  FORMAT_1_BTN: 'Format 1 (Komprehensif)',
  FORMAT_2_BTN: 'Format 2 (Rincian Shift)',
  FORMAT_3_BTN: 'Format 3 (Status Armada)',
  FORMAT_3_DESC: 'Laporan Status Kesiapan Armada Per Shift',
  SHIFT_SELECTOR: {
    SHIFT_1: '☀️ Shift 1 (Pagi)',
    SHIFT_2: '🌙 Shift 2 (Siang)',
  },
  BLOCKING_TITLE: (shift: number) => `⚠️ Laporan Status Armada Shift ${shift} Belum Siap Dibuat`,
  BLOCKING_DESC: (count: number, routes: string[]) =>
    `Masih ada ${count} rute yang belum mengonfirmasi status armada: ${routes.join(', ')}. Harap pastikan seluruh rute terkonfirmasi terlebih dahulu.`,
  UNCONFIRMED_ROUTES_BADGE: (count: number) => `${count} Rute Belum Konfirmasi`,
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
    FORMAT_3_HEADER: (day: string, date: string, shift: number, shiftName: string) =>
      `*LAPORAN STATUS KESIAPAN ARMADA*\n*MIKROTRANS WILAYAH UTARA*\n*HARI / TANGGAL :* ${day}, ${date}\n*SHIFT :* ${shift} (${shiftName})`,
    FORMAT_3_CLOSING: '_Demikian laporan status kesiapan armada dibuat untuk diketahui pimpinan. Terima kasih._',
    FORMAT_3_SUMMARY_TITLE: 'RINGKASAN STATUS KESIAPAN ARMADA',
    FORMAT_3_ROUTE_DETAIL_TITLE: 'RINCIAN STATUS ARMADA PER RUTE',
    FORMAT_3_OFF_SUBHEADER: '*Unit Libur (OFF):*',
  },
} as const;
