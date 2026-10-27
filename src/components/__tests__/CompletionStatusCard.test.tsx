// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompletionStatusCard } from '../CompletionStatusCard';
import type { AnalyticsSummary } from '@/utils/analytics';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockSummary = (partial: Partial<AnalyticsSummary> = {}): AnalyticsSummary => ({
  totalKm: 1500,
  totalPassengers: 2500,
  grandTotalToa: 2300,
  grandTotalManual: 200,
  kmPerBus: 150,
  passengersPerKm: 1.66,
  totalShift1: 1500,
  totalShift2: 1000,
  totalToaShift1: 1400,
  totalToaShift2: 900,
  totalManualShift1: 100,
  totalManualShift2: 100,
  totalBuses: 10,
  filledBuses: 10,
  unfilledBuses: 0,
  unfilledUnits: [],
  completionPercentage: 100,
  busesWithNotes: [
    { unit: 'JAK.15-02', keterangan: 'BA.02 PRAMUDI MERIANG' },
    { unit: 'JAK.15-05', keterangan: 'OFF - BAN PECAH' },
  ],
  ...partial,
});

describe('CompletionStatusCard Component', () => {
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

  it('renders list of operational notes and triggers onSelectUnit on click and keyboard', async () => {
    const onSelectUnit = vi.fn();
    const summary = createMockSummary();

    await act(async () => {
      root.render(<CompletionStatusCard summary={summary} onSelectUnit={onSelectUnit} dateBadge="Tgl 10" />);
    });

    expect(container.textContent).toContain('Unit Dengan Keterangan Tertentu');
    expect(container.textContent).toContain('2 Unit');
    expect(container.textContent).toContain('JAK.15-02');
    expect(container.textContent).toContain('Pramudi Meriang');
    expect(container.textContent).toContain('JAK.15-05');
    expect(container.textContent).toContain('BAN PECAH');

    // Click jump
    const items = container.querySelectorAll('[role="button"]');
    expect(items.length).toBe(2);

    await act(async () => {
      (items[0] as HTMLDivElement).click();
    });
    expect(onSelectUnit).toHaveBeenCalledWith('JAK.15-02');

    // Keyboard navigation (Enter)
    await act(async () => {
      items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onSelectUnit).toHaveBeenCalledWith('JAK.15-05');
  });

  it('renders empty placeholder when no buses have notes', async () => {
    const summary = createMockSummary({ busesWithNotes: [] });

    await act(async () => {
      root.render(<CompletionStatusCard summary={summary} />);
    });

    expect(container.textContent).toContain('Tidak ada keterangan unit untuk tanggal ini.');
  });
});
