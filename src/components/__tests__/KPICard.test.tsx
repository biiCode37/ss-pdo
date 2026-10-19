// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KPICard } from '../KPICard';
import type { AnalyticsSummary } from '@/utils/analytics';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockSummary = (partial: Partial<AnalyticsSummary> = {}): AnalyticsSummary => ({
  totalKm: 1845.6789,
  totalPassengers: 2450,
  grandTotalToa: 2300,
  grandTotalManual: 150,
  kmPerBus: 184.56789,
  passengersPerKm: 1.32742,
  totalShift1: 1300,
  totalShift2: 1150,
  totalToaShift1: 1200,
  totalToaShift2: 1100,
  totalManualShift1: 100,
  totalManualShift2: 50,
  totalBuses: 10,
  filledBuses: 10,
  unfilledBuses: 0,
  unfilledUnits: [],
  completionPercentage: 100,
  busesWithNotes: [],
  ...partial,
});

describe('KPICard Component - Executive 4-Grid Layout', () => {
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

  it('renders all 4 executive metrics with high-precision SSOT numbers and date badge', async () => {
    const summary = createMockSummary();

    await act(async () => {
      root.render(<KPICard summary={summary} dateBadge="Tgl 10" />);
    });

    expect(container.textContent).toContain('Capaian Pelanggan & Km');
    expect(container.textContent).toContain('Tgl 10');

    // 4 Metrik
    expect(container.textContent).toContain('TOTAL KM');
    expect(container.textContent).toContain('1.845,6789'); // formatted indonesian format
    expect(container.textContent).toContain('PELANGGAN (TOA)');
    expect(container.textContent).toContain('2.450');
    expect(container.textContent).toContain('KM / BUS');
    expect(container.textContent).toContain('184,56789');
    expect(container.textContent).toContain('PELANGGAN / KM');
    expect(container.textContent).toContain('1,32742');

    // Verifikasi CSS Grid class
    expect(container.querySelector('.kpi-executive-grid')).not.toBeNull();
    const cells = container.querySelectorAll('.kpi-metric-card');
    expect(cells.length).toBe(4);
  });
});
