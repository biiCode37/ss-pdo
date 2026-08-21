import { describe, it, expect } from 'vitest';
import { parseIndonesianNumber, safeFormatNumber, normalizeFieldValue } from './numberUtils';

describe('numberUtils', () => {
  describe('parseIndonesianNumber', () => {
    it('parses integers correctly', () => {
      expect(parseIndonesianNumber('1234')).toBe(1234);
      expect(parseIndonesianNumber(1234)).toBe(1234);
    });

    it('parses Indonesian thousand separators with dots', () => {
      expect(parseIndonesianNumber('1.234')).toBe(1234);
      expect(parseIndonesianNumber('12.345.678')).toBe(12345678);
    });

    it('parses Indonesian comma decimals correctly', () => {
      expect(parseIndonesianNumber('123,45')).toBe(123.45);
      expect(parseIndonesianNumber('1.234,56')).toBe(1234.56);
    });

    it('maintains high decimal precision according to SSOT Golden Rule', () => {
      expect(parseIndonesianNumber('123,1234567891')).toBeCloseTo(123.1234567891, 10);
      expect(parseIndonesianNumber('0,0000000001')).toBeCloseTo(0.0000000001, 10);
    });

    it('handles empty, null, dash, and invalid values gracefully', () => {
      expect(parseIndonesianNumber('')).toBe(0);
      expect(parseIndonesianNumber(null)).toBe(0);
      expect(parseIndonesianNumber(undefined)).toBe(0);
      expect(parseIndonesianNumber('-')).toBe(0);
      expect(parseIndonesianNumber('#REF!')).toBe(0);
      expect(parseIndonesianNumber('#VALUE!')).toBe(0);
      expect(parseIndonesianNumber('invalid', -1)).toBe(-1);
    });

    it('handles negative Indonesian formatted numbers', () => {
      expect(parseIndonesianNumber('-1.234,5')).toBe(-1234.5);
    });
  });

  describe('normalizeFieldValue', () => {
    it('normalizes empty and dash values to empty string', () => {
      expect(normalizeFieldValue('')).toBe('');
      expect(normalizeFieldValue(null)).toBe('');
      expect(normalizeFieldValue(undefined)).toBe('');
      expect(normalizeFieldValue('-')).toBe('');
      expect(normalizeFieldValue('   ')).toBe('');
    });

    it('normalizes numeric values consistently', () => {
      expect(normalizeFieldValue('100')).toBe('100');
      expect(normalizeFieldValue('100,0')).toBe('100');
      expect(normalizeFieldValue('1.234')).toBe('1234');
      expect(normalizeFieldValue(1234)).toBe('1234');
      expect(normalizeFieldValue('123,45')).toBe('123.45');
    });

    it('preserves text strings unchanged (trimmed)', () => {
      expect(normalizeFieldValue('Unit Rusak')).toBe('Unit Rusak');
      expect(normalizeFieldValue('  Catatan Unit  ')).toBe('Catatan Unit');
    });
  });

  describe('safeFormatNumber', () => {
    it('formats number to Indonesian locale', () => {
      expect(safeFormatNumber(1234567)).toBe('1.234.567');
      expect(safeFormatNumber('1234567')).toBe('1.234.567');
    });

    it('formats 0 and empty gracefully', () => {
      expect(safeFormatNumber(0)).toBe('0');
      expect(safeFormatNumber('')).toBe('0');
      expect(safeFormatNumber(null)).toBe('0');
    });
  });
});
