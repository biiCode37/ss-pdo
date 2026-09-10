import { describe, it, expect } from 'vitest';
import {
  MASTER_OPERATORS,
  findOperator,
  formatOperatorFull,
  formatOperatorsDisplay,
  getOperatorOfficialName,
  getAllActiveOperators,
  isValidOperatorCode
} from './operators';

describe('Master Operators Constant (Atomic Normalization)', () => {
  it('contains 6 atomic official operators without multi-entity rows', () => {
    expect(MASTER_OPERATORS.length).toBe(6);
    const codes = MASTER_OPERATORS.map((op) => op.code);
    expect(codes).toContain('KLM');
    expect(codes).toContain('KWK');
    expect(codes).toContain('KWK AC');
    expect(codes).toContain('KMJ');
    expect(codes).toContain('LSG');
    expect(codes).toContain('KJG');
    // Ensure no combined fake rows
    expect(codes).not.toContain('KMJ/KLM');
    expect(codes).not.toContain('KMJ & KJG');
  });

  describe('formatOperatorFull & formatOperatorsDisplay', () => {
    it('formats single operator into "{name} ({code})"', () => {
      expect(formatOperatorFull({ operator_code: 'KLM', operator_name: 'KOLAMAS JAYA' })).toBe('KOLAMAS JAYA (KLM)');
      expect(formatOperatorFull({ operator_code: 'KWK AC', operator_name: 'KOPERASI WAHANA KALPIKA' })).toBe('KOPERASI WAHANA KALPIKA (KWK) AC');
    });

    it('formats multiple operators into "{op1} & {op2}" for KSO routes', () => {
      const ops = [
        { operator_code: 'KMJ', operator_name: 'KOMILET JAYA' },
        { operator_code: 'KJG', operator_name: 'KOJANG' }
      ];
      expect(formatOperatorsDisplay(ops)).toBe('KOMILET JAYA (KMJ) & KOJANG (KJG)');
      expect(formatOperatorsDisplay([])).toBe('');
      expect(formatOperatorsDisplay(null)).toBe('');
    });
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

    it('dynamically resolves KSO KMJ/KLM and KMJ & KJG without combined database rows', () => {
      expect(getOperatorOfficialName('KMJ/KLM')).toBe('KOMILET JAYA (KMJ) / KOLAMAS JAYA (KLM)');
      expect(getOperatorOfficialName('KMJ & KJG')).toBe('KOMILET JAYA (KMJ) & KOJANG (KJG)');
    });

    it('returns original string as graceful fallback when not found', () => {
      expect(getOperatorOfficialName('OPERATOR_ASING')).toBe('OPERATOR_ASING');
      expect(getOperatorOfficialName('')).toBe('');
      expect(getOperatorOfficialName(null)).toBe('');
      expect(getOperatorOfficialName(undefined)).toBe('');
    });
  });

  describe('getAllActiveOperators', () => {
    it('returns 6 active atomic operators', () => {
      const active = getAllActiveOperators();
      expect(active.length).toBe(6);
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
      expect(isValidOperatorCode('XYZ')).toBe(false);
      expect(isValidOperatorCode('')).toBe(false);
    });
  });
});
