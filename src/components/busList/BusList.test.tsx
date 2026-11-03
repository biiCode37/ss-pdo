// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BusList } from './BusList';
import * as alertUtils from '@/utils/alertUtils';
import type { BusData } from '@/services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockBus = (partial: Partial<BusData> & { rowIndex: number; unit: string }): BusData => ({
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
  ...partial,
});

vi.mock('@/utils/alertUtils', async () => {
  const actual = await vi.importActual<typeof import('@/utils/alertUtils')>('@/utils/alertUtils');
  return {
    ...actual,
    showWarningToast: vi.fn(),
    showBulkTripModal: vi.fn(),
    showBulkCopyKmModal: vi.fn(),
  };
});

describe('BusList Component - Shift Lock and Operational Restrictions', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    data: [
      createMockBus({ rowIndex: 6, unit: 'JAK.15-01', keterangan: '' }),
      createMockBus({ rowIndex: 7, unit: 'JAK.15-02', keterangan: 'OFF' }),
    ],
    sheetId: 'sheet-123',
    tabName: 'Tgl 9',
    headerMap: { unit: 0, keterangan: 20 },
    syncQueue: [],
    addToQueue: vi.fn(),
    isLoading: false,
  };

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

  it('does not render duplicate shift lock banner inside BusList (handled centrally in DashboardStatusBanners)', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('.shift-lock-banner')).toBeNull();
  });

  it('does not render shift lock banner when isShiftConfirmed is true', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('.shift-lock-banner')).toBeNull();
  });

  it('allows bulk trip modal even when isShiftConfirmed is false', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
        />
      );
    });

    const setTripBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Set Target Trip') || b.textContent?.includes('Trip')
    );
    expect(setTripBtn).toBeDefined();

    await act(async () => {
      setTripBtn?.click();
    });

    expect(alertUtils.showBulkTripModal).toHaveBeenCalled();
  });

  it('calculates progress bar total count based only on units allowed for input (excluding OFF/non-SGO)', async () => {
    // data has 2 buses: JAK.15-01 (SGO) and JAK.15-02 (OFF)
    // Only JAK.15-01 is allowed, so total count should be 1
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/2 Unit');
  });

  it('renders progress bar consistently even when isShiftConfirmed is false for input visibility', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('[data-testid="daily-progress-container"]')).not.toBeNull();
    expect(container.textContent).toContain('Progres Harian');
  });

  it('shows progress bar when isShiftConfirmed is true', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('[data-testid="daily-progress-container"]')).toBeTruthy();
    expect(container.textContent).toContain('Progres Harian');
  });

  it('excludes units with TO EVDAL and shift-prefixed OFF from progress bar target', async () => {
    const mixedBuses = [
      createMockBus({ rowIndex: 2, unit: 'JAK.15-01', keterangan: '' }),
      createMockBus({ rowIndex: 3, unit: 'JAK.15-02', keterangan: 'TO EVDAL' }),
      createMockBus({ rowIndex: 4, unit: 'JAK.15-03', keterangan: 'S1: OFF' }),
      createMockBus({ rowIndex: 5, unit: 'JAK.15-04', keterangan: 'S2: TO EVDAL' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={mixedBuses}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // Dari 4 unit, hanya JAK.15-01 yang dihitung (3 lainnya berstatus OFF / TO EVDAL)
    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/4 Unit');
  });
  it('handles Hybrid View (Opsi B): default sheet row order, and sorts strictly by plotting order when filtering by base', async () => {
    const mockPlotting = {
      id: 1,
      route_id: 115,
      route_code: 'JAK.115',
      date: '2026-11-01',
      endpoint_a_name: 'Priok',
      endpoint_b_name: 'IGI',
      default_ritase: 7,
      created_by: 'user-1',
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
      units_data: [
        { unit: 'BUS-01', order: 2, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
        { unit: 'BUS-02', order: 1, start_point: 'B' as const, target_ritase: 7, status: 'READY' as const },
        { unit: 'BUS-03', order: 1, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
      ],
    };

    const fleetData = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01', keterangan: '' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: '' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', keterangan: '' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={fleetData}
          plotting={mockPlotting}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // 1. Verifikasi Selector Opsi B muncul dengan angka unit yang tepat
    const sheetTab = container.querySelector('[data-testid="filter-sort-sheet"]') as HTMLButtonElement;
    const baseATab = container.querySelector('[data-testid="filter-sort-base-a"]') as HTMLButtonElement;
    const baseBTab = container.querySelector('[data-testid="filter-sort-base-b"]') as HTMLButtonElement;

    expect(sheetTab).not.toBeNull();
    expect(baseATab).not.toBeNull();
    expect(baseBTab).not.toBeNull();

    expect(sheetTab.textContent).toContain('Semua (3)');
    expect(baseATab.textContent).toContain('📍 Priok (2)');
    expect(baseBTab.textContent).toContain('📍 IGI (1)');

    // 2. Default: Sheet order (BUS-01 -> BUS-02 -> BUS-03)
    let renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '7', '8']);

    // 3. Klik Base A (Priok): Harus difilter hanya Base A dan diurutkan menaik (#1 BUS-03, lalu #2 BUS-01)
    await act(async () => {
      baseATab.click();
    });

    renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['8', '6']); // BUS-03 (order 1) lalu BUS-01 (order 2)

    // 4. Klik Base B (IGI): Hanya BUS-02 (order 1)
    await act(async () => {
      baseBTab.click();
    });

    renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['7']); // BUS-02 (order 1)

    // 5. Klik Semua (Sheet): Kembali ke urutan sheet asli
    await act(async () => {
      sheetTab.click();
    });

    renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '7', '8']);
  });

  it('parks non-operational buses to the bottom of the list in both sheet and base views', async () => {
    const mockPlotting = {
      id: 1,
      route_id: 115,
      route_code: 'JAK.115',
      date: '2026-11-01',
      endpoint_a_name: 'Priok',
      endpoint_b_name: 'IGI',
      default_ritase: 7,
      created_by: 'user-1',
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
      units_data: [
        { unit: 'BUS-01', order: 2, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
        { unit: 'BUS-02', order: 1, start_point: 'A' as const, target_ritase: 0, status: 'OFF' as const },
        { unit: 'BUS-03', order: 3, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
      ],
    };

    const fleetData = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01', keterangan: '' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'OFF' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', keterangan: '' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={fleetData}
          plotting={mockPlotting}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // 1. Sheet View: BUS-02 (non-operational) is parked at the bottom: BUS-01 (6) -> BUS-03 (8) -> BUS-02 (7)
    let renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '8', '7']);

    // 2. Base A View: BUS-02 has order 1 but is non-operational, so operational BUS-01 (#2) & BUS-03 (#3) come first
    const baseATab = container.querySelector('[data-testid="filter-sort-base-a"]') as HTMLButtonElement;
    expect(baseATab).not.toBeNull();

    await act(async () => {
      baseATab.click();
    });

    renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '8', '7']);
  });

  it('auto-skips non-operational buses when Satset mode advances to the next unit', async () => {
    localStorage.setItem('pdo_satset_mode', 'true');

    const mockPlotting = {
      id: 1,
      route_id: 115,
      route_code: 'JAK.115',
      date: '2026-11-01',
      endpoint_a_name: 'Priok',
      endpoint_b_name: 'IGI',
      default_ritase: 7,
      created_by: 'user-1',
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
      units_data: [
        { unit: 'BUS-01', order: 1, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
        { unit: 'BUS-02', order: 2, start_point: 'A' as const, target_ritase: 0, status: 'OFF' as const },
        { unit: 'BUS-03', order: 3, start_point: 'A' as const, target_ritase: 7, status: 'READY' as const },
      ],
    };

    const fleetData = [
      createMockBus({
        rowIndex: 6,
        unit: 'BUS-01',
        toaShift1: '100',
        totalToa: '200',
        kmAwal1: '10',
        kmAkhir1: '20',
        tripPergi: '3',
        tripPulang: '3',
      }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: '', tripPergi: '', tripPulang: '' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', keterangan: '', tripPergi: '', tripPulang: '' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={fleetData}
          plotting={mockPlotting}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // Switch to trip category so checkFilled checks trip fields (both BUS-02 and BUS-03 are unfilled)
    const tripCatBtn = container.querySelector('[data-testid="category-chip-trip"]') as HTMLButtonElement;
    if (tripCatBtn) {
      await act(async () => {
        tripCatBtn.click();
      });
    }

    const cardBus1 = container.querySelector('[data-bus-row="6"]') as HTMLElement;
    const cardBus2 = container.querySelector('[data-bus-row="7"]') as HTMLElement;
    const cardBus3 = container.querySelector('[data-bus-row="8"]') as HTMLElement;

    expect(cardBus1).not.toBeNull();
    expect(cardBus2).not.toBeNull();
    expect(cardBus3).not.toBeNull();

    const spyBus2Click = vi.spyOn(cardBus2, 'click');
    const spyBus3Click = vi.spyOn(cardBus3, 'click');

    // Open modal for BUS-01
    await act(async () => {
      cardBus1.click();
    });

    // Submit form inside modal
    const form = document.body.querySelector('form');
    expect(form).not.toBeNull();

    await act(async () => {
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    // Wait for the 120ms timeout in handleSaveAndNext
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // BUS-02 (non-operational) must be skipped!
    expect(spyBus2Click).not.toHaveBeenCalled();
    // BUS-03 (operational) must be clicked!
    expect(spyBus3Click).toHaveBeenCalled();

    localStorage.removeItem('pdo_satset_mode');
  });
});
