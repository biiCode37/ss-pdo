/**
 * Kamus teks antarmuka: Katalog pesan kesalahan ramah pengguna (non-teknis).
 */
export const TEXT_ERRORS = {
  DEFAULT_FALLBACK: 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba beberapa saat lagi.',
  GENERIC_ISSUE: 'Terjadi kendala sistem. Silakan coba beberapa saat lagi atau hubungi admin.',
  NETWORK_FAILURE: 'Koneksi internet Anda terputus. Silakan periksa jaringan dan coba beberapa saat lagi.',
  LOAD_REGIONAL_FAILED: 'Gagal memuat data monitoring wilayah. Silakan periksa koneksi internet Anda dan coba lagi.',
  VERIFY_FAILED: 'Terjadi kesalahan saat memverifikasi laporan rute.',
  SAVE_REPORT_FAILED: 'Terjadi kesalahan saat menyimpan laporan operasional rute.',
  LOAD_DATA_FAILED: 'Gagal memuat data operasional spreadsheet.',
  SESSION_EXPIRED: 'Sesi anda telah berakhir. Ketuk tombol "Perbarui Sesi" untuk melanjutkan.',
  SHEET_NOT_FOUND: 'Data tab spreadsheet untuk periode ini tidak ditemukan.',
  EMPTY_QUEUE: 'Tidak ada item antrean yang perlu disinkronkan.',
  PERMISSION_DENIED_FILE: 'Gagal mengakses Google Sheets (Hak Akses Ditolak). Akun Google Anda tidak memiliki akses ke dokumen ini. Pastikan dokumen telah dibagikan (share) ke akun Anda.',
  PERMISSION_DENIED_GENERAL: 'Gagal mengakses Google Sheets. Pastikan akun Anda memiliki hak akses ke dokumen tersebut.',
  CONFIG_MISSING: 'Layanan belum siap dikonfigurasi. Silakan hubungi admin operasional.',
  AUTH_TIMEOUT: 'Koneksi ke layanan autentikasi terganggu atau membutuhkan waktu lebih lama. Silakan coba lagi.',
  COLUMN_MISMATCH: 'Format kolom pada tabel Google Sheets tidak sesuai. Mohon periksa kembali dokumen Anda.',
  EMPTY_SHEET: 'Tidak ditemukan data pada lembar kerja ini.',
} as const;
