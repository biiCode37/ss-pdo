import { describe, it, expect } from 'vitest';
import {
  calculateSmartTripSplit,
  validateSmartTripPhysicalInvariants,
} from './smartRitaseUtils';

describe('smartRitaseUtils', () => {
  describe('calculateSmartTripSplit', () => {
    it('memecah ritase bulat menjadi trip pergi dan pulang yang sama persis', () => {
      // 7.0 rit untuk Unit A (Priok) -> 7 Pergi, 7 Pulang
      const splitA = calculateSmartTripSplit(7.0, 'A');
      expect(splitA.tripPergi).toBe(7);
      expect(splitA.tripPulang).toBe(7);

      // 8.0 rit untuk Unit B (IGI) -> 8 Pergi, 8 Pulang
      const splitB = calculateSmartTripSplit(8.0, 'B');
      expect(splitB.tripPergi).toBe(8);
      expect(splitB.tripPulang).toBe(8);
    });

    it('memecah ritase setengah (0.5) sesuai pangkalan start', () => {
      // 7.5 rit untuk Unit Priok (Start A) -> 8 Pergi, 7 Pulang
      const splitPriok = calculateSmartTripSplit(7.5, 'A');
      expect(splitPriok.tripPergi).toBe(8);
      expect(splitPriok.tripPulang).toBe(7);

      // 7.5 rit untuk Unit IGI (Start B) -> 7 Pergi, 8 Pulang
      const splitIgi = calculateSmartTripSplit(7.5, 'B');
      expect(splitIgi.tripPergi).toBe(7);
      expect(splitIgi.tripPulang).toBe(8);
    });
  });

  describe('validateSmartTripPhysicalInvariants', () => {
    it('memberikan warning jika selisih trip lebih dari 1 trip (anomali fisik)', () => {
      const result = validateSmartTripPhysicalInvariants({
        tripPergi: 8,
        tripPulang: 6, // selisih 2
        startPoint: 'A',
      });
      expect(result.isValid).toBe(false);
      expect(result.warning).toContain('tidak boleh lebih dari 1 trip');
    });

    it('memberikan warning jika Unit Start A memiliki trip pulang lebih banyak dari trip pergi', () => {
      const result = validateSmartTripPhysicalInvariants({
        tripPergi: 7,
        tripPulang: 8,
        startPoint: 'A',
        endpointAName: 'Priok',
      });
      expect(result.isValid).toBe(false);
      expect(result.warning).toContain('Priok');
      expect(result.warning).toContain('tidak boleh melebihi');
    });

    it('memberikan warning jika Unit Start B memiliki trip pergi lebih banyak dari trip pulang', () => {
      const result = validateSmartTripPhysicalInvariants({
        tripPergi: 8,
        tripPulang: 7,
        startPoint: 'B',
        endpointBName: 'IGI',
      });
      expect(result.isValid).toBe(false);
      expect(result.warning).toContain('IGI');
      expect(result.warning).toContain('tidak boleh melebihi');
    });

    it('menghitung titik akhir operasional secara tepat', () => {
      // 7.0 rit untuk Start Priok -> Finish Priok (kembali ke pangkalan awal)
      const resBulat = validateSmartTripPhysicalInvariants({
        tripPergi: 7,
        tripPulang: 7,
        startPoint: 'A',
        endpointAName: 'Priok',
        endpointBName: 'IGI',
      });
      expect(resBulat.isValid).toBe(true);
      expect(resBulat.finalEndpoint).toBe('Priok');
      expect(resBulat.isBackToBase).toBe(true);

      // 7.5 rit untuk Start Priok (8 Pergi, 7 Pulang) -> Finish IGI (mengendap di seberang)
      const resSetengah = validateSmartTripPhysicalInvariants({
        tripPergi: 8,
        tripPulang: 7,
        startPoint: 'A',
        endpointAName: 'Priok',
        endpointBName: 'IGI',
      });
      expect(resSetengah.isValid).toBe(true);
      expect(resSetengah.finalEndpoint).toBe('IGI');
      expect(resSetengah.isBackToBase).toBe(false);
    });
  });
});
