import { describe, it, expect } from 'vitest';
import {
  classifyUnitRow,
  computeRouteCompleteness,
  countCompletenessIssues,
  isBlankCell,
  isExemptingKeterangan,
} from '../../../supabase/functions/_shared/completeness.ts';
import { classifyUnitKeterangan, normalizeKeterangan } from '@/utils/keteranganUtils';

const HEADER = ['NO', 'NO BODY', 'TRIP PERGI', 'TRIP PULANG', 'TOA SHIFT 1', 'MANUAL SHIFT 1',
  'TOA SHIFT 2', 'MANUAL SHIFT 2', 'TOTAL TOA', 'KM AWAL SHIFT 1', 'KETERANGAN'];
// kolom: 0 NO,1 UNIT,2 TP,3 TPL,4 TOA1,5 MAN1,6 TOA2,7 MAN2,8 TOTAL,9 KM,10 KET
const row = (unit: string, tp: unknown, tpl: unknown, toa1: unknown, total: unknown, ket = '', km: unknown = '') =>
  ['1', unit, tp, tpl, toa1, '', '', '', total, km, ket];

describe('isBlankCell', () => {
  it('menganggap kosong, spasi, dan "-" sebagai belum diisi; 0 sebagai terisi', () => {
    expect(isBlankCell(undefined)).toBe(true);
    expect(isBlankCell(null)).toBe(true);
    expect(isBlankCell('')).toBe(true);
    expect(isBlankCell('  ')).toBe(true);
    expect(isBlankCell('-')).toBe(true);
    expect(isBlankCell(0)).toBe(false);
    expect(isBlankCell('0')).toBe(false);
  });
});

describe('classifyUnitRow', () => {
  const base = { tripPergi: 5, tripPulang: 5, toaShift1: 100, totalToa: 180, keterangan: '' };
  it('LENGKAP bila keempat kolom wajib terisi, termasuk angka 0', () => {
    expect(classifyUnitRow(base).status).toBe('LENGKAP');
    expect(classifyUnitRow({ tripPergi: 0, tripPulang: 0, toaShift1: 0, totalToa: 0, keterangan: '' }).status).toBe('LENGKAP');
  });
  it('BELUM_DIISI bila semua kosong dan keterangan NORMAL', () => {
    const empty = { tripPergi: '', tripPulang: '', toaShift1: '', totalToa: '' };
    expect(classifyUnitRow({ ...empty, keterangan: '' }).status).toBe('BELUM_DIISI');
    expect(classifyUnitRow({ ...empty, keterangan: 'SO' }).status).toBe('BELUM_DIISI');
    expect(classifyUnitRow({ ...empty, keterangan: '-' }).status).toBe('BELUM_DIISI');
  });
  it('DIKECUALIKAN bila semua kosong dan keterangan bukan NORMAL', () => {
    const empty = { tripPergi: '', tripPulang: '', toaShift1: '', totalToa: '' };
    expect(classifyUnitRow({ ...empty, keterangan: 'OFF' }).status).toBe('DIKECUALIKAN');
    expect(classifyUnitRow({ ...empty, keterangan: 'S1: MOGOK | S2: OFF' }).status).toBe('DIKECUALIKAN');
  });
  it('JANGGAL: ritase terisi tapi TOA S1 dan Total TOA kosong', () => {
    const r = classifyUnitRow({ ...base, toaShift1: '', totalToa: '' });
    expect(r).toEqual({ status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' });
  });
  it('JANGGAL: TOA terisi tapi kedua trip kosong', () => {
    const r = classifyUnitRow({ ...base, tripPergi: '', tripPulang: '' });
    expect(r).toEqual({ status: 'JANGGAL', reason: 'TOA_TANPA_RITASE' });
  });
  it('JANGGAL: Total TOA lebih kecil dari TOA S1 (format angka Indonesia)', () => {
    expect(classifyUnitRow({ ...base, toaShift1: '1.100', totalToa: '1.050' }))
      .toEqual({ status: 'JANGGAL', reason: 'TOTAL_TOA_KURANG' });
    expect(classifyUnitRow({ ...base, toaShift1: '1.100', totalToa: '1.200' }).status).toBe('LENGKAP');
  });
  it('SEBAGIAN mencantumkan kolom yang kosong', () => {
    expect(classifyUnitRow({ ...base, tripPulang: '' })).toEqual({ status: 'SEBAGIAN', missing: ['tripPulang'] });
    expect(classifyUnitRow({ ...base, totalToa: '-' })).toEqual({ status: 'SEBAGIAN', missing: ['totalToa'] });
  });
  it('keterangan tidak membebaskan ritase tanpa TOA sama sekali (tetap JANGGAL)', () => {
    expect(classifyUnitRow({ ...base, toaShift1: '', totalToa: '', keterangan: 'MOGOK' }).status).toBe('JANGGAL');
  });

  describe('opsi D: unit berketerangan yang hanya jalan satu shift (WAJAR)', () => {
    it('TOA S1 kosong + Total TOA terisi + keterangan (tanpa prefiks) → WAJAR', () => {
      // Kasus nyata JAK.115 KWK 222179, 7 Nov 2026
      expect(classifyUnitRow({ ...base, toaShift1: '', totalToa: 166, keterangan: 'Program Keur/ Renops' }))
        .toEqual({ status: 'WAJAR', missing: ['toaShift1'] });
    });
    it('Total TOA kosong + TOA S1 terisi + keterangan berprefiks apa pun → WAJAR (prefiks diabaikan)', () => {
      expect(classifyUnitRow({ ...base, totalToa: '', keterangan: 'S2: NP2' })).toEqual({ status: 'WAJAR', missing: ['totalToa'] });
      expect(classifyUnitRow({ ...base, totalToa: '', keterangan: 'S1: NP2' })).toEqual({ status: 'WAJAR', missing: ['totalToa'] });
    });
    it('tanpa keterangan (atau SO/SGO/-) tetap SEBAGIAN', () => {
      expect(classifyUnitRow({ ...base, toaShift1: '' })).toEqual({ status: 'SEBAGIAN', missing: ['toaShift1'] });
      expect(classifyUnitRow({ ...base, totalToa: '', keterangan: 'SO' })).toEqual({ status: 'SEBAGIAN', missing: ['totalToa'] });
    });
    it('trip yang kosong tidak dimaklumi walau ada keterangan', () => {
      expect(classifyUnitRow({ ...base, tripPulang: '', totalToa: '', keterangan: 'NP2' }))
        .toEqual({ status: 'SEBAGIAN', missing: ['tripPulang', 'totalToa'] });
    });
  });
});

describe('computeRouteCompleteness', () => {
  const now = new Date('2026-11-07T14:00:00Z');
  it('menghitung jumlah per status dan hanya mencantumkan unit bermasalah', () => {
    const rows = [
      HEADER,
      row('KLM 540', 5, 5, 100, 180),
      row('KLM 541', 5, '', 100, 180),
      row('KLM 542', '', '', '', '', 'OFF'),
      row('KLM 543', '', '', '', ''),
      row('KLM 544', 5, 5, '', ''),
      ['', '', '', '', '', '', '', '', 999, '', ''], // baris rangkuman tanpa unit: dilewati
    ];
    const c = computeRouteCompleteness(rows, now);
    expect(c.status).toBe('ok');
    expect(c.computedAt).toBe('2026-11-07T14:00:00.000Z');
    expect(c.counts).toEqual({ LENGKAP: 1, WAJAR: 0, DIKECUALIKAN: 1, BELUM_DIISI: 1, JANGGAL: 1, SEBAGIAN: 1 });
    expect(c.issues).toEqual([
      { unit: 'KLM 541', status: 'SEBAGIAN', missing: ['tripPulang'] },
      { unit: 'KLM 543', status: 'BELUM_DIISI' },
      { unit: 'KLM 544', status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' },
    ]);
    expect(countCompletenessIssues(c)).toBe(3);
  });

  it('mendukung header dua baris (header utama + subheader)', () => {
    const rows = [
      ['NO BODY', 'TRIP', '', 'TOA', '', 'TOTAL TOA', 'KETERANGAN'],
      ['', 'PERGI', 'PULANG', 'SHIFT 1', 'SHIFT 2', '', ''],
      ['KLM 540', 4, 4, 90, '', 170, ''],
    ];
    const c = computeRouteCompleteness(rows, now);
    expect(c.status).toBe('ok');
    expect(c.counts.LENGKAP).toBe(1);
  });

  it('header_not_found bila kolom wajib tidak ditemukan', () => {
    const c = computeRouteCompleteness([['A', 'B'], ['1', '2']], now);
    expect(c.status).toBe('header_not_found');
    expect(c.fingerprint).toBe('');
    expect(countCompletenessIssues(c)).toBe(1);
  });

  it('fingerprint tetap saat hanya KM berubah, berubah saat TOA/keterangan berubah, tidak bergantung urutan', () => {
    const a = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, '', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    const kmOnly = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, '', 2000), row('KLM 541', 4, 4, 90, 170)], now);
    const reordered = computeRouteCompleteness([HEADER, row('KLM 541', 4, 4, 90, 170), row('KLM 540', 5, 5, 100, 180, '', 1000)], now);
    const toaChanged = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 101, 180, '', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    const ketChanged = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, 'BA02', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    expect(a.fingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(kmOnly.fingerprint).toBe(a.fingerprint);
    expect(reordered.fingerprint).toBe(a.fingerprint);
    expect(toaChanged.fingerprint).not.toBe(a.fingerprint);
    expect(ketChanged.fingerprint).not.toBe(a.fingerprint);
  });

  it('unit WAJAR dicantumkan dengan cuplikan keterangan, dihitung terpisah, dan bukan masalah', () => {
    const longKet = 'Program Keur/ Renops di terminal Tanjung Priok sejak pagi';
    const c = computeRouteCompleteness([HEADER, row('KWK 222179', 6, 6, '', 166, longKet), row('KLM 540', 5, 5, 100, 180)], now);
    expect(c.counts).toEqual({ LENGKAP: 1, WAJAR: 1, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0 });
    expect(c.issues).toEqual([
      { unit: 'KWK 222179', status: 'WAJAR', missing: ['toaShift1'], note: longKet.slice(0, 40) },
    ]);
    expect(countCompletenessIssues(c)).toBe(0);
  });

  it('countCompletenessIssues menganggap data kosong sebagai 1 masalah', () => {
    expect(countCompletenessIssues(null)).toBe(1);
    expect(countCompletenessIssues(undefined)).toBe(1);
  });
});

describe('paritas isExemptingKeterangan vs classifyUnitKeterangan', () => {
  const FIXTURES = ['', 'OFF', 'LIBUR', 'S1: OFF', 'S2: BA02 Service', 'T.O', 'TO EVDAL', 'MOGOK', 'SO', 'SGO',
    'S1: SO', 'BA.02 NP1', 'OFF | SGO', 'Rusak radiator', 'NP2', 'OKB', 'Renop', 'S1: NP1 | S2: T.O', 'SGO | SGO'];
  it.each(FIXTURES)('"%s" sama dengan (classifyUnitKeterangan !== NORMAL)', (k) => {
    expect(isExemptingKeterangan(k)).toBe(classifyUnitKeterangan(k) !== 'NORMAL');
    const normalized = normalizeKeterangan(k);
    expect(isExemptingKeterangan(normalized)).toBe(classifyUnitKeterangan(normalized) !== 'NORMAL');
  });
  it('pengecualian terdokumentasi: "-" dan "0" dianggap NORMAL (tanpa keterangan)', () => {
    expect(isExemptingKeterangan('-')).toBe(false);
    expect(isExemptingKeterangan('0')).toBe(false);
  });
});
