/**
 * Kamus teks antarmuka: Katalog pesan kesalahan ramah pengguna (non-teknis).
 */
export const TEXT_ERRORS = {
  DEFAULT_FALLBACK: 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba beberapa saat lagi.',
  NETWORK_FAILURE: 'Gagal terhubung ke server. Silakan periksa koneksi internet Anda dan coba lagi.',
  LOAD_REGIONAL_FAILED: 'Gagal memuat data monitoring wilayah. Silakan periksa koneksi internet Anda dan coba lagi.',
  VERIFY_FAILED: 'Terjadi kesalahan saat memverifikasi laporan rute.',
  SAVE_REPORT_FAILED: 'Terjadi kesalahan saat menyimpan laporan operasional rute.',
  LOAD_DATA_FAILED: 'Gagal memuat data operasional spreadsheet.',
  SESSION_EXPIRED: 'Sesi Google Sheets kedaluwarsa. Silakan ketuk tombol login ulang untuk memperbarui sesi.',
  SHEET_NOT_FOUND: 'Data tab spreadsheet untuk periode ini tidak ditemukan.',
  EMPTY_QUEUE: 'Tidak ada item antrean yang perlu disinkronkan.',
} as const;
