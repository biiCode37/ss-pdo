/**
 * Kamus teks antarmuka: Status armada, modal status operasi, tab shift, dan banner alert konfirmasi shift.
 */
export const TEXT_FLEET_STATUS = {
  MODAL: {
    TITLE: 'Status Armada',
    HEADER_TITLE: (route: string) => `Status Armada: ${route}`,
    TARGET_RENOPS: (target: number) => `Target Renops: ${target} Unit`,
    SEGMENT_FLEET: 'Status Armada',
    SEGMENT_REPORT: 'Laporan Operasional',
    REPORT_TITLE: 'Buka laporan operasional',
    CLOSE_TITLE: 'Tutup',
    SHIFT_1_TAB: 'Shift 1 (Pagi)',
    SHIFT_2_TAB: 'Shift 2 (Siang)',
    SAVING: 'Menyimpan Status Armada...',
    CONFIRM_CONTINUE_REPORT: 'Konfirmasi & Terapkan Status',
    CONFIRM_APPLY_SHIFT: (shift: number) => `Konfirmasi & Terapkan Status Shift ${shift}`,
    APPLY_STATUS_TITLE: (brush: string) => `Klik untuk menerapkan status ${brush}`,
    LOCK_BANNER_MESSAGE: (shift: number) =>
      `Pengingat: Status armada Shift ${shift} belum dikonfirmasi. Anda tetap dapat mengisi data, namun disarankan untuk segera mengonfirmasi status armada.`,
    LOCK_CARD_TOOLTIP:
      'Pengingat: Status armada belum dikonfirmasi. Disarankan untuk segera mengonfirmasi status armada.',
    MODAL_REMINDER: (shift: number) =>
      `Pengingat: Status armada Shift ${shift} belum dikonfirmasi. Disarankan untuk segera mengonfirmasi status armada.`,
  },
  STATUS_CODES: {
    SGO: 'SGO',
    OFF: 'OFF',
    TO: 'T.O',
    SO: 'SO',
  },
  LOCK: {
    LOCKED_BADGE: (time: string, by: string) => `Terkonfirmasi pada ${time} oleh ${by}`,
    LOCKED_BANNER: (shift: number) => `Status armada Shift ${shift} telah dikonfirmasi dan terkunci.`,
    LOCKED_TOOLTIP: 'Status armada shift ini telah dikonfirmasi dan terkunci (read-only).',
    LOCKED_BTN_LABEL: 'Terkunci',
  },
  TARGET_RENOPS_INPUT: {
    LABEL: 'Target Renops:',
    EDIT_TITLE: 'Klik untuk menyesuaikan target renops',
    SAVE_TITLE: 'Simpan target renops',
    UNIT_SUFFIX: 'Unit',
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
  QUICK_KORLAP: {
    MODAL_TITLE: 'Input Cepat Status Armada (Korlap)',
    SUBTITLE: (route: string, shift: number) => `Penetapan Manual Rute ${route} • Shift ${shift}`,
    RENOPS_LABEL: 'Target Renops (Unit)',
    REALOPS_LABEL: 'Realisasi Operasi (Realops)',
    NOTES_LABEL: 'Catatan / Keterangan Unit (Opsional)',
    NOTES_PLACEHOLDER: 'Contoh: TS.02 BA.01 Radiator, TS.05 EVDAL',
    BTN_SUBMIT: 'Simpan Status Rute',
    BTN_SAVING: 'Menyimpan...',
    TOAST_SUCCESS: (route: string) => `Status armada ${route} berhasil disimpan`,
    BTN_OPEN_QUICK_INPUT: '+ Isi Data Rute',
  },
} as const;
