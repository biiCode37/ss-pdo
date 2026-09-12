/**
 * Kamus teks antarmuka: Status armada, modal status operasi, tab shift, dan banner alert konfirmasi shift.
 */
export const TEXT_FLEET_STATUS = {
  MODAL: {
    TITLE: 'Status Armada',
    SEGMENT_FLEET: 'Status Armada',
    SEGMENT_REPORT: 'Laporan Operasional',
    REPORT_TITLE: 'Buka laporan operasional',
    CLOSE_TITLE: 'Tutup',
    SHIFT_1_TAB: 'Shift 1 (Pagi)',
    SHIFT_2_TAB: 'Shift 2 (Siang)',
    SGO_ALL_BTN: 'SGO Semua Unit',
    SAVING: 'Menyimpan Status Armada...',
    CONFIRM_CONTINUE_REPORT: 'Konfirmasi & Terapkan Status',
    CONFIRM_APPLY_SHIFT: (shift: number) => `Konfirmasi & Terapkan Status Shift ${shift}`,
    APPLY_STATUS_TITLE: (brush: string) => `Klik untuk menerapkan status ${brush}`,
    SGO_FULL_LABEL: 'Siap Guna Operasi',
    LOCK_BANNER_MESSAGE: (shift: number) =>
      `Status armada Shift ${shift} belum dikonfirmasi. Tentukan status armada terlebih dahulu untuk mulai mengisi data operasional.`,
    LOCK_CARD_TOOLTIP: 'Status armada belum dikonfirmasi. Klik untuk menentukan status.',
    NON_SGO_ALERT_TITLE: (unit: string) => `Unit ${unit} Tidak Beroperasi`,
    NON_SGO_ALERT_HTML: (unit: string, status: string) =>
      `Unit <b>${unit}</b> saat ini berstatus <b>${status}</b> sehingga pengisian data operasional dikunci.<br/><br/>Apakah Anda ingin membuka <b>Status Armada</b> untuk mengubah status unit ini?`,
    NON_SGO_BTN_OPEN_FLEET: 'Buka Status Armada',
    NON_SGO_BTN_CANCEL: 'Batal',
  },
  STATUS_CODES: {
    SGO: 'SGO',
    OFF: 'OFF',
    TO: 'T.O',
  },
  ALERT_BAR: {
    SHIFT_1_UNCONFIRMED: 'Status Armada Shift 1 belum dikonfirmasi',
    SHIFT_2_UNCONFIRMED: 'Pergantian Shift 2: Konfirmasi status armada',
    ACTION_BTN: 'Tentukan Status',
  },
  TOAST: {
    APPLY_SUCCESS: (shift: number) => `Status armada Shift ${shift} berhasil diterapkan!`,
    APPLY_FAILED: 'Gagal menerapkan status armada',
    APPLY_ERROR: 'Gagal menerapkan status armada',
  },
} as const;
