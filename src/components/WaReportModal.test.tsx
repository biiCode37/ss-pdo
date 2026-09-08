// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WaReportModal } from './WaReportModal';
import type { RegionalMonitoringResult } from '../services/allRouteMonitoringService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('WaReportModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockData: RegionalMonitoringResult = {
    date: '2026-09-02',
    yesterdayDate: '2026-09-01',
    lastWeekDate: '2026-08-26',
    routes: [
      {
        id: 1,
        routeCode: 'JAK.01',
        routeName: 'TG. PRIOK - PLUMPANG',
        operatorName: 'KOLAMAS',
        isLooping: true,
        kmBaku: 14.415,
        targetHk: 5161,
        bestRecord: 5201,
        supervisorName: 'MOAMAR. Z.A. MAHU',
        defaultRenops: 20,
        renopsShift1: 10,
        realopsShift1: 10,
        renopsShift2: 10,
        realopsShift2: 10,
        totalRenops: 20,
        totalRealops: 20,
        headwayFastest: 2,
        headwaySlowest: 16,
        trafficJamSpots: ['Pasar Warakas'],
        operationalIssues: '',
        status: 'submitted',
        todayPassengers: 5077,
        yesterdayPassengers: 4937,
        lastWeekPassengers: 5189,
        totalKm: 3500,
        achievementKm: 175,
        toaShift1: 1873,
        manualShift1: 0,
        totalShift1: 1873,
        toaShift2: 3204,
        manualShift2: 0,
        totalShift2: 3204
      },
      {
        id: 2,
        routeCode: 'JAK.15',
        routeName: 'TG. PRIOK - RUSUN MARUNDA',
        operatorName: 'KWK',
        isLooping: false,
        kmBaku: 29.603,
        targetHk: 11164,
        bestRecord: 10207,
        supervisorName: 'ABDUL MANAN',
        defaultRenops: 60,
        renopsShift1: 0,
        realopsShift1: 0,
        renopsShift2: 0,
        realopsShift2: 0,
        totalRenops: 60,
        totalRealops: 0,
        headwayFastest: 0,
        headwaySlowest: 0,
        trafficJamSpots: [],
        operationalIssues: '',
        status: 'empty',
        todayPassengers: 0,
        yesterdayPassengers: 0,
        lastWeekPassengers: 0,
        totalKm: 0,
        achievementKm: 0,
        toaShift1: 0,
        manualShift1: 0,
        totalShift1: 0,
        toaShift2: 0,
        manualShift2: 0,
        totalShift2: 0
      }
    ],
    totalRenops: 80,
    totalRealops: 20,
    totalTodayPassengers: 5077,
    totalTargetPassengers: 16325,
    totalYesterdayPassengers: 4937,
    totalLastWeekPassengers: 5189,
    totalKm: 3500,
    averageKmPerBus: 175,
    tomShift1: 1873,
    manualShift1: 0,
    totalShift1: 1873,
    yesterdayShift1: 0,
    lastWeekShift1: 0,
    tomShift2: 3204,
    manualShift2: 0,
    totalShift2: 3204,
    yesterdayShift2: 0,
    lastWeekShift2: 0,
    submittedCount: 1,
    verifiedCount: 0,
    draftCount: 0,
    emptyCount: 1,
    totalRoutesCount: 2
  };

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

  it('does not render when isOpen is false', () => {
    act(() => {
      root.render(
        <WaReportModal
          isOpen={false}
          onClose={vi.fn()}
          regionalData={mockData}
          selectedDate="2026-09-02"
        />
      );
    });

    expect(container.textContent).toBe('');
  });

  it('renders modal with warning banner, preview text, and switch formats', async () => {
    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={mockData}
          selectedDate="2026-09-02"
        />
      );
    });

    expect(container.textContent).toContain('Generator Laporan WhatsApp');
    // Warning banner should report 1 route not ready
    expect(container.textContent).toContain('1 dari 2 rute belum mengirim laporan');

    // Default Format 1
    expect(container.textContent).toContain('Laporan JUMLAH PELANGGAN & PENCAPAIAN');
    expect(container.textContent).toContain('JAK 01');

    // Switch to Format 2
    const btnFormat2 = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Format 2')
    );
    expect(btnFormat2).toBeDefined();
    await act(async () => {
      btnFormat2?.click();
    });

    expect(container.textContent).toContain('MIKROTRANS WILAYAH UTARA');
    expect(container.textContent).toContain('FORMAT   \t:\t[TOA]+[MANUAL]=JUMLAH PELANGGAN');
  });

  it('copies message text to clipboard when Salin Teks is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      root.render(
        <WaReportModal
          isOpen={true}
          onClose={vi.fn()}
          regionalData={mockData}
          selectedDate="2026-09-02"
        />
      );
    });

    const copyBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Salin Teks')
    );
    expect(copyBtn).toBeDefined();

    await act(async () => {
      copyBtn?.click();
    });

    expect(writeTextMock).toHaveBeenCalled();
  });
});
