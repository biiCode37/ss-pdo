// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DailyPlottingPage, normalizeBaseOrders } from './DailyPlottingPage';
import * as dailyPlottingService from '@/services/dailyPlottingService';
import * as googleSheetsService from '@/services/googleSheets';
import { showSuccessToast } from '@/utils/alertUtils';
import { TEXT_PLOTTING } from '@/constants/texts';
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
      keterangan: '',
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

  it('menempatkan unit OFF atau target ritase 0 di paling bawah dengan order = 0, dan unit operasional berurutan 1..N', () => {
    const mixedItems: UnitPlottingItem[] = [
      { unit: 'U1', order: 1, start_point: 'A', target_ritase: 0, status: 'OFF' },
      { unit: 'U2', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      { unit: 'U3', order: 3, start_point: 'A', target_ritase: 0, status: 'READY' },
      { unit: 'U4', order: 4, start_point: 'A', target_ritase: 8, status: 'READY' },
      { unit: 'U5', order: 5, start_point: 'A', target_ritase: 7.5, status: 'OFF' },
      { unit: 'U6', order: 1, start_point: 'B', target_ritase: 0, status: 'OFF' },
      { unit: 'U7', order: 2, start_point: 'B', target_ritase: 7, status: 'READY' },
    ];

    const normalized = normalizeBaseOrders(mixedItems);
    const unitsA = normalized.filter((u) => u.start_point === 'A');
    const unitsB = normalized.filter((u) => u.start_point === 'B');

    // Unit operasional di A (U2, U4) harus nomor 1 dan 2
    expect(unitsA.slice(0, 2).map((u) => ({ unit: u.unit, order: u.order }))).toEqual([
      { unit: 'U2', order: 1 },
      { unit: 'U4', order: 2 },
    ]);
    // Unit non-operasional di A (U1, U3, U5) harus terparkir di bawah dengan order = 0
    expect(unitsA.slice(2).map((u) => ({ unit: u.unit, order: u.order }))).toEqual([
      { unit: 'U1', order: 0 },
      { unit: 'U3', order: 0 },
      { unit: 'U5', order: 0 },
    ]);

    // Di Base B: U7 operasional (order 1), U6 non-op di bawah (order 0)
    expect(unitsB.map((u) => ({ unit: u.unit, order: u.order }))).toEqual([
      { unit: 'U7', order: 1 },
      { unit: 'U6', order: 0 },
    ]);
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

  it('membuka modal posisi satuan lewat badge urutan dan memindahkan ke paling depan (TOP)', async () => {
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
        />,
      );
    });

    const badge02 = container.querySelector('[data-testid="badge-order-TJ-02"]') as HTMLButtonElement;
    expect(badge02).not.toBeNull();

    await act(async () => {
      badge02.click();
    });

    // Modal posisi satuan terbuka
    expect(container.textContent).toContain(TEXT_PLOTTING.ORDER_MODAL.TITLE_SINGLE('TJ-02', 2));

    // Klik tombol Paling Depan (#1)
    const btnTop = container.querySelector('[data-testid="btn-order-top"]') as HTMLButtonElement;
    expect(btnTop).not.toBeNull();

    await act(async () => {
      btnTop.click();
    });

    // TJ-02 sekarang nomor 1, TJ-01 nomor 2, TJ-03 nomor 3
    const updatedBadge02 = container.querySelector('[data-testid="badge-order-TJ-02"]');
    const updatedBadge01 = container.querySelector('[data-testid="badge-order-TJ-01"]');
    const updatedBadge03 = container.querySelector('[data-testid="badge-order-TJ-03"]');

    expect(updatedBadge02?.textContent?.trim()).toBe('1');
    expect(updatedBadge01?.textContent?.trim()).toBe('2');
    expect(updatedBadge03?.textContent?.trim()).toBe('3');

    expect(showSuccessToast).toHaveBeenCalledWith(TEXT_PLOTTING.ORDER_MODAL.APPLY_SUCCESS(1));
  });

  it('melakukan seleksi rombongan dan memindahkan posisi unit via btn-bulk-reorder', async () => {
    const fourBuses: BusData[] = [
      ...sampleBuses,
      {
        rowIndex: 4,
        unit: 'TJ-04',
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
    ];

    vi.mocked(dailyPlottingService.fetchDailyPlotting).mockResolvedValueOnce({
      id: 1,
      route_id: 1,
      route_code: 'JAK.115',
      date: '2026-10-31',
      units_data: [
        { unit: 'TJ-01', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-02', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-03', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
        { unit: 'TJ-04', order: 4, start_point: 'A', target_ritase: 7.5, status: 'READY' },
      ],
    });

    await act(async () => {
      root.render(
        <DailyPlottingPage
          routeId={1}
          routeCode="JAK.115"
          date="2026-10-31"
          buses={fourBuses}
        />,
      );
    });

    // Seleksi TJ-03 dan TJ-04
    const select03 = container.querySelector('[data-testid="btn-select-TJ-03"]') as HTMLButtonElement;
    const select04 = container.querySelector('[data-testid="btn-select-TJ-04"]') as HTMLButtonElement;

    await act(async () => {
      select03.click();
      select04.click();
    });

    // Floating action bar muncul dengan tombol Atur Posisi (2)
    const btnBulkReorder = container.querySelector('[data-testid="btn-bulk-reorder"]') as HTMLButtonElement;
    expect(btnBulkReorder).not.toBeNull();
    expect(btnBulkReorder.textContent).toContain(TEXT_PLOTTING.ACTIONS.BULK_REORDER(2));

    await act(async () => {
      btnBulkReorder.click();
    });

    // Modal posisi rombongan terbuka
    expect(container.textContent).toContain(TEXT_PLOTTING.ORDER_MODAL.TITLE_MULTI(2));

    // Pilih placement ABOVE unit acuan TJ-02
    const btnAbove = container.querySelector('[data-testid="btn-dir-above"]') as HTMLButtonElement;
    await act(async () => {
      btnAbove.click();
    });

    const selectRef = container.querySelector('[data-testid="select-ref-unit"]') as HTMLSelectElement;
    expect(selectRef).not.toBeNull();

    await act(async () => {
      selectRef.value = 'TJ-02';
      selectRef.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const btnSubmit = container.querySelector('[data-testid="btn-order-submit"]') as HTMLButtonElement;
    await act(async () => {
      btnSubmit.click();
    });

    // Urutan baru: TJ-01 (#1), TJ-03 (#2), TJ-04 (#3), TJ-02 (#4)
    const b01 = container.querySelector('[data-testid="badge-order-TJ-01"]');
    const b03 = container.querySelector('[data-testid="badge-order-TJ-03"]');
    const b04 = container.querySelector('[data-testid="badge-order-TJ-04"]');
    const b02 = container.querySelector('[data-testid="badge-order-TJ-02"]');

    expect(b01?.textContent?.trim()).toBe('1');
    expect(b03?.textContent?.trim()).toBe('2');
    expect(b04?.textContent?.trim()).toBe('3');
    expect(b02?.textContent?.trim()).toBe('4');

    // Floating bar sudah tertutup karena unselect all
    expect(container.querySelector('[data-testid="multi-select-action-bar"]')).toBeNull();
    expect(showSuccessToast).toHaveBeenCalledWith(TEXT_PLOTTING.ORDER_MODAL.APPLY_SUCCESS(2));
  });

  it('secara otomatis memarkir unit ke bawah dengan badge non-operasi saat status diubah ke OFF', async () => {
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
        />,
      );
    });

    // Awal: TJ-01 #1, TJ-02 #2
    const b01Initial = container.querySelector('[data-testid="badge-order-TJ-01"]');
    expect(b01Initial?.textContent?.trim()).toBe('1');

    // Buka trouble modal pada TJ-01
    const btnStatus01 = container.querySelector('[data-testid="btn-status-TJ-01"]') as HTMLButtonElement;
    await act(async () => {
      btnStatus01.click();
    });

    // Pilih kode OFF pada modal trouble
    const btnOff = container.querySelector('[data-testid="trouble-code-OFF"]') as HTMLButtonElement;
    expect(btnOff).not.toBeNull();
    await act(async () => {
      btnOff.click();
    });

    const applyTroubleBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(TEXT_PLOTTING.TROUBLE_MODAL.APPLY_BTN),
    );
    expect(applyTroubleBtn).toBeDefined();

    await act(async () => {
      applyTroubleBtn?.click();
    });

    // Sekarang TJ-02 menjadi urutan #1 dan TJ-01 terparkir di bawah dengan badge '-'
    const b02After = container.querySelector('[data-testid="badge-order-TJ-02"]');
    const b01After = container.querySelector('[data-testid="badge-order-TJ-01"]');
    expect(b02After?.textContent?.trim()).toBe('1');
    expect(b01After?.textContent?.trim()).toBe('-');
  });
});
