// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MonitoringMacroKpiGrid } from './MonitoringMacroKpiGrid';
import type { RegionalMonitoringResult } from '@/services/allRouteMonitoringService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const data = {
  totalTodayPassengers: 6466,
  totalTargetPassengers: 126784,
  totalRealops: 543,
  totalKm: 44803.292,
  averageKmPerBus: 82.5106,
  totalTrips: 1589.6,
  averageTripsPerBus: 2.927,
} as unknown as RegionalMonitoringResult;

describe('MonitoringMacroKpiGrid format angka Indonesia (BUG-FMT-201)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('menampilkan KM total dengan 1 desimal koma dan subteks memakai koma desimal', async () => {
    await act(async () => {
      root.render(<MonitoringMacroKpiGrid data={data} />);
    });
    const text = container.textContent || '';

    expect(text).toContain('44.803,3');
    expect(text).not.toContain('44.803,292');
    expect(text).toContain('82,5 KM per Bus');
    expect(text).not.toContain('82.5');
    expect(text).toContain('2,9 Rit per Bus');
    expect(text).toContain('5,1%');
    expect(text).toContain('0,14');
  });
});
