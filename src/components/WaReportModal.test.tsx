// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WaReportModal } from './WaReportModal';
import type { RegionalMonitoringResult, RegionalRouteItem } from '../services/allRouteMonitoringService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('WaReportModal Component - Format 3 & Blocking Rules', () => {
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

  const mockRouteConfirmed = (code: string, id: number): RegionalRouteItem => ({
    id,
    routeCode: code,
    routeName: `JALUR ${code}`,
    operatorName: 'KLM',
    isLooping: false,
    kmBaku: 15,
    targetHk: 5000,
    bestRecord: 6000,
    supervisorName: 'Ranto Lumban Toruan',
    defaultRenops: 16,
    renopsShift1: 16,
    realopsShift1: 16,
    renopsShift2: 16,
    realopsShift2: 16,
    totalRenops: 16,
    totalRealops: 16,
    headwayFastest: 3,
    headwaySlowest: 10,
    trafficJamSpots: [],
    operationalIssues: '',
    status: 'submitted',
    isFleetConfirmedS1: true,
    isFleetConfirmedS2: true,
    fleetStatusShift1: [],
    fleetStatusShift2: [],
    todayPassengers: 500,
    yesterdayPassengers: 480,
    lastWeekPassengers: 490,
    totalKm: 240,
    achievementKm: 15,
    toaShift1: 250,
    manualShift1: 0,
    totalShift1: 250,
    toaShift2: 250,
    manualShift2: 0,
    totalShift2: 250
  });

  const mockRouteUnconfirmed = (code: string, id: number): RegionalRouteItem => ({
    ...mockRouteConfirmed(code, id),
    isFleetConfirmedS1: false,
    isFleetConfirmedS2: false,
  });

  const mockRegionalData = (routes: RegionalRouteItem[]): RegionalMonitoringResult => ({
    date: '2026-09-10',
    yesterdayDate: '2026-09-09',
    lastWeekDate: '2026-09-03',
    routes,
    totalRenops: 16,
    totalRealops: 16,
    totalTodayPassengers: 1000,
    totalTargetPassengers: 1000,
    totalYesterdayPassengers: 960,
    totalLastWeekPassengers: 980,
    totalKm: 480,
    averageKmPerBus: 15,
    tomShift1: 500,
    manualShift1: 0,
    totalShift1: 500,
    yesterdayShift1: 480,
    lastWeekShift1: 490,
    tomShift2: 500,
    manualShift2: 0,
    totalShift2: 500,
    yesterdayShift2: 480,
    lastWeekShift2: 490,
    submittedCount: routes.length,
    verifiedCount: 0,
    draftCount: 0,
    emptyCount: 0,
    totalRoutesCount: routes.length
  });

  it('renders Format 3 tab button', async () => {
    const data = mockRegionalData([mockRouteConfirmed('JAK.01', 1)]);
    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={data}
          selectedDate="2026-09-10"
        />
      );
    });

    expect(container.textContent).toContain('Format 3');
    expect(container.textContent).toContain('Status Armada');
  });

  it('shows shift selector buttons when Format 3 is active', async () => {
    const data = mockRegionalData([mockRouteConfirmed('JAK.01', 1)]);
    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={data}
          selectedDate="2026-09-10"
        />
      );
    });

    // Find format 3 button
    const buttons = Array.from(container.querySelectorAll('button'));
    const f3Btn = buttons.find((b) => b.textContent?.includes('Format 3'));
    expect(f3Btn).toBeDefined();

    await act(async () => {
      f3Btn?.click();
    });

    expect(container.textContent).toContain('Shift 1');
    expect(container.textContent).toContain('Shift 2');
  });

  it('blocks Format 3 generation when there are unconfirmed routes', async () => {
    const data = mockRegionalData([
      mockRouteConfirmed('JAK.01', 1),
      mockRouteUnconfirmed('JAK.15', 2),
    ]);

    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={data}
          selectedDate="2026-09-10"
        />
      );
    });

    // Switch to Format 3
    const buttons = Array.from(container.querySelectorAll('button'));
    const f3Btn = buttons.find((b) => b.textContent?.includes('Format 3'));
    await act(async () => {
      f3Btn?.click();
    });

    // Must show unconfirmed route warning
    expect(container.textContent).toContain('JAK.15');

    // Action buttons must be disabled
    const actionButtons = Array.from(container.querySelectorAll('button'));
    const copyBtn = actionButtons.find((b) => b.textContent?.includes('Salin Teks'));
    const waBtn = actionButtons.find((b) => b.textContent?.includes('Buka WhatsApp'));

    expect(copyBtn?.disabled).toBe(true);
    expect(waBtn?.disabled).toBe(true);
  });

  it('enables action buttons when all routes are confirmed', async () => {
    const data = mockRegionalData([
      mockRouteConfirmed('JAK.01', 1),
      mockRouteConfirmed('JAK.15', 2),
    ]);

    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={data}
          selectedDate="2026-09-10"
        />
      );
    });

    // Switch to Format 3
    const buttons = Array.from(container.querySelectorAll('button'));
    const f3Btn = buttons.find((b) => b.textContent?.includes('Format 3'));
    await act(async () => {
      f3Btn?.click();
    });

    const actionButtons = Array.from(container.querySelectorAll('button'));
    const copyBtn = actionButtons.find((b) => b.textContent?.includes('Salin Teks'));
    const waBtn = actionButtons.find((b) => b.textContent?.includes('Buka WhatsApp'));

    expect(copyBtn?.disabled).toBe(false);
    expect(waBtn?.disabled).toBe(false);
  });
});
