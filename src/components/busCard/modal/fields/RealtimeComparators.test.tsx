// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CrossDayKmIndicator } from './CrossDayKmIndicator';
import { ToaShiftComparison } from './ToaShiftComparison';
import {
  computeLiveToaShift2,
  computeRealtimeDistance,
} from '@/utils/modals/busInput/busModalOdometer';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Pembanding realtime di modal input', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  describe('CrossDayKmIndicator', () => {
    const render = (prev: string, awal: string) => {
      act(() => {
        root.render(
          <CrossDayKmIndicator
            live={computeRealtimeDistance(prev, awal)}
            previousDayKmAkhir2={prev}
            dateLabel="Kemarin"
          />,
        );
      });
      return container.querySelector('[data-testid="cross-day-km-indicator"]');
    };

    it('menampilkan selisih positif KM Awal S1 terhadap KM Akhir S2 kemarin', () => {
      const el = render('316812', '316820');
      expect(el).not.toBeNull();
      expect(el?.textContent).toContain('+8.0 KM');
      expect(el?.textContent).toContain('316812');
    });

    it('selisih negatif tidak dirender di sini (ditangani kotak error + opsi odometer reset)', () => {
      expect(render('316812', '316700')).toBeNull();
    });

    it('tanpa KM akhir kemarin: tidak dirender', () => {
      act(() => {
        root.render(
          <CrossDayKmIndicator
            live={{ diff: null, status: 'empty', formattedText: null }}
            dateLabel="Kemarin"
          />,
        );
      });
      expect(container.querySelector('[data-testid="cross-day-km-indicator"]')).toBeNull();
    });
  });

  describe('ToaShiftComparison', () => {
    const render = (s1: string, total: string) => {
      act(() => {
        root.render(<ToaShiftComparison toaShift1={s1} live={computeLiveToaShift2(total, s1)} />);
      });
    };
    const s1 = () => container.querySelector('[data-testid="toa-compare-s1"]')?.textContent;
    const s2 = () => container.querySelector('[data-testid="toa-compare-s2"]')?.textContent;

    it('TOA S2 = TOTAL TOA − TOA S1 secara realtime', () => {
      render('86', '222');
      expect(s1()).toBe('86');
      expect(s2()).toBe('136');
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });

    it('TOTAL TOA belum diisi: TOA S2 "-"', () => {
      render('86', '');
      expect(s1()).toBe('86');
      expect(s2()).toBe('-');
    });

    it('TOTAL TOA < TOA S1: TOA S2 "-" dan peringatan merah', () => {
      render('120', '100');
      expect(s2()).toBe('-');
      expect(container.querySelector('[role="alert"]')?.textContent).toContain('lebih kecil dari Shift 1');
    });

    it('TOA S1 belum diisi: ditandai belum diisi', () => {
      render('', '200');
      expect(s1()).toBe('(Belum Diisi)');
      expect(s2()).toBe('-');
    });
  });
});
