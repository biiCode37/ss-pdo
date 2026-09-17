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
    const onOpenFleetStatusMock = vi.fn();

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
          onOpenFleetStatus={onOpenFleetStatusMock}
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
    expect(onOpenFleetStatusMock).not.toHaveBeenCalled();
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
});
