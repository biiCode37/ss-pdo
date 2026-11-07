import { describe, it, expect } from 'vitest';
import {
  sanitizeReason,
  shiftDateString,
  validateConfirmationDate,
  wibTodayString,
} from '../../../supabase/functions/_shared/submissionRules.ts';

describe('submissionRules', () => {
  it('wibTodayString memakai zona Asia/Jakarta', () => {
    expect(wibTodayString(new Date('2026-11-07T18:30:00Z'))).toBe('2026-11-08');
    expect(wibTodayString(new Date('2026-11-07T16:59:00Z'))).toBe('2026-11-07');
  });
  it('shiftDateString melintasi bulan', () => {
    expect(shiftDateString('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDateString('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('validateConfirmationDate membatasi masa depan dan maks. 7 hari ke belakang', () => {
    expect(validateConfirmationDate('2026-11-07', '2026-11-07')).toBe('ok');
    expect(validateConfirmationDate('2026-10-31', '2026-11-07')).toBe('ok');
    expect(validateConfirmationDate('2026-10-30', '2026-11-07')).toBe('too_old');
    expect(validateConfirmationDate('2026-11-08', '2026-11-07')).toBe('future');
    expect(validateConfirmationDate('07-11-2026', '2026-11-07')).toBe('invalid');
  });
  it('sanitizeReason membuang karakter kontrol, merapikan spasi, dan memotong 300 karakter', () => {
    expect(sanitizeReason('  TOA\u0000 rusak \n\n  dilaporkan ')).toBe('TOA rusak dilaporkan');
    expect(sanitizeReason(undefined)).toBe('');
    expect(sanitizeReason('x'.repeat(400))).toHaveLength(300);
  });
});
