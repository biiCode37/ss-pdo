// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BusCard } from './BusCard';
import * as alertUtils from '../utils/alertUtils';

import type { BusData } from '../services/googleSheets';

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

vi.mock('../utils/alertUtils', async () => {
  const actual = await vi.importActual('../utils/alertUtils');
  return {
    ...actual,
    pdoSwal: {
      fire: vi.fn(),
    },
    showBusInputModal: vi.fn(),
    showWarningToast: vi.fn(),
  };
});

vi.mock('../services/googleSheets', () => ({
  getBusRowData: vi.fn().mockResolvedValue({}),
  updateBusData: vi.fn().mockResolvedValue({ success: true }),
}));

describe('BusCard Component - Non-Blocking Card Editing', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    bus: createMockBus({
      rowIndex: 6,
      unit: 'JAK.15-01',
      keterangan: '',
    }),
    sheetId: 'sheet-123',
    tabName: 'Tgl 9',
    headerMap: { unit: 0, keterangan: 20 },
    isQueued: false,
    addToQueue: vi.fn(),
    activeCategory: 'all',
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

  it('opens showBusInputModal directly if unit is SGO (no notes)', async () => {
    await act(async () => {
      root.render(<BusCard {...defaultProps} />);
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    expect(card).toBeDefined();

    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).not.toHaveBeenCalled();
    expect(alertUtils.showBusInputModal).toHaveBeenCalled();
  });

  it('blocks operational input and prompts to open fleet status when tapping unit with OFF status', async () => {
    const onOpenFleetStatusMock = vi.fn();
    (alertUtils.pdoSwal.fire as any).mockResolvedValue({ isConfirmed: true });

    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'OFF',
          }}
          onOpenFleetStatus={onOpenFleetStatusMock}
        />
      );
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'warning',
        html: expect.stringContaining('OFF'),
      })
    );
    expect(onOpenFleetStatusMock).toHaveBeenCalledTimes(1);
    expect(alertUtils.showBusInputModal).not.toHaveBeenCalled();
  });

  it('cancels action if non-SGO confirmation alert is canceled', async () => {
    const onOpenFleetStatusMock = vi.fn();
    (alertUtils.pdoSwal.fire as any).mockResolvedValue({ isConfirmed: false });

    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'TO EVDAL',
          }}
          onOpenFleetStatus={onOpenFleetStatusMock}
        />
      );
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).toHaveBeenCalled();
    expect(onOpenFleetStatusMock).not.toHaveBeenCalled();
    expect(alertUtils.showBusInputModal).not.toHaveBeenCalled();
  });

  it('blocks editing and triggers onOpenFleetStatus when isShiftConfirmed is false', async () => {
    const onOpenFleetStatusMock = vi.fn();

    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          isShiftConfirmed={false}
          onOpenFleetStatus={onOpenFleetStatusMock}
        />
      );
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.showWarningToast).toHaveBeenCalled();
    expect(onOpenFleetStatusMock).toHaveBeenCalledTimes(1);
    expect(alertUtils.showBusInputModal).not.toHaveBeenCalled();
  });

  it('does not render blue BA badge in card header when unit has BA note', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'BA.02 Pramudi Meriang',
          }}
          isShiftConfirmed={true}
        />
      );
    });

    const headerBadge = container.querySelector('.unit-status-badge');
    expect(headerBadge).toBeNull();
    // But FormattedNoteText still renders the note detail
    expect(container.textContent).toContain('Pramudi Meriang');
  });
});
