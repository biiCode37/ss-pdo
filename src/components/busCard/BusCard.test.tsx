// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BusCard } from './BusCard';
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
    pdoSwal: {
      fire: vi.fn(),
    },
    showBusInputModal: vi.fn(),
    showWarningToast: vi.fn(),
  };
});

vi.mock('@/services/googleSheets', () => ({
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

  it('opens BusInputModal directly if unit is SGO (no notes)', async () => {
    await act(async () => {
      root.render(<BusCard {...defaultProps} />);
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    expect(card).toBeDefined();

    await act(async () => {
      card?.click();
    });

    expect(alertUtils.pdoSwal.fire).not.toHaveBeenCalled();
    const modal = document.body.querySelector('.bus-input-modal-overlay');
    expect(modal).not.toBeNull();
    expect(document.body.textContent).toContain('JAK.15-01');
  });

  it('allows opening modal without blocking when tapping unit with OFF status', async () => {
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

    expect(alertUtils.pdoSwal.fire).not.toHaveBeenCalled();
    expect(document.body.querySelector('.bus-input-modal-overlay')).not.toBeNull();
  });

  it('allows opening modal without blocking when tapping unit with TO EVDAL status', async () => {
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

    expect(alertUtils.pdoSwal.fire).not.toHaveBeenCalled();
    expect(document.body.querySelector('.bus-input-modal-overlay')).not.toBeNull();
  });

  it('allows opening modal and does not render obsolete unconfirmed warning badge when isShiftConfirmed is false', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          isShiftConfirmed={false}
        />
      );
    });

    expect(container.textContent).not.toContain('Belum Konfirmasi');

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card?.click();
    });

    expect(alertUtils.showWarningToast).not.toHaveBeenCalled();
    expect(document.body.querySelector('.bus-input-modal-overlay')).not.toBeNull();
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

  it('suppresses redundant bottom note strip when bus keterangan is pure status (OFF)', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'OFF',
          }}
          isShiftConfirmed={true}
        />
      );
    });

    // Header has the OFF badge
    const headerBadge = container.querySelector('.unit-status-badge-off');
    expect(headerBadge).not.toBeNull();
    expect(headerBadge?.textContent).toBe('OFF');

    // Bottom note strip should NOT be rendered (preventing duplicate warning icon & badge)
    expect(container.querySelector('svg.lucide-alert-triangle')).toBeNull();
  });

  it('renders bottom note strip when bus has meaningful detail even if containing OFF prefix', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            keterangan: 'OFF - BAN PECAH',
          }}
          isShiftConfirmed={true}
        />
      );
    });

    // Bottom note strip is rendered for meaningful detail
    expect(container.textContent).toContain('BAN PECAH');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('does NOT render T.O badge for unit with BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)', async () => {
    await act(async () => {
      root.render(
        <BusCard
          {...defaultProps}
          bus={{
            ...defaultProps.bus,
            unit: 'KWK 222180',
            keterangan: 'BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)',
          }}
          isShiftConfirmed={true}
        />
      );
    });

    // Must NOT have any T.O or OFF badge in header
    expect(container.querySelector('.unit-status-badge-to')).toBeNull();
    expect(container.querySelector('.unit-status-badge-off')).toBeNull();
    expect(container.querySelector('.unit-status-badge')).toBeNull();

    // But bottom note strip correctly shows BA.02 and description
    expect(container.textContent).toContain('BA.02');
    expect(container.textContent?.toLowerCase()).toContain('temperatur radiator menyala');
  });

  it('renders T.O badge in header ONLY for units with [T.O EVDAL/TO EVDAL/TO/T.O]', async () => {
    const toVariations = ['TO', 'T.O', 'TO EVDAL', 'T.O EVDAL'];

    for (const note of toVariations) {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222180',
              keterangan: note,
            }}
            isShiftConfirmed={true}
          />
        );
      });

      const toBadge = container.querySelector('.unit-status-badge-to');
      expect(toBadge).not.toBeNull();
      expect(toBadge?.textContent).toBe('T.O');
      expect(container.querySelector('.unit-status-badge-off')).toBeNull();
    }
  });

  describe('Focus Column Mode - Redundant Empty Badge Suppression for OFF / T.O Units', () => {
    it('suppresses redundant "KM Awal S1: Kosong" badge in focus mode when unit is OFF', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="kmAwal1"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222159',
              keterangan: 'OFF',
              kmAwal1: '',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      // Header must have [OFF] badge
      expect(container.querySelector('.unit-status-badge-off')?.textContent).toBe('OFF');

      // Must NOT display "KM Awal S1: Kosong"
      expect(container.textContent).not.toContain('KM Awal S1: Kosong');
      expect(container.textContent).not.toContain('Kosong');
    });

    it('suppresses redundant "KM Awal S1: Kosong" badge in focus mode when unit is T.O', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="kmAwal1"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222180',
              keterangan: 'T.O EVDAL',
              kmAwal1: '',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      // Header must have [T.O] badge
      expect(container.querySelector('.unit-status-badge-to')?.textContent).toBe('T.O');

      // Must NOT display "KM Awal S1: Kosong"
      expect(container.textContent).not.toContain('KM Awal S1: Kosong');
      expect(container.textContent).not.toContain('Kosong');
    });

    it('renders "KM Awal S1: Kosong" badge when unit is operating (not OFF/T.O) with a technical note', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="kmAwal1"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222166',
              keterangan: 'S1: PERBAIKAN RADIATOR',
              kmAwal1: '',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      // Header must display "KM Awal S1: Kosong" to remind operator that data is missing
      expect(container.textContent).toContain('KM Awal S1: Kosong');

      // Bottom strip displays technical note
      expect(container.textContent).toContain('PERBAIKAN RADIATOR');
    });

    it('retains filled value badge in focus mode even if unit has OFF note (safeguard)', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="kmAwal1"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222159',
              keterangan: 'OFF',
              kmAwal1: '12345',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      // If data is filled, badge shows the entered value
      expect(container.textContent).toContain('KM Awal S1: 12345');
    });

    it('suppresses "Trip: Kosong" badge in trip focus mode when unit is OFF', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="trip"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222161',
              keterangan: 'OFF',
              tripPergi: '',
              tripPulang: '',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      // Header has [OFF] badge and no "Trip: Kosong"
      expect(container.querySelector('.unit-status-badge-off')?.textContent).toBe('OFF');
      expect(container.textContent).not.toContain('Trip: Kosong');
    });

    it('places OFF and T.O badges on the right side of the card header', async () => {
      await act(async () => {
        root.render(
          <BusCard
            {...defaultProps}
            activeCategory="ALL"
            bus={{
              ...defaultProps.bus,
              unit: 'KWK 222161',
              keterangan: 'OFF',
            }}
            isShiftConfirmed={true}
          />
        );
      });

      const header = container.querySelector('.bus-card-header');
      expect(header).not.toBeNull();
      const headerChildren = header?.children;
      // First child is the left side (unit name + queued indicator)
      // Second child is the right side (status badge + summary + loading spinner)
      expect(headerChildren?.length).toBe(2);
      const rightSide = headerChildren?.[1];
      const offBadge = rightSide?.querySelector('.unit-status-badge-off');
      expect(offBadge).not.toBeNull();
      expect(offBadge?.textContent).toBe('OFF');

      // Left side should only contain the unit name, not the OFF badge
      const leftSide = headerChildren?.[0];
      expect(leftSide?.querySelector('.unit-status-badge-off')).toBeNull();
    });
  });
});
