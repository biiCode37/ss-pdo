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
});
