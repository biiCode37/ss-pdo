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

  it('shows confirmation when tapping unit with OFF status', async () => {
    (alertUtils.pdoSwal.fire as any).mockResolvedValue({ isConfirmed: true });

    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'OFF',
          }}
        />
      );
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Konfirmasi'),
        html: expect.stringContaining('OFF'),
      })
    );
    expect(alertUtils.showBusInputModal).toHaveBeenCalled();
  });

  it('cancels opening modal if confirmation is denied', async () => {
    (alertUtils.pdoSwal.fire as any).mockResolvedValue({ isDenied: true });

    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'TO EVDAL',
          }}
        />
      );
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).toHaveBeenCalled();
    expect(alertUtils.showBusInputModal).not.toHaveBeenCalled();
  });
});
