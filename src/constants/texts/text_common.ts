/**
 * Kamus teks antarmuka: Tombol aksi umum, status koneksi, dan navigasi global.
 */
export const TEXT_COMMON = {
  BUTTONS: {
    SAVE: 'Simpan',
    CANCEL: 'Batal',
    CLOSE: 'Tutup',
    RETRY: 'Coba Lagi',
    REFRESH: 'Perbarui Data',
    BACK: 'Kembali',
    BACK_TO_ROUTE: 'Operasi Rute',
    COPY_TEXT: 'Salin Teks',
    OPEN_WA: 'Buka WhatsApp',
    VERIFY: 'Verifikasi',
    EDIT: 'Ubah',
    DELETE: 'Hapus',
    ADD: 'Tambah',
  },
  STATUS: {
    ONLINE: 'Online',
    OFFLINE_BANNER: '⚠️ Koneksi Terputus - Mode Offline Aktif',
    LOADING: 'Memuat data...',
    SAVING: 'Menyimpan data...',
    PROCESSING: 'Memproses...',
    SYNCING: 'Sinkronisasi...',
  },
  NAV: {
    PREV_DAY: 'Hari Sebelumnya',
    NEXT_DAY: 'Hari Berikutnya',
    CHOOSE_DATE: 'Pilih Tanggal',
  },
  MONTHS: [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ],
} as const;
