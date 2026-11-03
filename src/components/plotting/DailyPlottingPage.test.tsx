// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DailyPlottingPage, normalizeBaseOrders } from './DailyPlottingPage';
import * as dailyPlottingService from '@/services/dailyPlottingService';
import * as googleSheetsService from '@/services/googleSheets';
import type { BusData } from '@/services/googleSheets';
import type { UnitPlottingItem } from '@/types/supabase';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/dailyPlottingService', () => ({
  fetchDailyPlotting: vi.fn(),
  saveDailyPlotting: vi.fn(),
  generateRollingFromYesterday: vi.fn((units) => {
    if (units.length <= 1) return units;
    const [first, ...rest] = units;
    return [...rest, first].map((u, i) => ({ ...u, order: i + 1 }));
  }),
}));

vi.mock('@/services/googleSheets', async () => {
  const actual = await vi.importActual<any>('@/services/googleSheets');
  return {
    ...actual,
    updateBulkBusData: vi.fn(),
  };
});

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
      tripPergi: '7',
      tripPulang: '7',
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
      tripPergi: '',
      tripPulang: '',
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
      tripPergi: '',
      tripPulang: '',
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
      { unit: 'U2', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      { unit: 'U3', order: 5, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      { unit: 'U4', order: 2, start_point: 'B', target_ritase: 7.5, status: 'READY' },
    ];

    const normalized = normalizeBaseOrders(corruptItems);
    const unitsA = normalized.filter((u) => u.start_point === 'A');
    const unitsB = normalized.filter((u) => u.start_point === 'B');

    expect(unitsA.map((u) => u.order)).toEqual([1, 2, 3]);
    expect(unitsB.map((u) => u.order)).toEqual([1]);
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
    expect(container.textContent).toContain('JAK.115');
    expect(container.textContent).toContain('TJ-01');
    expect(container.textContent).toContain('TJ-02');
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

    const reorderBtn = container.querySelector('[data-testid="btn-toggle-reordering"]') as HTMLButtonElement;
    expect(reorderBtn).not.toBeNull();

    await act(async () => {
      reorderBtn.click();
    });

    expect(container.querySelector('[data-testid="btn-apply-rolling"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="btn-move-down-TJ-01"]')).not.toBeNull();
  });

  it('memindahkan urutan unit dengan tombol panah atas (infinity movement: #1 rotasi ke paling bawah)', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce({
      id: 1,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      ],
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

    const reorderBtn = container.querySelector('[data-testid="btn-toggle-reordering"]') as HTMLButtonElement;
    await act(async () => {
      reorderBtn.click();
    });

    const btnUp01 = container.querySelector('[data-testid="btn-move-up-TJ-01"]') as HTMLButtonElement;
    expect(btnUp01).not.toBeNull();

    await act(async () => {
      btnUp01.click();
    });

    const badge01 = container.querySelector('[data-testid="badge-order-TJ-01"]');
    expect(badge01?.textContent?.trim()).toBe('2');
    const badge02 = container.querySelector('[data-testid="badge-order-TJ-02"]');
    expect(badge02?.textContent?.trim()).toBe('1');
  });

  it('memindahkan urutan unit dengan tombol panah bawah 1 tingkat ke bawah', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce({
      id: 1,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-03', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      ],
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

    const reorderBtn = container.querySelector('[data-testid="btn-toggle-reordering"]') as HTMLButtonElement;
    await act(async () => {
      reorderBtn.click();
    });

    const btnDown01 = container.querySelector('[data-testid="btn-move-down-TJ-01"]') as HTMLButtonElement;
    await act(async () => {
      btnDown01.click();
    });

    const badge01 = container.querySelector('[data-testid="badge-order-TJ-01"]');
    expect(badge01?.textContent?.trim()).toBe('2');
    const badge02 = container.querySelector('[data-testid="badge-order-TJ-02"]');
    expect(badge02?.textContent?.trim()).toBe('1');
  });

  it('melakukan multi-select bebas dan menetapkan bulk ritase ke unit-unit terpilih', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce({
      id: 1,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      ],
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

    // Tap selector checkbox pada TJ-01 dan TJ-02
    const select01 = container.querySelector('[data-testid="btn-select-TJ-01"]') as HTMLButtonElement;
    const select02 = container.querySelector('[data-testid="btn-select-TJ-02"]') as HTMLButtonElement;

    await act(async () => {
      select01.click();
      select02.click();
    });

    // Floating action bar harus muncul dengan 2 Unit Terpilih
    const actionBar = container.querySelector('[data-testid="multi-select-action-bar"]');
    expect(actionBar).not.toBeNull();
    expect(actionBar?.textContent).toContain('2 Unit Terpilih');

    // Klik tombol Set Ritase (2)
    const btnBulkRitase = container.querySelector('[data-testid="btn-bulk-set-ritase"]') as HTMLButtonElement;
    expect(btnBulkRitase).not.toBeNull();

    await act(async () => {
      btnBulkRitase.click();
    });

    // Modal Bulk Target Ritase harus terbuka
    expect(container.textContent).toContain('Atur Ritase (2 Unit Terpilih)');
  });

  it('menyimpan plotting dan mengirimkan batch update ke Google Sheets asli (SSOT)', async () => {
    const mockSaveSupabase = vi.mocked(dailyPlottingService.saveDailyPlotting);
    mockSaveSupabase.mockResolvedValueOnce({
      id: 10,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [],
    });

    const mockUpdateBulkBusData = vi.mocked(googleSheetsService.updateBulkBusData);
    mockUpdateBulkBusData.mockResolvedValueOnce();

    const mockOnUpdateBus = vi.fn();

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
          sheetId="sheet-123"
          tabName="31"
          headerMap={{
            tripPergi: 1,
            tripPulang: 2,
            tripPergiLabel: 'TERM. TANJUNG PRIOK',
            tripPulangLabel: 'PEGANGSAAN II IGI',
            keterangan: 10,
          }}
          onUpdateBus={mockOnUpdateBus}
        />,
      );
    });

    const saveBtn = container.querySelector('[data-testid="btn-save-plotting"]') as HTMLButtonElement;
    await act(async () => {
      saveBtn.click();
    });

    // Verifikasi penyimpanan Supabase
    expect(mockSaveSupabase).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 1,
        route_code: 'JAK.115',
        date: '2026-10-31',
      }),
    );

    // Verifikasi mutasi massal ke Google Sheets ASLI (SSOT)
    expect(mockUpdateBulkBusData).toHaveBeenCalledWith(
      'sheet-123',
      '31',
      expect.any(Array),
      expect.objectContaining({ tripPergi: 1, tripPulang: 2, keterangan: 10 }),
    );

    // Verifikasi in-memory update busData lokal
    expect(mockOnUpdateBus).toHaveBeenCalled();
  });

  it('memiliki atribut data-no-swipe="true" untuk mencegah gesture bentrok pada mobile (BUG-195-06)', async () => {
    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
        />,
      );
    });

    const pageContainer = container.querySelector('[data-no-swipe="true"]');
    expect(pageContainer).not.toBeNull();
  });

  it('tidak menimpa target ritase unit berstatus OFF saat menerapkan ke semua (BUG-195-07)', async () => {
    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce({
      id: 1,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-03', order: 2, start_point: 'A', target_ritase: 0, status: 'OFF', keterangan: 'OFF' },
      ],
    });

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={sampleBuses}
        />,
      );
    });

    // Buka modal target ritase default dari header
    const btnTarget = container.querySelector('[data-testid="btn-open-target-modal-header"]') as HTMLButtonElement;
    await act(async () => {
      btnTarget.click();
    });

    // Klik tombol Terapkan ke Semua Unit
    const applyAllBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Terapkan ke Semua Unit'),
    );
    expect(applyAllBtn).toBeDefined();

    await act(async () => {
      applyAllBtn?.click();
    });

    // Target ritase TJ-03 (status OFF) harus tetap 0 Rit
    const card03 = container.querySelector('[data-testid="plotting-card-TJ-03"]');
    expect(card03?.textContent).toContain('0 Rit');
  });
});
