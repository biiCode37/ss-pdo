// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShiftComparisonCard } from '../ShiftComparisonCard';
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
  totalShift1: 1500, // 60%
  totalShift2: 1000, // 40%
  totalToaShift1: 1400,
  totalToaShift2: 900,
  totalManualShift1: 100,
  totalManualShift2: 100,
  totalBuses: 10,
  filledBuses: 10,
  unfilledBuses: 0,
  unfilledUnits: [],
  completionPercentage: 100,
  busesWithNotes: [],
  ...partial,
});

describe('ShiftComparisonCard Component - Visual Distribution Ratio', () => {
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

  it('renders shift comparison data with dynamic distribution ratio bar and percentage share', async () => {
    const summary = createMockSummary();

    await act(async () => {
      root.render(<ShiftComparisonCard summary={summary} dateBadge="Tgl 10" />);
    });

    expect(container.textContent).toContain('Komparasi Pelanggan');
    expect(container.textContent).toContain('Tgl 10');

    // Share persentase 60% vs 40%
    expect(container.textContent).toContain('Shift 1 (60%)');
    expect(container.textContent).toContain('Shift 2 (40%)');

    // Progress bar element
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('60');

    // Nilai-nilai shift
    expect(container.textContent).toContain('1.400'); // TOA S1
    expect(container.textContent).toContain('900');   // TOA S2
    expect(container.textContent).toContain('1.500'); // Total S1
    expect(container.textContent).toContain('1.000'); // Total S2
  });
});
