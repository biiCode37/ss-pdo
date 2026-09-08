import { describe, it, expect } from 'vitest';
import {
  TEXT_COMMON,
  TEXT_AUTH,
  TEXT_DASHBOARD,
  TEXT_PDO_FORM,
  TEXT_MONITORING,
  TEXT_WA_REPORT,
  TEXT_ALERTS,
  TEXT_ERRORS
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
  });

  it('exports TEXT_DASHBOARD with app header, tabs, and selectors', () => {
    expect(TEXT_DASHBOARD.APP_TITLE).toBe('PUSM');
    expect(TEXT_DASHBOARD.APP_SUBTITLE).toBe('PDO Utara Spreadsheet Mobile');
    expect(TEXT_DASHBOARD.TABS.INPUT_SS).toBe('Input SS');
    expect(TEXT_DASHBOARD.TABS.DASHBOARD).toBe('Dashboard');
    expect(TEXT_DASHBOARD.TABS.UNIT_LIST).toBe('Daftar Unit');
    expect(TEXT_DASHBOARD.TABS.ACCUMULATION).toBe('Akumulasi');
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
  });

  it('exports TEXT_WA_REPORT with modal titles and format labels', () => {
    expect(TEXT_WA_REPORT.MODAL_TITLE).toBe('Generator Laporan WhatsApp');
    expect(TEXT_WA_REPORT.FORMAT_1_BTN).toContain('Format 1 (Komprehensif)');
    expect(TEXT_WA_REPORT.FORMAT_2_BTN).toContain('Format 2 (Rincian Shift)');
    expect(TEXT_WA_REPORT.WARNING_UNSUBMITTED(2, 18)).toContain('2 dari 18 rute');
  });

  it('exports TEXT_ALERTS with confirmation and toast messages', () => {
    expect(TEXT_ALERTS.LOGOUT.TITLE).toContain('Logout');
    expect(TEXT_ALERTS.TOAST.SUCCESS_REPORT_SAVED).toContain('berhasil disimpan');
    expect(TEXT_ALERTS.TOAST.SUCCESS_VERIFIED).toContain('berhasil diverifikasi');
  });

  it('exports TEXT_ERRORS with friendly error messages', () => {
    expect(TEXT_ERRORS.DEFAULT_FALLBACK).toBeDefined();
    expect(TEXT_ERRORS.NETWORK_FAILURE.toLowerCase()).toContain('koneksi internet');
    expect(TEXT_ERRORS.SESSION_EXPIRED).toBeDefined();
  });
});
