// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnitCard } from '../UnitCard';
import type { UnitSummaryItem } from '@/utils/unitAnalytics';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockUnit = (partial: Partial<UnitSummaryItem> = {}): UnitSummaryItem => ({
  unit: 'JAK.15-01',
  totalToa: 120,
  totalPassengers: 145,
  totalKm: 184.5,
  tripPergi: '4',
  tripPulang: '4',
  isFilled: true,
  shiftStatus: 'FULL_COMPLETE',
  notes: [],
  noteCount: 0,
  ...partial,
});

describe('UnitCard Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('renders unit identity, status badge, and 3-column metric strip', async () => {
    const onSelectUnit = vi.fn();
    const mockItem = createMockUnit({
      unit: 'JAK.15-05',
      shiftStatus: 'FULL_COMPLETE',
      totalKm: 150.2,
      totalPassengers: 230,
      tripPergi: '4',
      tripPulang: '4',
    });

    await act(async () => {
      root.render(<UnitCard item={mockItem} onSelectUnit={onSelectUnit} />);
    });

    expect(container.textContent).toContain('JAK.15-05');
    expect(container.textContent).toContain('2 Shift Lengkap');
    expect(container.textContent).toContain('4/4');
    expect(container.textContent).toContain('150,2');
    expect(container.textContent).toContain('230');

    // Trigger select via click
    const card = container.querySelector('.bus-card') as HTMLDivElement;
    expect(card).not.toBeNull();
    await act(async () => {
      card.click();
    });
    expect(onSelectUnit).toHaveBeenCalledWith('JAK.15-05');
  });

  it('supports keyboard navigation via Enter and Space keys', async () => {
    const onSelectUnit = vi.fn();
    const mockItem = createMockUnit({ unit: 'JAK.15-02' });

    await act(async () => {
      root.render(<UnitCard item={mockItem} onSelectUnit={onSelectUnit} />);
    });

    const card = container.querySelector('.bus-card') as HTMLDivElement;
    await act(async () => {
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onSelectUnit).toHaveBeenCalledTimes(1);

    await act(async () => {
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(onSelectUnit).toHaveBeenCalledTimes(2);
  });

  it('renders shift status badges correctly for all status variants', async () => {
    const statuses: Array<{ status: UnitSummaryItem['shiftStatus']; label: string }> = [
      { status: 'SHIFT_1_ONLY', label: 'Hanya Shift 1' },
      { status: 'SHIFT_2_ONLY', label: 'Hanya Shift 2' },
      { status: 'INCOMPLETE', label: 'Parsial' },
      { status: 'EMPTY', label: 'Belum Terisi' },
    ];

    for (const { status, label } of statuses) {
      const mockItem = createMockUnit({ shiftStatus: status });
      await act(async () => {
        root.render(<UnitCard item={mockItem} onSelectUnit={vi.fn()} />);
      });
      expect(container.textContent).toContain(label);
    }
  });

  it('renders operational note when notes array is populated with meaningful detail', async () => {
    const mockItem = createMockUnit({
      notes: ['MOGOK RADIATOR BOCOR'],
      noteCount: 1,
    });

    await act(async () => {
      root.render(<UnitCard item={mockItem} onSelectUnit={vi.fn()} />);
    });

    expect(container.textContent).toContain('MOGOK RADIATOR BOCOR');
  });

  it('suppresses redundant pure status notes (e.g. OFF, TO, SGO) from bottom note strip', async () => {
    const mockItemOff = createMockUnit({
      notes: ['OFF'],
      noteCount: 1,
    });

    await act(async () => {
      root.render(<UnitCard item={mockItemOff} onSelectUnit={vi.fn()} />);
    });

    // Should not render bottom warning strip for pure status
    expect(container.querySelector('svg.lucide-alert-triangle')).toBeNull();
  });

  it('renders yellow [OFF] badge instead of "Belum Terisi" when unit is OFF', async () => {
    const mockItemOff = createMockUnit({
      unit: 'KWK 222161',
      shiftStatus: 'EMPTY',
      keterangan: 'OFF',
      notes: ['OFF'],
      noteCount: 1,
    });

    await act(async () => {
      root.render(<UnitCard item={mockItemOff} onSelectUnit={vi.fn()} />);
    });

    // Header must render [OFF] badge
    const offBadge = container.querySelector('.unit-status-badge-off');
    expect(offBadge).not.toBeNull();
    expect(offBadge?.textContent).toBe('OFF');

    // Must NOT display "Belum Terisi"
    expect(container.textContent).not.toContain('Belum Terisi');

    // Card should have bus-card-non-sgo class
    expect(container.querySelector('.bus-card')?.classList.contains('bus-card-non-sgo')).toBe(true);
  });

  it('renders red [T.O] badge instead of "Belum Terisi" when unit is T.O / TO EVDAL', async () => {
    const toVariants = ['TO', 'T.O', 'TO EVDAL', 'T.O EVDAL'];

    for (const toNote of toVariants) {
      const mockItemTo = createMockUnit({
        unit: 'KWK 222180',
        shiftStatus: 'EMPTY',
        keterangan: toNote,
        notes: [toNote],
        noteCount: 1,
      });

      await act(async () => {
        root.render(<UnitCard item={mockItemTo} onSelectUnit={vi.fn()} />);
      });

      // Header must render [T.O] badge
      const toBadge = container.querySelector('.unit-status-badge-to');
      expect(toBadge).not.toBeNull();
      expect(toBadge?.textContent).toBe('T.O');

      // Must NOT display "Belum Terisi"
      expect(container.textContent).not.toContain('Belum Terisi');

      // Card should have bus-card-non-sgo class
      expect(container.querySelector('.bus-card')?.classList.contains('bus-card-non-sgo')).toBe(true);
    }
  });

  it('renders "Belum Terisi" when unit has no notes and is empty', async () => {
    const mockItemEmpty = createMockUnit({
      unit: 'KWK 222160',
      shiftStatus: 'EMPTY',
      keterangan: '',
      notes: [],
      noteCount: 0,
    });

    await act(async () => {
      root.render(<UnitCard item={mockItemEmpty} onSelectUnit={vi.fn()} />);
    });

    expect(container.textContent).toContain('Belum Terisi');
    expect(container.querySelector('.unit-status-badge-off')).toBeNull();
    expect(container.querySelector('.unit-status-badge-to')).toBeNull();
    expect(container.querySelector('.bus-card')?.classList.contains('bus-card-non-sgo')).toBe(false);
  });
});
