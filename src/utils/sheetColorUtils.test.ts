import { describe, it, expect } from 'vitest';
import { getKeteranganColor, getRowEndCol } from './sheetColorUtils';

describe('sheetColorUtils', () => {
  describe('getKeteranganColor priority order & accuracy', () => {
    it('returns skyblue for BA.01 through BA.04', () => {
      expect(getKeteranganColor('BA.01')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      expect(getKeteranganColor('BA.02 Mogok')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      expect(getKeteranganColor('BA.03')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      expect(getKeteranganColor('BA.04 Ban Bocor')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
    });

    it('returns skyblue for NP1 and NP2', () => {
      expect(getKeteranganColor('NP1')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      expect(getKeteranganColor('NP2')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      expect(getKeteranganColor('NP-1')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
    });

    it('returns red for TO EVDAL', () => {
      expect(getKeteranganColor('TO EVDAL')).toEqual({ red: 0.95, green: 0.35, blue: 0.35 });
      expect(getKeteranganColor('TO-EVDAL')).toEqual({ red: 0.95, green: 0.35, blue: 0.35 });
    });

    it('returns yellow for standalone OFF', () => {
      expect(getKeteranganColor('OFF')).toEqual({ red: 1.0, green: 0.95, blue: 0.3 });
      expect(getKeteranganColor('off (perpal)')).toEqual({ red: 1.0, green: 0.95, blue: 0.3 });
    });

    it('does NOT false-positive match compound words containing OFF like OFFICE or OFFLOAD as yellow', () => {
      // "OFFICE" or "OFFLOAD" should NOT be yellow; it should be green (free notes) or skyblue if prefixed with BA
      expect(getKeteranganColor('OFFICE')).toEqual({ red: 0.56, green: 0.93, blue: 0.56 });
      expect(getKeteranganColor('BA.01 OFFICE DUTY')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
    });

    it('returns light green for generic custom notes', () => {
      expect(getKeteranganColor('Perbaikan AC')).toEqual({ red: 0.56, green: 0.93, blue: 0.56 });
      expect(getKeteranganColor('Cuci armada')).toEqual({ red: 0.56, green: 0.93, blue: 0.56 });
    });

    it('returns null for empty or whitespace-only keterangan', () => {
      expect(getKeteranganColor('')).toBeNull();
      expect(getKeteranganColor('   ')).toBeNull();
      expect(getKeteranganColor(undefined)).toBeNull();
    });

    it('assigns color correctly for composite notes separated by pipe', () => {
      // Prioritizes BA (skyblue) over other statuses if present
      expect(getKeteranganColor('BA.01 Radiator | TO EVDAL')).toEqual({ red: 0.53, green: 0.81, blue: 0.98 });
      // If no BA, matches TO EVDAL (red)
      expect(getKeteranganColor('OFF | TO EVDAL')).toEqual({ red: 0.95, green: 0.35, blue: 0.35 });
    });
  });

  describe('getRowEndCol', () => {
    it('determines correct end column from headerMap', () => {
      expect(getRowEndCol({ totalKmShift2: 15 })).toBe(16);
      expect(getRowEndCol({ totalKmShift1: 10 })).toBe(12);
      expect(getRowEndCol({ kmAkhir2: 8 })).toBe(11);
      expect(getRowEndCol({})).toBe(23);
    });
  });
});
