// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DailyPlottingPage, normalizeBaseOrders } from './DailyPlottingPage';
import * as dailyPlottingService from '@/services/dailyPlottingService';
import type { BusData } from '@/services/googleSheets';
import type { UnitPlottingItem } from '@/types/supabase';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/dailyPlottingService', () => ({
  fetchDailyPlotting: vi.fn(),
  saveDailyPlotting: vi.fn(),
  generateRollingFromYesterday: vi.fn((units) => {
    // Sederhana: putar item pertama ke terakhir
    if (units.length <= 1) return units;
    const [first, ...rest] = units;
    return [...rest, first].map((u, i) => ({ ...u, order: i + 1 }));
  }),
}));

vi.mock('@/utils/alertUtils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

describe('DailyPlottingPage Component & normalizeBaseOrders', () => {
  let container: HTMLDivElement;
  let root: Root;

  const sampleBuses: BusData[] = [
    {
      rowIndex: 1,
      unit: 'TJ-01',
      toaShift1: '',
      toaShift2: '',
      manualShift1: '',
      manualShift2: '',
      totalToa: '',
      kmAwal1: '',
      kmAkhir1: '',
      kmAwal2: '',
      kmAkhir2: '',
      keterangan: '',
      originalRow: [],
    },
    {
      rowIndex: 2,
      unit: 'TJ-02',
      toaShift1: '',
      toaShift2: '',
      manualShift1: '',
      manualShift2: '',
      totalToa: '',
      kmAwal1: '',
      kmAkhir1: '',
      kmAwal2: '',
      kmAkhir2: '',
      keterangan: '',
      originalRow: [],
    },
    {
      rowIndex: 3,
      unit: 'TJ-03',
      toaShift1: '',
      toaShift2: '',
      manualShift1: '',
      manualShift2: '',
      totalToa: '',
      kmAwal1: '',
      kmAkhir1: '',
      kmAwal2: '',
      kmAkhir2: '',
      keterangan: 'OFF',
      originalRow: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('normalizes base orders to strictly sequential 1..N without duplicates or gaps', () => {
    const corruptItems: UnitPlottingItem[] = [
      { unit: 'U1', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      { unit: 'U2', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' }, // duplikat order 1
      { unit: 'U3', order: 5, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      { unit: 'U4', order: 2, start_point: 'B', target_ritase: 7.5, status: 'READY' },
      { unit: 'U5', order: 99, start_point: 'B', target_ritase: 7.5, status: 'READY' },
    ];

    const normalized = normalizeBaseOrders(corruptItems);

    const baseA = normalized.filter((u) => u.start_point === 'A');
    const baseB = normalized.filter((u) => u.start_point === 'B');

    expect(baseA.map((u) => u.order)).toEqual([1, 2, 3]);
    expect(baseB.map((u) => u.order)).toEqual([1, 2]);
  });

  it('merender header kesiapan subuh, pangkalan tabs, dan kartu unit', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce(null);

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    expect(container.textContent).toContain('Plotting Armada Harian');
    expect(container.textContent).toContain('Priok');
    expect(container.textContent).toContain('IGI');
    expect(container.textContent).toContain('TJ-01');
  });

  it('beralih antara tab pangkalan A dan B dengan benar', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce(null);

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    const tabB = container.querySelector('[data-testid="tab-start-b"]') as HTMLButtonElement;
    expect(tabB).not.toBeNull();

    await act(async () => {
      tabB.click();
    });

    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('mengaktifkan mode atur urutan dan menampilkan tombol aksi reorder', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce(null);

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    const toggleBtn = container.querySelector('[data-testid="btn-toggle-reordering"]') as HTMLButtonElement;
    expect(toggleBtn.textContent).toContain('Atur Urutan');

    await act(async () => {
      toggleBtn.click();
    });

    expect(toggleBtn.textContent).toContain('Selesai');
    expect(container.querySelector('[data-testid="btn-apply-rolling"]')).not.toBeNull();
  });

  it('melakukan multi-select penetapan pangkalan tanpa merusak unit unselected', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce(null);

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    // Aktifkan mode atur urutan
    const toggleBtn = container.querySelector('[data-testid="btn-toggle-reordering"]') as HTMLButtonElement;
    await act(async () => {
      toggleBtn.click();
    });

    // Pilih TJ-01
    const card01 = container.querySelector('[data-testid="plotting-card-TJ-01"]') as HTMLDivElement;
    await act(async () => {
      card01.click();
    });

    // Floating action bar harus muncul
    const actionBar = container.querySelector('[data-testid="multi-select-action-bar"]');
    expect(actionBar).not.toBeNull();
    expect(actionBar?.textContent).toContain('1 Unit Terpilih');

    // Klik tombol jadikan start B (IGI)
    const btnAssignB = container.querySelector('[data-testid="btn-assign-start-b"]') as HTMLButtonElement;
    await act(async () => {
      btnAssignB.click();
    });

    // Action bar tertutup setelah aksi selesai
    expect(container.querySelector('[data-testid="multi-select-action-bar"]')).toBeNull();
  });

  it('membuka modal target ritase bebas saat chip ritase pada kartu diklik', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce(null);

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    // Cari chip ritase pada TJ-01
    const ritaseBtn = container.querySelector('[data-testid="btn-ritase-modal-TJ-01"]') as HTMLButtonElement;
    expect(ritaseBtn).not.toBeNull();

    await act(async () => {
      ritaseBtn.click();
    });

    // Modal harus terbuka
    expect(container.textContent).toContain('Atur Target Ritase');
    expect(container.textContent).toContain('TJ-01');
    expect(container.textContent).toContain('Terapkan Unit Ini');
  });

  it('menyimpan plotting saat tombol simpan ditekan', async () => {
    const mockSave = vi.mocked(dailyPlottingService.saveDailyPlotting);
    mockSave.mockResolvedValueOnce({
      id: 10,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [],
    });

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          headerMap={{
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
          }}
        />,
      );
    });

    const saveBtn = container.querySelector('[data-testid="btn-save-plotting"]') as HTMLButtonElement;
    await act(async () => {
      saveBtn.click();
    });

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 1,
        route_code: 'JAK.115',
        date: '2026-10-31',
      }),
    );
  });
});
