// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BusCardSummary } from './BusCardSummary';
import type { BusData } from '@/services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const makeBus = (tripPergi: string, tripPulang: string): BusData => ({
  rowIndex: 6, unit: 'BUS-01', tripPergi, tripPulang,
  toaShift1: '', toaShift2: '', manualShift1: '', manualShift2: '', totalToa: '',
  kmAwal1: '', kmAkhir1: '', kmAwal2: '', kmAkhir2: '', keterangan: '', originalRow: [],
});

describe('BusCardSummary — ritase satu warna netral', () => {
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

  const renderAll = (p: string, q: string) => {
    act(() => {
      root.render(
        <BusCardSummary formData={{}} bus={makeBus(p, q)} tabName="Tgl 9" activeCategory="ALL" onOpenTripModal={() => {}} />,
      );
    });
    return container.querySelector<HTMLElement>('.bus-metric-value');
  };

  it.each([['8', '8'], ['8', '7'], ['7', '8'], ['8', '5'], ['3', '3']])(
    '%s/%s tampil dengan warna netral yang sama',
    (p, q) => {
      // refact_219: warna netral datang dari kelas .bus-metric-value; tanpa override inline per kondisi trip.
      expect(renderAll(p, q)?.style.color).toBe('');
    },
  );

  it('menampilkan ritase PP (8/7 → 7.5) tanpa ikon peringatan', () => {
    const el = renderAll('8', '7');
    expect(el?.textContent).toContain('7.5');
    expect(el?.textContent).not.toContain('⚠️');
  });

  it('mode fokus trip: badge berisi trip tanpa label "Rit" dan warna netral', () => {
    act(() => {
      root.render(
        <BusCardSummary formData={{}} bus={makeBus('8', '7')} tabName="Tgl 9" activeCategory="trip" onOpenTripModal={() => {}} />,
      );
    });
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.textContent).toContain('8/7');
    expect(badge.textContent).not.toContain('Rit');
    expect(badge.style.color).toBe('var(--color-text-primary)');
  });
});
