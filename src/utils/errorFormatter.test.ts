import { describe, it, expect } from 'vitest';
import { formatUserError } from './errorFormatter';

describe('formatUserError', () => {
  it('returns null for null input or user cancelled popups', () => {
    expect(formatUserError(null)).toBeNull();
    expect(formatUserError({ type: 'popup_closed_by_user' })).toBeNull();
    expect(formatUserError(new Error('Login dibatalkan'))).toBeNull();
  });

  it('sanitizes technical credentials and .env error messages', () => {
    const envErr = new Error('API Credentials missing in .env file');
    const envResult = formatUserError(envErr);
    expect(envResult).not.toBeNull();
    expect(envResult).not.toContain('.env');
    expect(envResult).toContain('Layanan belum siap dikonfigurasi');
  });

  it('sanitizes network errors', () => {
    const netErr = new TypeError('Failed to fetch');
    const netResult = formatUserError(netErr);
    expect(netResult).not.toBeNull();
    expect(netResult).toContain('Koneksi internet Anda terputus');
  });

  it('sanitizes Google Sheets column header mismatch errors', () => {
    const headerErr = new Error('Tidak bisa menemukan kolom "No Body / Unit".');
    const headerResult = formatUserError(headerErr);
    expect(headerResult).not.toBeNull();
    expect(headerResult).not.toContain('No Body');
    expect(headerResult).toContain('Format kolom pada tabel Google Sheets tidak sesuai');
  });

  it('sanitizes 403 and insufficient scopes auth errors', () => {
    const scopeErr = new Error('Request had insufficient authentication scopes.');
    const scopeResult = formatUserError(scopeErr);
    expect(scopeResult).not.toBeNull();
    expect(scopeResult).toContain('Sesi anda telah berakhir');
  });

  it('uses custom fallback message for unknown errors', () => {
    const unknownErr = new Error('Random unexpected error');
    const fallbackResult = formatUserError(unknownErr, 'Pesan fallback khusus');
    expect(fallbackResult).toBe('Pesan fallback khusus');
  });

  it('sanitizes database schema cache and postgrest errors', () => {
    const dbErr = new Error("Could not find the 'fleet_confirmed_s2_at' column of 'daily_route_reports' in the schema cache");
    const resultWithoutFallback = formatUserError(dbErr);
    expect(resultWithoutFallback).not.toContain('fleet_confirmed_s2_at');
    expect(resultWithoutFallback).not.toContain('schema cache');
    expect(resultWithoutFallback).toContain('laporan operasional');

    const resultWithFallback = formatUserError(dbErr, 'Gagal menerapkan status armada');
    expect(resultWithFallback).toBe('Gagal menerapkan status armada');
  });
});
