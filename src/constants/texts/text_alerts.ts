/**
 * Kamus teks antarmuka: Pesan konfirmasi SweetAlert2 dan toast notifikasi pengguna.
 */
export const TEXT_ALERTS = {
  LOGOUT: {
    TITLE: 'Konfirmasi Keluar',
    TEXT: 'Apakah Anda yakin ingin keluar dari akun ini?',
    CONFIRM_BTN: 'Ya, Keluar',
    CANCEL_BTN: 'Batal',
  },
  FORMAT_SHEET: {
    TITLE: 'Rapikan Format Spreadsheet?',
    TEXT: 'Proses ini akan merapikan tata letak dan penomoran Google Sheets secara otomatis.',
    CONFIRM_BTN: 'Ya, Rapikan',
    CANCEL_BTN: 'Batal',
    SUCCESS: 'Spreadsheet berhasil dirapikan!',
  },
  DELETE_QUEUE: {
    TITLE: 'Hapus Antrean?',
    TEXT: 'Perubahan yang belum tersinkronisasi pada unit ini akan dibatalkan.',
    CONFIRM_BTN: 'Hapus',
    CANCEL_BTN: 'Batal',
  },
  TOAST: {
    SUCCESS_REPORT_SAVED: 'Laporan rute berhasil disimpan!',
    SUCCESS_VERIFIED: 'Laporan rute berhasil diverifikasi!',
    SUCCESS_QUEUE_SYNCED: 'Data antrean berhasil disinkronkan ke Google Sheets!',
    SUCCESS_QUEUE_DELETED: 'Item berhasil dihapus dari antrean.',
    SUCCESS_USER_ADDED: 'Pengguna baru berhasil ditambahkan.',
    SUCCESS_ROLE_UPDATED: 'Peran pengguna berhasil diperbarui.',
  },
} as const;
