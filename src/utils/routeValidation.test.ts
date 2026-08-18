import { describe, it, expect } from 'vitest';
import {
  formatRouteCode,
  validateRouteCode,
  validateGoogleSheetsUrl,
  extractRouteNameFromHeaders,
} from './routeValidation';

describe('routeValidation', () => {
  describe('formatRouteCode', () => {
    it('automatically prefixes JAK. if user types raw numbers or code', () => {
      expect(formatRouteCode('115')).toBe('JAK.115');
      expect(formatRouteCode('78a')).toBe('JAK.78A');
    });

    it('sanitizes input with spaces, lowercase, and duplicate dots', () => {
      expect(formatRouteCode('jak. 76 ')).toBe('JAK.76');
      expect(formatRouteCode('JAK..15')).toBe('JAK.15');
      expect(formatRouteCode('jak-115')).toBe('JAK.115');
      expect(formatRouteCode('JAK.29-B')).toBe('JAK.29B');
    });

    it('strips all non-alphanumeric characters after JAK.', () => {
      expect(formatRouteCode('JAK.115#@!')).toBe('JAK.115');
    });
  });

  describe('validateRouteCode', () => {
    it('validates correct route codes', () => {
      expect(validateRouteCode('JAK.115').isValid).toBe(true);
      expect(validateRouteCode('JAK.05').isValid).toBe(true);
      expect(validateRouteCode('JAK.78A').isValid).toBe(true);
    });

    it('rejects invalid or empty route codes', () => {
      expect(validateRouteCode('').isValid).toBe(false);
      expect(validateRouteCode('JAK.').isValid).toBe(false);
      expect(validateRouteCode('115').isValid).toBe(false);
      expect(validateRouteCode('BUS.115').isValid).toBe(false);
    });
  });

  describe('validateGoogleSheetsUrl', () => {
    it('validates full Google Sheets URLs and extracts clean ID', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
      const result = validateGoogleSheetsUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.spreadsheetId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    });

    it('validates raw spreadsheet ID directly', () => {
      const id = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
      const result = validateGoogleSheetsUrl(id);
      expect(result.isValid).toBe(true);
      expect(result.spreadsheetId).toBe(id);
    });

    it('rejects invalid URLs or invalid spreadsheet IDs', () => {
      expect(validateGoogleSheetsUrl('').isValid).toBe(false);
      expect(validateGoogleSheetsUrl('https://google.com').isValid).toBe(false);
      expect(validateGoogleSheetsUrl('invalid-id').isValid).toBe(false);
    });
  });

  describe('extractRouteNameFromHeaders', () => {
    it('extracts route destination from trip pergi label', () => {
      const name = extractRouteNameFromHeaders('TERM. TJ PRIOK - PEGANGSAAN II IGI', 'PEGANGSAAN II IGI - TERM. TJ PRIOK');
      expect(name).toBe('TERM. TJ PRIOK - PEGANGSAAN II IGI');
    });

    it('returns null if trip label is generic or missing', () => {
      expect(extractRouteNameFromHeaders('Trip Pergi', 'Trip Pulang')).toBeNull();
      expect(extractRouteNameFromHeaders(undefined, undefined)).toBeNull();
    });
  });
});
