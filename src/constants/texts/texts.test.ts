import { describe, it, expect } from 'vitest';
import {
  TEXT_COMMON,
  TEXT_AUTH,
  TEXT_DASHBOARD,
  TEXT_PDO_FORM,
  TEXT_MONITORING,
  TEXT_WA_REPORT,
  TEXT_ALERTS,
  TEXT_ERRORS,
  TEXT_FLEET_STATUS,
  TEXT_USER_MANAGEMENT,
  TEXT_UNIT_DETAIL,
} from './index';

describe('Centralized UI Text Dictionary', () => {
  it('exports TEXT_COMMON with buttons and status', () => {
    expect(TEXT_COMMON.BUTTONS.SAVE).toBe('Simpan');
    expect(TEXT_COMMON.BUTTONS.CANCEL).toBe('Batal');
    expect(TEXT_COMMON.BUTTONS.CLOSE).toBe('Tutup');
    expect(TEXT_COMMON.BUTTONS.RETRY).toBe('Coba Lagi');
    expect(TEXT_COMMON.BUTTONS.REFRESH).toBe('Perbarui Data');
    expect(TEXT_COMMON.BUTTONS.COPY_TEXT).toBe('Salin Teks');
    expect(TEXT_COMMON.STATUS.OFFLINE_BANNER).toContain('Mode Offline Aktif');
  });

  it('exports TEXT_AUTH with login and session strings', () => {
    expect(TEXT_AUTH.TITLE).toContain('PUSM');
    expect(TEXT_AUTH.SIGN_IN_BTN).toBeDefined();
    expect(TEXT_AUTH.SESSION_EXPIRED_TITLE).toBeDefined();
    expect(TEXT_AUTH.FEATURE_CARDS.CARD_1_TITLE).toBe('Dashboard Capaian Rute');
    expect(TEXT_AUTH.INFO_MODAL_TITLE).toBe('Tentang Aplikasi & Izin Akses');
    expect(TEXT_AUTH.INFO_MODAL_CLOSE).toBe('Tutup & Kembali');
    expect(TEXT_AUTH.VIEW_PERMISSIONS_DETAIL).toBe('Lihat rincian izin resmi Google');
    expect(TEXT_AUTH.HIDE_PERMISSIONS_DETAIL).toBe('Sembunyikan rincian izin resmi Google');
  });

  it('exports TEXT_DASHBOARD with app header, tabs, and selectors', () => {
    expect(TEXT_DASHBOARD.APP_TITLE).toBe('PUSM');
    expect(TEXT_DASHBOARD.APP_SUBTITLE).toBe('PDO Utara Spreadsheet Mobile');
    expect(TEXT_DASHBOARD.TABS.INPUT_SS).toBe('Input SS');
    expect(TEXT_DASHBOARD.TABS.DASHBOARD).toBe('Dashboard');
    expect(TEXT_DASHBOARD.TABS.UNIT_LIST).toBe('Daftar Unit');
    expect(TEXT_DASHBOARD.TABS.ACCUMULATION).toBe('Akumulasi');
    expect(TEXT_DASHBOARD.TOA_TREND.TITLE).toBe('Grafik Pelanggan Harian');
    expect(TEXT_DASHBOARD.KPIS.TITLE).toBe('Capaian Pelanggan & Km');
    expect(TEXT_DASHBOARD.SHIFT_COMPARISON.TITLE).toBe('Komparasi Pelanggan');
    expect(TEXT_DASHBOARD.COMPLETION_STATUS.TITLE).toBe('Unit Dengan Keterangan Tertentu');
    expect(TEXT_DASHBOARD.BUS_LIST.SEARCH_PLACEHOLDER).toBe('Cari No. Body Unit...');
    expect(TEXT_DASHBOARD.ACCUMULATION_SHEET.TITLE).toBe('Rekap Akumulasi Lintas Periode');
    expect(TEXT_DASHBOARD.ROUTE_SELECTOR.ACTIVE_ROUTE_TITLE('JAK.115')).toContain('JAK.115');
    expect(TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_DISPLAY_TITLE('05 Sep 2026')).toContain('05 Sep 2026');
    expect(TEXT_DASHBOARD.BUS_LIST.DAILY_PROGRESS).toBe('Progres Harian');
    expect(TEXT_DASHBOARD.BUS_LIST.COLUMN_PREFIX('TOA')).toBe('Kolom: TOA');
    expect(TEXT_DASHBOARD.BUS_LIST.CATEGORIES.MANUAL_S1).toBe('Manual S1');
    expect(TEXT_DASHBOARD.BUS_LIST.CATEGORIES.MANUAL_S2).toBe('Manual S2');
    expect(TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNCONFIRMED_BADGE).toBe('⚠️ Belum Konfirmasi');
    expect(TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP('OFF')).toBe('Status unit: OFF');
  });

  it('exports TEXT_PDO_FORM with shift inputs and badges', () => {
    expect(TEXT_PDO_FORM.CARD_TITLE).toBe('Laporan Kondisi & Armada Rute');
    expect(TEXT_PDO_FORM.SHIFT_1.TITLE).toBe('Shift 1');
    expect(TEXT_PDO_FORM.SHIFT_2.TITLE).toBe('Shift 2');
    expect(TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL).toBe('Headway Tercepat (Menit)');
    expect(TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL).toBe('Headway Terlama (Menit)');
    expect(TEXT_PDO_FORM.BUTTONS.SUBMIT).toContain('Kirim Laporan Operasional');
  });

  it('exports TEXT_MONITORING with interpolation functions and KPI titles', () => {
    expect(TEXT_MONITORING.HEADER.TITLE).toBe('Monitoring Wilayah Utara');
    expect(TEXT_MONITORING.READINESS.LABEL).toContain('Status Kelengkapan Laporan');
    expect(TEXT_MONITORING.READINESS.SUMMARY(16, 18, 89)).toBe('16 / 18 Rute Siap (89%)');
    expect(TEXT_MONITORING.KPI.FLEET_LABEL).toBe('Armada Wilayah');
    expect(TEXT_MONITORING.KPI.PASSENGER_LABEL).toBe('Total Pelanggan');
    expect(TEXT_MONITORING.KPI.KM_LABEL).toBe('Total Jarak Tempuh');
    expect(TEXT_MONITORING.KPI.SHIFT_DISTRIBUTION).toBe('Distribusi Shift');
    expect(TEXT_MONITORING.HEADER.BTN_SYNC_GLOBAL).toBeDefined();
    expect(TEXT_MONITORING.SYNC_MODAL.TITLE).toBeDefined();
    expect(TEXT_MONITORING.SYNC_MODAL.SUCCESS_DESC(18)).toContain('18 rute');
  });

  it('exports TEXT_WA_REPORT with modal titles and format labels', () => {
    expect(TEXT_WA_REPORT.MODAL_TITLE).toBe('Generator Laporan WhatsApp');
    expect(TEXT_WA_REPORT.FORMAT_1_BTN).toContain('Format 1 (Komprehensif)');
    expect(TEXT_WA_REPORT.FORMAT_2_BTN).toContain('Format 2 (Rincian Shift)');
    expect(TEXT_WA_REPORT.FORMAT_3_BTN).toContain('Format 3 (Status Armada)');
    expect(TEXT_WA_REPORT.FORMAT_3_DESC).toBeDefined();
    expect(TEXT_WA_REPORT.SHIFT_SELECTOR.SHIFT_1).toContain('Shift 1');
    expect(TEXT_WA_REPORT.SHIFT_SELECTOR.SHIFT_2).toContain('Shift 2');
    expect(TEXT_WA_REPORT.BLOCKING_TITLE(1)).toContain('Shift 1');
    expect(TEXT_WA_REPORT.BLOCKING_DESC(2)).toContain('2 rute');
    expect(TEXT_WA_REPORT.UNCONFIRMED_ROUTES_BADGE(3)).toContain('3');
    expect(TEXT_WA_REPORT.TEMPLATE.FORMAT_3_HEADER('Kamis', '10 September 2026', 1, 'Pagi')).toContain('1 (Pagi)');
    expect(TEXT_WA_REPORT.TEMPLATE.FORMAT_3_CLOSING).toContain('diketahui');
    expect(TEXT_WA_REPORT.WARNING_UNSUBMITTED(2, 18)).toContain('2 dari 18 rute');
  });

  it('exports TEXT_ALERTS with confirmation, toast, and bus input messages', () => {
    expect(TEXT_ALERTS.LOGOUT.TITLE).toContain('Logout');
    expect(TEXT_ALERTS.TOAST.SUCCESS_REPORT_SAVED).toContain('berhasil disimpan');
    expect(TEXT_ALERTS.TOAST.SUCCESS_VERIFIED).toContain('berhasil diverifikasi');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.CLEAR_NOTE).toBe('✕ Hapus');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_FULL_FORM).toBe('Semua Kolom');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SWITCH_TO_SINGLE_FOCUS).toBe('Mode Fokus');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL(1000)).toContain('1000');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.REF_KM_AWAL_DYNAMIC(1000, 'Tgl 18')).toBe('Acuan KM (Tgl 18): 1000');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.PREFILL_FROM_YESTERDAY(125430)).toContain('125430');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.PREFILL_DYNAMIC(125430, 'Tgl 18')).toBe('Tgl 18: 125430');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_LOCKED).toContain('Isi KM Awal');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_KM_S2_LOCKED).toContain('Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.GUIDE_FILL_KM_AWAL_FIRST).toContain('KM Awal Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_KM_S2_REQUIRES_S1_CLOSED).toContain('KM Akhir Shift 1 wajib diisi');
    expect(TEXT_ALERTS.BULK_TRIP.VALIDATION_POSITIVE).toBe('Nilai trip harus berupa angka positif!');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.KM_AWAL_LESS_THAN_PREVIOUS_DAY('Shift 1', '292003', '292990', 'Kemarin', 987)).toContain('292003');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_SUGGESTION_TEXT('293003', 13)).toContain('293003');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN('293003')).toContain('293003');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.BYPASS_ODOMETER_RESET_LABEL).toContain('ganti speedometer');
    expect(TEXT_ALERTS.CONFLICT_ONLINE.TITLE).toContain('Berubah');
    expect(TEXT_ALERTS.CONFLICT_ONLINE.UNIT_TEXT('KWK 222171')).toContain('KWK 222171');
  });

  it('exports TEXT_ERRORS with friendly error messages and route validation', () => {
    expect(TEXT_ERRORS.DEFAULT_FALLBACK).toBeDefined();
    expect(TEXT_ERRORS.NETWORK_FAILURE.toLowerCase()).toContain('koneksi internet');
    expect(TEXT_ERRORS.SESSION_EXPIRED).toBeDefined();
    expect(TEXT_ERRORS.SCHEMA_MIGRATION_REQUIRED).toBeDefined();
    expect(TEXT_ERRORS.ROUTE_VALIDATION.CODE_REQUIRED).toContain('Kode Rute');
  });

  it('exports TEXT_FLEET_STATUS with modal and alert bar texts', () => {
    expect(TEXT_FLEET_STATUS.MODAL.TITLE).toBe('Status Armada');
    expect(TEXT_FLEET_STATUS.ALERT_BAR.ACTION_BTN).toBe('Tentukan Status');
    expect(TEXT_FLEET_STATUS.STATUS_CODES.SGO).toBe('SGO');
    expect(TEXT_FLEET_STATUS.MODAL.CONFIRM_APPLY_SHIFT(1)).toContain('Shift 1');
    expect(TEXT_FLEET_STATUS.MODAL.LOCK_BANNER_MESSAGE(1)).toContain('Shift 1');
    expect(TEXT_FLEET_STATUS.MODAL.LOCK_CARD_TOOLTIP).toContain('Pengingat');
    expect(TEXT_FLEET_STATUS.MODAL.MODAL_REMINDER(1)).toContain('Shift 1');
    expect(TEXT_FLEET_STATUS.MODAL.NON_SGO_ALERT_TITLE('01')).toContain('01');
  });

  it('exports TEXT_USER_MANAGEMENT with header, tabs, and alerts', () => {
    expect(TEXT_USER_MANAGEMENT.HEADER.TITLE).toBe('Manajemen Pengguna');
    expect(TEXT_USER_MANAGEMENT.TABS.ALL).toBe('Semua');
    expect(TEXT_USER_MANAGEMENT.TABS.PETUGAS).toBe('Petugas');
    expect(TEXT_USER_MANAGEMENT.MODAL_ADD.TITLE).toBe('Tambah Pengguna Baru');
    expect(TEXT_USER_MANAGEMENT.ALERTS.ACCESS_RESTRICTED).toBe('Akses Terbatas');
  });

  it('exports TEXT_UNIT_DETAIL with metrics and notes texts', () => {
    expect(TEXT_UNIT_DETAIL.TITLE).toBe('Ringkasan Rekapitulasi Armada');
    expect(TEXT_UNIT_DETAIL.SHIFT_1_TITLE).toBe('Shift 1');
    expect(TEXT_UNIT_DETAIL.TOTAL_TITLE).toBe('Akumulasi Total');
    expect(TEXT_UNIT_DETAIL.TARGET_ACHIEVED).toBe('Target Tercapai');
    expect(TEXT_UNIT_DETAIL.NOTES_SECTION_TITLE).toBe('Catatan & Keterangan Operasional');
  });

  it('exports BUS_INPUT_MODAL with all labels, placeholders, tabs, and validators', () => {
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SAVE_BTN).toBe('Simpan');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.CANCEL_BTN).toBe('Batal');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT1).toBe('🔵 Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT2).toBe('🟣 Shift 2');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_TRIP).toBe('🚌 Trip');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.TAB_NOTES).toBe('📝 Catatan');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_SHIFT1).toBe('Data Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_SHIFT2).toBe('Data Shift 2');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_TRIP).toBe('Trip Operasional');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SECTION_NOTES).toBe('Catatan Khusus Unit');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_NOTES).toBe('Catatan / Keterangan');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.POSITIVE_NUMBER).toBe('Nilai harus berupa angka positif!');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1).toBe('TOA Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA).toBe('Total TOA');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AWAL_S1).toBe('KM Awal Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_KM_AKHIR_S1).toBe('KM Akhir Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.KM_AKHIR_LESS_THAN_AWAL('Shift 1', '100', '200')).toContain('tidak boleh lebih kecil');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.KM_DIFF_EXCEEDS_MAX('Shift 1', 250, 230)).toContain('melebihi batas');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.SUBTITLE).toBe('Input Data Operasional Armada');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_HEADER).toBe('Periksa kembali input:');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_HAS_MANUAL_S1).toBe('Ada Tiket Manual Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.DISTANCE_LABEL_S1).toBe('Jarak Tempuh S1:');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL).toBe('Total Ritase:');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NORMAL(120)).toContain('+120 KM');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NEGATIVE(-30)).toContain('lebih kecil');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_EXTREME(500, 400)).toContain('sangat besar');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_RESULT(250, 150, 100)).toContain('100 Penumpang');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_INVALID(120, 150)).toContain('lebih kecil dari Shift 1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.COPY_KM_AKHIR_S1_BTN).toBe('📋 Salin KM Akhir S1');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.HEADER_MODE_SHIFT1).toBe('Input Shift 1 (Closing Siang)');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.HEADER_MODE_SHIFT2).toBe('Input Shift 2 (Closing Malam)');
    expect(TEXT_ALERTS.BUS_INPUT_MODAL.HEADER_MODE_KM_AWAL).toBe('Input KM Awal');
  });

  it('exports BULK_TRIP and FORMAT_SHEET with dynamic template functions', () => {
    expect(TEXT_ALERTS.BULK_TRIP.DESCRIPTION(15)).toContain('15 unit bus');
    expect(TEXT_ALERTS.BULK_TRIP.REQUIRED).toBe('Harap isi nilai Trip Pergi dan Trip Pulang!');
    expect(TEXT_ALERTS.FORMAT_SHEET.HTML_EXPLANATION('12')).toContain('12');
  });

  it('exports UNIT_CARD with operational statuses and metrics', () => {
    expect(TEXT_DASHBOARD.UNIT_CARD.STATUS_FULL_COMPLETE).toBe('S1 & S2 Lengkap');
    expect(TEXT_DASHBOARD.UNIT_CARD.STATUS_SHIFT_1_ONLY).toBe('Negatif Data S2');
    expect(TEXT_DASHBOARD.UNIT_CARD.STATUS_SHIFT_2_ONLY).toBe('Negatif Data S1');
    expect(TEXT_DASHBOARD.UNIT_CARD.STATUS_INCOMPLETE).toBe('Parsial');
    expect(TEXT_DASHBOARD.UNIT_CARD.STATUS_EMPTY).toBe('Negatif Data S1 & S2');
    expect(TEXT_DASHBOARD.UNIT_CARD.ARIA_VIEW_DETAIL('101')).toBe('Lihat detail unit 101');
    expect(TEXT_DASHBOARD.BUS_LIST.ALL_UNITS_FILLED).toContain('selesai diisi');
  });

  it('exports TEXT_FLEET_STATUS with modal titles and shift status codes', () => {
    expect(TEXT_FLEET_STATUS.MODAL.TITLE).toBe('Status Armada');
    expect(TEXT_FLEET_STATUS.MODAL.HEADER_TITLE('JAK.15')).toBe('Status Armada: JAK.15');
    expect(TEXT_FLEET_STATUS.MODAL.TARGET_RENOPS(60)).toBe('Target Renops: 60 Unit');
    expect(TEXT_FLEET_STATUS.MODAL.SHIFT_1_TAB).toContain('Shift 1');
    expect(TEXT_FLEET_STATUS.MODAL.SHIFT_2_TAB).toContain('Shift 2');
    expect(TEXT_FLEET_STATUS.MODAL.SGO_ALL_BTN).toBe('SGO Semua Unit');
    expect(TEXT_FLEET_STATUS.STATUS_CODES.SGO).toBe('SGO');
    expect(TEXT_FLEET_STATUS.STATUS_CODES.OFF).toBe('OFF');
    expect(TEXT_FLEET_STATUS.STATUS_CODES.TO).toBe('T.O');
    expect(TEXT_FLEET_STATUS.STATUS_CODES.SO).toBe('SO');
    expect(TEXT_FLEET_STATUS.LOCK.LOCKED_BADGE('07:30', 'Ahmad')).toContain('Terkonfirmasi');
    expect(TEXT_FLEET_STATUS.LOCK.LOCKED_BANNER(1)).toContain('Shift 1');
    expect(TEXT_FLEET_STATUS.LOCK.LOCKED_TOOLTIP).toBeDefined();
    expect(TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT.LABEL).toBe('Target Renops:');
  });
});

