/**
 * Kamus teks antarmuka: Pesan konfirmasi SweetAlert2 dan toast notifikasi pengguna.
 */
export const TEXT_ALERTS = {
  LOGOUT: {
    TITLE: 'Yakin Ingin Logout?',
    TEXT: 'Apakah Anda yakin ingin keluar dari akun ini?',
    CONFIRM_BTN: 'Ya, Keluar',
    CANCEL_BTN: 'Batal',
  },
  DELETE_QUEUE: {
    TITLE: 'Hapus Antrean',
    TEXT: 'Apakah Anda yakin ingin menghapus perubahan ini dari antrean offline?',
    CONFIRM_BTN: 'Hapus',
    CANCEL_BTN: 'Batal',
  },
  AUTH_EXPIRED: {
    TITLE: 'Sesi Telah Berakhir',
    TEXT: 'Sesi akses Google Sheets Anda telah kedaluwarsa. Silakan perbarui sesi untuk melanjutkan sinkronisasi.',
    CONFIRM_BTN: 'Perbarui Sesi',
    CANCEL_BTN: 'Nanti',
  },
  CONFLICT: {
    TITLE: 'Tabrakan Data (Conflict)',
    UNIT_TEXT: (unit: string) =>
      `Data unit ${unit} di Google Sheets telah berubah saat Anda offline. Data dari server digabung dengan input Anda.`,
    GENERAL_TEXT:
      'Data di Google Sheets telah berubah saat Anda offline. Data dari server digabung dengan input Anda.',
    CONFIRM_BTN: 'Force Save (Timpa)',
    DENY_BTN: 'Gunakan & Gabung Data Server',
    CANCEL_BTN: 'Batal',
  },
  FORMAT_SHEET: {
    TITLE: 'Rapikan & Format Spreadsheet?',
    TEXT: 'Proses ini akan merapikan tata letak dan penomoran Google Sheets secara otomatis.',
    CONFIRM_BTN: 'Ya, Rapikan Sheet',
    CANCEL_BTN: 'Batal',
    SUCCESS: 'Spreadsheet berhasil dirapikan!',
  },
  BULK_TRIP: {
    TITLE: 'Set Jumlah Trip Armada',
    APPLY_BTN: 'Terapkan',
    CANCEL_BTN: 'Batal',
  },
  BULK_COPY_KM: {
    TITLE: 'Salin Massal KM S1 ➔ KM S2',
    APPLY_BTN: 'Terapkan Salin KM',
    CANCEL_BTN: 'Batal',
  },
  MODAL_COMMON: {
    UNDERSTAND: 'Mengerti',
    CONTINUE: 'Lanjutkan',
    CANCEL: 'Batal',
  },
  QUEUE_MODAL: {
    TITLE: 'Antrean Sinkronisasi',
    EMPTY: 'Tidak ada antrean.',
    TAB_LABEL: (tab: string, row: number) => `Tab ${tab} - Baris ${row}`,
    STATUS_PENDING: (attempt: number) => `⏳ Menunggu (percobaan ke-${attempt})`,
    STATUS_FAILED: (retries: number) => `❌ Gagal setelah ${retries} percobaan`,
    STATUS_CONFLICT: '⚠️ Tabrakan data: Data server telah berubah',
    BTN_RETRY: 'Coba Lagi',
    BTN_DELETE: 'Hapus',
    BTN_USE_SERVER: 'Gunakan Data Server',
    BTN_FORCE_SAVE: 'Force Save',
    BTN_SYNC_NOW: 'Sinkronkan Sekarang',
    BTN_CLOSE: 'Tutup',
    TOAST_RETRY: 'Mencoba menyinkronkan kembali...',
    TOAST_USE_SERVER: 'Menggunakan data dari server.',
    TOAST_FORCE_SAVE: 'Menimpa data server dengan data lokal...',
    TOAST_START_SYNC: 'Memulai proses sinkronisasi antrean...',
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
