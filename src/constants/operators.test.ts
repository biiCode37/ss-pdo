import { describe, it, expect } from 'vitest';
import {
  MASTER_OPERATORS,
  findOperator,
  getOperatorOfficialName,
  getAllActiveOperators,
  isValidOperatorCode
} from './operators';

describe('Master Operators Constant', () => {
  it('contains all 8 official operators and variants', () => {
    expect(MASTER_OPERATORS.length).toBe(8);
    const codes = MASTER_OPERATORS.map((op) => op.code);
    expect(codes).toContain('KLM');
    expect(codes).toContain('KWK');
    expect(codes).toContain('KWK AC');
    expect(codes).toContain('KMJ');
    expect(codes).toContain('LSG');
    expect(codes).toContain('KJG');
    expect(codes).toContain('KMJ/KLM');
    expect(codes).toContain('KMJ & KJG');
  });

  describe('findOperator & getOperatorOfficialName', () => {
    it('resolves KLM correctly', () => {
      const op = findOperator('KLM');
      expect(op?.code).toBe('KLM');
      expect(op?.shortName).toBe('KOLAMAS JAYA');
      expect(getOperatorOfficialName('KLM')).toBe('KOLAMAS JAYA (KLM)');
      expect(getOperatorOfficialName('KOLAMAS')).toBe('KOLAMAS JAYA (KLM)');
      expect(getOperatorOfficialName('kolamas jaya')).toBe('KOLAMAS JAYA (KLM)');
    });

    it('resolves KWK and KWK AC with distinct differentiation', () => {
      expect(getOperatorOfficialName('KWK')).toBe('KOPERASI WAHANA KALPIKA (KWK)');
      expect(getOperatorOfficialName('KWK AC')).toBe('KOPERASI WAHANA KALPIKA (KWK) AC');
      expect(getOperatorOfficialName('kwk ac')).toBe('KOPERASI WAHANA KALPIKA (KWK) AC');
    });

    it('resolves KMJ (KOMILET JAYA)', () => {
      expect(getOperatorOfficialName('KMJ')).toBe('KOMILET JAYA (KMJ)');
      expect(getOperatorOfficialName('KOMILET JAYA')).toBe('KOMILET JAYA (KMJ)');
      expect(getOperatorOfficialName('KOMIDA')).toBe('KOMILET JAYA (KMJ)');
    });

    it('resolves LSG (LESTARI SURYA GEMA PERSADA)', () => {
      expect(getOperatorOfficialName('LSG')).toBe('LESTARI SURYA GEMA PERSADA (LSG)');
      expect(getOperatorOfficialName('LESTARI SURYA')).toBe('LESTARI SURYA GEMA PERSADA (LSG)');
    });

    it('resolves KJG (KOJANG)', () => {
      expect(getOperatorOfficialName('KJG')).toBe('KOJANG (KJG)');
      expect(getOperatorOfficialName('KOJANG')).toBe('KOJANG (KJG)');
    });

    it('resolves KSO KMJ/KLM correctly without conflicting with single KLM/KMJ', () => {
      expect(getOperatorOfficialName('KMJ/KLM')).toBe('KOMILET JAYA / KOLAMAS JAYA (KMJ/KLM)');
      expect(getOperatorOfficialName('KMJ / KLM')).toBe('KOMILET JAYA / KOLAMAS JAYA (KMJ/KLM)');
    });

    it('resolves KSO KMJ & KJG correctly for JAK.76', () => {
      expect(getOperatorOfficialName('KMJ & KJG')).toBe('KOMILET JAYA & KOJANG (KMJ & KJG)');
      expect(getOperatorOfficialName('KMJ/KJG')).toBe('KOMILET JAYA & KOJANG (KMJ & KJG)');
    });

    it('returns original string as graceful fallback when not found', () => {
      expect(getOperatorOfficialName('OPERATOR_ASING')).toBe('OPERATOR_ASING');
      expect(getOperatorOfficialName('')).toBe('');
      expect(getOperatorOfficialName(null)).toBe('');
      expect(getOperatorOfficialName(undefined)).toBe('');
    });
  });

  describe('getAllActiveOperators', () => {
    it('returns only active operators', () => {
      const active = getAllActiveOperators();
      expect(active.length).toBe(8);
      expect(active.every((op) => op.isActive)).toBe(true);
    });
  });

  describe('isValidOperatorCode', () => {
    it('validates recognized operator codes correctly', () => {
      expect(isValidOperatorCode('KLM')).toBe(true);
      expect(isValidOperatorCode('kwk')).toBe(true);
      expect(isValidOperatorCode('KWK AC')).toBe(true);
      expect(isValidOperatorCode('KMJ')).toBe(true);
      expect(isValidOperatorCode('LSG')).toBe(true);
      expect(isValidOperatorCode('KJG')).toBe(true);
      expect(isValidOperatorCode('KMJ/KLM')).toBe(true);
      expect(isValidOperatorCode('KMJ & KJG')).toBe(true);
      expect(isValidOperatorCode('XYZ')).toBe(false);
      expect(isValidOperatorCode('')).toBe(false);
    });
  });
});
