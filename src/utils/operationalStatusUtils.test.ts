import { describe, it, expect } from 'vitest';
import {
  isBusNonOperational,
  getNonOperationalBannerType,
  shouldClearKeteranganOnActivation,
} from './operationalStatusUtils';

describe('operationalStatusUtils', () => {
  describe('isBusNonOperational', () => {
    it('menganggap beroperasi jika ritase > 0 meskipun ada keterangan TO', () => {
      expect(isBusNonOperational({ tripPergi: '7', tripPulang: '7', keterangan: 'T.O' })).toBe(false);
      expect(isBusNonOperational({ tripPergi: '4', tripPulang: '4', keterangan: 'TO EVDAL' })).toBe(false);
    });

    it('menganggap beroperasi jika terdapat trip parsial (ritase > 0)', () => {
      expect(isBusNonOperational({ tripPergi: '1', tripPulang: '0', keterangan: '' })).toBe(false);
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '1', keterangan: '' })).toBe(false);
      expect(isBusNonOperational({ tripPergi: '1,5', tripPulang: '1,5', keterangan: '' })).toBe(false);
    });

    it('menganggap tidak beroperasi jika ritase 0 atau kosong', () => {
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '0', keterangan: '' })).toBe(true);
      expect(isBusNonOperational({ tripPergi: '', tripPulang: '', keterangan: 'OFF' })).toBe(true);
      expect(isBusNonOperational({ tripPergi: '-', tripPulang: '-', keterangan: '' })).toBe(true);
    });

    it('mengecualikan status TO dari non-operasional jika hanya evaluasi keterangan tanpa ritase (ritase 0 tetap non-operasional)', () => {
      // Jika ritase 0 dan keterangan TO: tetap dianggap non-operasional karena ritasenya 0
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '0', keterangan: 'TO EVDAL' })).toBe(true);
      expect(isBusNonOperational({ tripPergi: '', tripPulang: '', keterangan: 'TO' })).toBe(true);
      expect(isBusNonOperational({ tripPergi: '0', tripPulang: '0', keterangan: 'T.O' })).toBe(true);
    });

    it('sinkron dengan plotting status jika target_ritase 0 atau status OFF', () => {
      expect(
        isBusNonOperational(
          { tripPergi: '', tripPulang: '', keterangan: '' },
          { target_ritase: 0, status: 'OFF' }
        )
      ).toBe(true);
      expect(
        isBusNonOperational(
          { tripPergi: '0', tripPulang: '0', keterangan: '' },
          { target_ritase: 0, status: 'READY' }
        )
      ).toBe(true);
      expect(
        isBusNonOperational(
          { tripPergi: '', tripPulang: '', keterangan: '' },
          { target_ritase: 7.5, status: 'OFF' }
        )
      ).toBe(true);
    });

    it('menganggap beroperasi jika plotting memiliki target_ritase > 0 dan belum input trip', () => {
      expect(
        isBusNonOperational(
          { tripPergi: '', tripPulang: '', keterangan: '' },
          { target_ritase: 7.5, status: 'READY' }
        )
      ).toBe(false);
    });

    it('mengutamakan ritase riil > 0 meskipun status plotting bernilai OFF', () => {
      expect(
        isBusNonOperational(
          { tripPergi: '5', tripPulang: '5', keterangan: '' },
          { target_ritase: 0, status: 'OFF' }
        )
      ).toBe(false);
    });
  });

  describe('getNonOperationalBannerType', () => {
    it('mengembalikan NONE untuk unit beroperasi', () => {
      expect(getNonOperationalBannerType({ tripPergi: '5', tripPulang: '5' })).toBe('NONE');
      expect(
        getNonOperationalBannerType(
          { tripPergi: '', tripPulang: '' },
          { target_ritase: 7.5, status: 'READY' }
        )
      ).toBe('NONE');
    });

    it('mengembalikan EMPTY_RITASE jika ritase 0 dan keterangan kosong atau bukan OFF/LIBUR', () => {
      expect(getNonOperationalBannerType({ tripPergi: '', tripPulang: '', keterangan: '' })).toBe('EMPTY_RITASE');
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'BOCOR RADIATOR' })).toBe('EMPTY_RITASE');
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'BA.02' })).toBe('EMPTY_RITASE');
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'TO EVDAL' })).toBe('EMPTY_RITASE');
    });

    it('mengembalikan OFF_LIBUR jika ritase 0 dan keterangan murni OFF atau LIBUR', () => {
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'OFF' })).toBe('OFF_LIBUR');
      expect(getNonOperationalBannerType({ tripPergi: '', tripPulang: '', keterangan: 'LIBUR' })).toBe('OFF_LIBUR');
      expect(getNonOperationalBannerType({ tripPergi: '', tripPulang: '', keterangan: '  off  ' })).toBe('OFF_LIBUR');
      expect(getNonOperationalBannerType({ tripPergi: '0', tripPulang: '0', keterangan: 'libur' })).toBe('OFF_LIBUR');
    });
  });

  describe('shouldClearKeteranganOnActivation', () => {
    it('mengembalikan true hanya jika keterangan murni OFF atau LIBUR', () => {
      expect(shouldClearKeteranganOnActivation('OFF')).toBe(true);
      expect(shouldClearKeteranganOnActivation('off')).toBe(true);
      expect(shouldClearKeteranganOnActivation('LIBUR')).toBe(true);
      expect(shouldClearKeteranganOnActivation(' Libur ')).toBe(true);
      expect(shouldClearKeteranganOnActivation('  OFF  ')).toBe(true);
    });

    it('mengembalikan false jika memuat catatan lain atau kosong', () => {
      expect(shouldClearKeteranganOnActivation('OFF - BENGKEL')).toBe(false);
      expect(shouldClearKeteranganOnActivation('LIBUR NATAL')).toBe(false);
      expect(shouldClearKeteranganOnActivation('BA.02')).toBe(false);
      expect(shouldClearKeteranganOnActivation('T.O')).toBe(false);
      expect(shouldClearKeteranganOnActivation('TO EVDAL')).toBe(false);
      expect(shouldClearKeteranganOnActivation('')).toBe(false);
      expect(shouldClearKeteranganOnActivation('   ')).toBe(false);
      expect(shouldClearKeteranganOnActivation(null)).toBe(false);
      expect(shouldClearKeteranganOnActivation(undefined)).toBe(false);
    });
  });
});
