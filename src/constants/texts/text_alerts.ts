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
    HTML_EXPLANATION: (tabName: string) => `
      <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; text-align: left;">
        Sistem akan merapikan seluruh baris data pada tanggal <strong>${tabName}</strong> di Google Sheets asli:
        <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: rgba(62, 207, 142, 0.08); border: 1px solid rgba(62, 207, 142, 0.2);">
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Standar Format yang Diterapkan:</div>
          <div style="font-size: 12px; color: var(--text-secondary);">
            • <strong>Teks & Perataan:</strong> Normal (tidak bold), Rata Tengah Horizontal & Vertikal, Wrap Text.<br/>
            • <strong>Warna Baris (No Body s/d Total KM S2):</strong><br/>
            &nbsp;&nbsp;🔵 Skyblue untuk <code>BA.01-04</code>, <code>NP1</code>, <code>NP2</code><br/>
            &nbsp;&nbsp;🟡 Kuning untuk <code>OFF</code><br/>
            &nbsp;&nbsp;🔴 Merah untuk <code>TO EVDAL</code><br/>
            &nbsp;&nbsp;🟢 Hijau Muda untuk Catatan Lainnya / Bebas
          </div>
        </div>
      </div>
    `,
    CONFIRM_BTN: 'Ya, Rapikan Sheet',
    CANCEL_BTN: 'Batal',
    SUCCESS: 'Spreadsheet berhasil dirapikan!',
  },
  BULK_TRIP: {
    TITLE: 'Set Jumlah Trip Armada',
    DESCRIPTION: (count: number | string) =>
      `Nilai di bawah akan langsung diterapkan ke seluruh <strong>${count} unit bus</strong> pada rute ini dan disimpan ke spreadsheet.`,
    APPLY_BTN: 'Terapkan',
    CANCEL_BTN: 'Batal',
    REQUIRED: 'Harap isi nilai Trip Pergi dan Trip Pulang!',
    VALIDATION_POSITIVE: 'Nilai trip harus berupa angka positif!',
    VALIDATION_MAX: (max: number) => `Jumlah trip tidak boleh lebih dari ${max}!`,
  },
  BULK_COPY_KM: {
    TITLE: 'Salin Massal KM S1 ➔ KM S2',
    APPLY_BTN: 'Terapkan Salin KM',
    CANCEL_BTN: 'Batal',
    ELIGIBLE_UNITS: (count: number | string) =>
      `Ditemukan <strong>${count} unit bus</strong> yang memenuhi syarat (memiliki <strong>KM Akhir Shift 1</strong> & tanpa keterangan).`,
    SKIPPED_WITH_NOTES: (count: number | string) =>
      `⚠️ <strong>${count} unit bus</strong> dilewati secara otomatis karena memiliki nilai pada kolom keterangan.`,
    MODE_ONLY_EMPTY: (count: number | string) => `Hanya isi yang masih kosong (${count} unit)`,
    MODE_ONLY_EMPTY_DESC_REC: 'Direkomendasikan agar tidak menimpa data yang sudah diisi manual.',
    MODE_ONLY_EMPTY_DESC_DONE: 'Seluruh unit yang memenuhi syarat sudah memiliki nilai KM Awal S2.',
    MODE_ALL: (count: number | string) => `Salin & perbarui semua (${count} unit)`,
    MODE_ALL_DESC: 'Menimpa seluruh nilai KM Awal Shift 2 dengan KM Akhir Shift 1.',
  },
  BUS_INPUT_MODAL: {
    SAVE_BTN: 'Simpan',
    CANCEL_BTN: 'Batal',
    LABEL_TOA_S1: 'TOA Shift 1',
    LABEL_TOTAL_TOA: 'Total TOA',
    LABEL_MANUAL_S1: 'Manual Shift 1',
    LABEL_MANUAL_S2: 'Manual Shift 2',
    LABEL_KM_AWAL_S1: 'KM Awal Shift 1',
    LABEL_KM_AKHIR_S1: 'KM Akhir Shift 1',
    LABEL_KM_AWAL_S2: 'KM Awal Shift 2',
    LABEL_KM_AKHIR_S2: 'KM Akhir Shift 2',
    KM_AKHIR_LESS_THAN_AWAL: (shift: string, akhir: string, awal: string) =>
      `KM Akhir ${shift} (${akhir}) tidak boleh lebih kecil dari KM Awal (${awal})!`,
    KM_DIFF_EXCEEDS_MAX: (shift: string, diff: number, max: number) =>
      `Jarak tempuh ${shift} (+${diff} KM) melebihi batas maksimal wajar (${max} KM). Periksa kembali angka yang dimasukkan!`,
    TOA_MUST_BE_POSITIVE: (field: string) => `Nilai ${field} harus berupa angka positif!`,
    TOA_MAX_DIGITS: (field: string, max: number) =>
      `Nilai ${field} tidak boleh lebih dari 3 digit (maksimal ${max})!`,
    TOTAL_TOA_LESS_THAN_S1: (total: string, s1: string) =>
      `Total TOA (${total}) tidak boleh lebih kecil dari TOA Shift 1 (${s1})!`,
    TRIP_MAX_COUNT: (field: string, max: number) => `Jumlah ${field} tidak boleh lebih dari ${max}!`,
    POSITIVE_NUMBER: 'Nilai harus berupa angka positif!',
    CLEAR_NOTE: '✕ Hapus',
    BA02_SELECT_DEFAULT: '-- Pilih Keterangan BA.02 --',
    BA02_CUSTOM_OPTION: 'Lainnya... (ketik manual)',
    PLACEHOLDER_FIXED: 'Nilai tetap terkunci',
    PLACEHOLDER_BA02: 'Ketik alasan/kendala...',
    PLACEHOLDER_PREFIX: 'Ketik detail kendala/alasan...',
    PLACEHOLDER_DEFAULT: 'Catatan unit...',
    SWITCH_DROPDOWN_TITLE: 'Kembali ke pilihan dropdown',
    REMOVE_PREFIX_TITLE: 'Lepas prefix',
    SATSET_ACTIVE_TITLE: 'Mode Beruntun Aktif (Auto-Next Bus)',
    SATSET_INACTIVE_TITLE: 'Aktifkan Mode Beruntun (Auto-Next Bus)',
    SATSET_LABEL: 'Mode Beruntun',
    TAB_SHIFT1: '🔵 Shift 1',
    TAB_SHIFT2: '🟣 Shift 2',
    TAB_TRIP: '🚌 Trip',
    TAB_NOTES: '📝 Catatan',
    SECTION_SHIFT1: 'Data Shift 1',
    SECTION_SHIFT2: 'Data Shift 2',
    SECTION_TRIP: 'Trip Operasional',
    SECTION_NOTES: 'Catatan Khusus Unit',
    SECTION_TRIP_CARD: 'Trip Operasional Armada',
    LABEL_NOTES: 'Catatan / Keterangan',
    LABEL_OPTIONAL: 'Opsional',
    COPY_KM_TITLE: 'Salin nilai KM Akhir Shift 1',
    COPY_KM_S1_BTN: '📋 Salin KM S1',
    COPY_KM_S1_WITH_VAL: (val: string) => `📋 Salin KM S1 (${val})`,
    CHIP_MANUAL_S1: '+ Manual S1',
    CHIP_MANUAL_S2: '+ Manual S2',
    CHIP_KETERANGAN: '+ Catatan',
    CHIP_KETERANGAN_KENDALA: '+ Catatan Kendala',
    LABEL_KM_REF_S1: 'KM Awal S1 (Acuan):',
    LABEL_KM_REF_S2: 'KM Awal S2 (Acuan):',
    NOT_FILLED_YET: '(Belum Diisi)',
    DIFF_SMALLER: '(⚠️ Lebih kecil)',
    DIFF_EXCEEDS: (diff: number, max: number) => `(⚠️ +${diff} KM - Melebihi ${max} KM)`,
    DIFF_VALID: (diff: number) => `(+${diff} KM)`,
    META_PLACEHOLDERS: {
      TOA_S1: 'Contoh: 120',
      TOTAL_TOA: 'Contoh: 250',
      KM_AWAL_1: 'Contoh: 12450',
      KM_AKHIR_1: 'Contoh: 12580',
      KM_AWAL_2: 'Contoh: 12580',
      KM_AKHIR_2: 'Contoh: 12710',
    },
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
