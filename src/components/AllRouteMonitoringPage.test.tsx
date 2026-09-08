// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { AllRouteMonitoringPage } from './AllRouteMonitoringPage';
import * as regionalService from '../services/allRouteMonitoringService';
import * as dailyReportService from '../services/dailyRouteReportService';
import type { RegionalMonitoringResult } from '../services/allRouteMonitoringService';

// Mock dependencies
vi.mock('../services/allRouteMonitoringService', () => ({
  fetchRegionalMonitoringData: vi.fn(),
  SUPERVISORS: [
    'Ranto Lumban Toruan',
    'Abdul Manan',
    'Moamar Z.A. Mahu'
  ]
}));

vi.mock('../services/dailyRouteReportService', () => ({
  verifyDailyRouteReport: vi.fn(),
}));

vi.mock('../utils/alertUtils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showErrorAlert: vi.fn(),
}));

const mockData: RegionalMonitoringResult = {
  date: '2026-09-02',
  yesterdayDate: '2026-09-01',
  lastWeekDate: '2026-08-26',
  routes: [
    {
      id: 1,
      routeCode: 'JAK 60',
      routeName: 'Kelapa Gading - Rusun Kemayoran',
      operatorName: 'PT Trans Mega',
      supervisorName: 'Ranto Lumban Toruan',
      isLooping: false,
      kmBaku: 18.5,
      targetHk: 3000,
      bestRecord: 4200,
      defaultRenops: 12,
      renopsShift1: 12,
      realopsShift1: 11,
      renopsShift2: 12,
      realopsShift2: 12,
      totalRenops: 12,
      totalRealops: 12,
      headwayFastest: 3,
      headwaySlowest: 8,
      trafficJamSpots: ['Jl. Perintis Kemerdekaan'],
      operationalIssues: 'Lancar aman',
      status: 'submitted',
      todayPassengers: 3150,
      yesterdayPassengers: 3050,
      lastWeekPassengers: 2900,
      toaShift1: 1600,
      manualShift1: 100,
      totalShift1: 1700,
      toaShift2: 1400,
      manualShift2: 50,
      totalShift2: 1450,
      totalKm: 215.4,
      achievementKm: 17.95
    },
    {
      id: 2,
      routeCode: 'JAK 05',
      routeName: 'Semper - Rorotan',
      operatorName: 'Koperasi Wahana',
      supervisorName: 'Abdul Manan',
      isLooping: true,
      kmBaku: 14.2,
      targetHk: 2500,
      bestRecord: 3600,
      defaultRenops: 10,
      renopsShift1: 10,
      realopsShift1: 10,
      renopsShift2: 10,
      realopsShift2: 10,
      totalRenops: 10,
      totalRealops: 10,
      headwayFastest: 5,
      headwaySlowest: 12,
      trafficJamSpots: [],
      operationalIssues: '',
      status: 'verified',
      todayPassengers: 2600,
      yesterdayPassengers: 2550,
      lastWeekPassengers: 2400,
      toaShift1: 1350,
      manualShift1: 50,
      totalShift1: 1400,
      toaShift2: 1150,
      manualShift2: 50,
      totalShift2: 1200,
      totalKm: 142.0,
      achievementKm: 14.2
    }
  ],
  totalRenops: 22,
  totalRealops: 22,
  totalTodayPassengers: 5750,
  totalTargetPassengers: 5500,
  totalYesterdayPassengers: 5600,
  totalLastWeekPassengers: 5300,
  totalKm: 357.4,
  averageKmPerBus: 16.25,
  tomShift1: 2950,
  manualShift1: 150,
  totalShift1: 3100,
  yesterdayShift1: 3000,
  lastWeekShift1: 2850,
  tomShift2: 2550,
  manualShift2: 100,
  totalShift2: 2650,
  yesterdayShift2: 2600,
  lastWeekShift2: 2450,
  submittedCount: 2,
  verifiedCount: 1,
  draftCount: 0,
  emptyCount: 0,
  totalRoutesCount: 2
};

describe('AllRouteMonitoringPage Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (regionalService.fetchRegionalMonitoringData as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
    (dailyReportService.verifyDailyRouteReport as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('renders regional KPI cards and route items after loading', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    // Verify title and readiness banner
    expect(container.textContent).toContain('Monitoring Wilayah Utara');
    expect(container.textContent).toContain('2 / 2 Rute Siap');

    // Verify KPI numbers
    expect(container.textContent).toContain('5.750'); // Total Pelanggan
    expect(container.textContent).toContain('357,4'); // Total KM
    expect(container.textContent).toContain('22 / 22'); // Armada Realops/Renops

    // Verify route cards
    expect(container.textContent).toContain('JAK 60');
    expect(container.textContent).toContain('JAK 05');
  });

  it('filters routes when supervisor filter tab is clicked', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    expect(container.textContent).toContain('JAK 60');
    expect(container.textContent).toContain('JAK 05');

    // Find Abdul Manan filter tab
    const abdulTab = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Abdul Manan')
    );
    expect(abdulTab).toBeDefined();

    await act(async () => {
      abdulTab?.click();
    });

    // Only JAK 05 should be visible in the filtered list
    expect(container.textContent).toContain('JAK 05');
    expect(container.textContent).not.toContain('JAK 60');
  });

  it('triggers verification when Verifikasi button on route card is clicked', async () => {
    await act(async () => {
      root.render(
        <AllRouteMonitoringPage
          currentDate="2026-09-02"
          currentUserEmail="korlap@example.com"
        />
      );
    });

    // Find verify button for JAK 60 (which has status 'submitted')
    const verifyBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Verifikasi')
    );
    expect(verifyBtn).toBeDefined();

    await act(async () => {
      verifyBtn?.click();
    });

    expect(dailyReportService.verifyDailyRouteReport).toHaveBeenCalledWith(
      1,
      '2026-09-02',
      'korlap@example.com'
    );
  });

  it('opens WhatsApp Report Modal when Buat Laporan WA button is clicked', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    const reportBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Buat Laporan WA')
    );
    expect(reportBtn).toBeDefined();

    await act(async () => {
      reportBtn?.click();
    });

    // WaReportModal should now be open
    expect(container.textContent).toContain('Generator Laporan WhatsApp');
  });
});
