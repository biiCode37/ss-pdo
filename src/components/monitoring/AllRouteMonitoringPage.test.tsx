// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { AllRouteMonitoringPage } from './AllRouteMonitoringPage';
import * as regionalService from '@/services/allRouteMonitoringService';
import * as regionalIngestionService from '@/services/regionalIngestionService';
import * as dailyReportService from '@/services/dailyRouteReportService';
import * as fleetService from '@/services/fleetStatusService';
import type { RegionalMonitoringResult } from '@/services/allRouteMonitoringService';
import { TEXT_MONITORING } from '@/constants/texts/text_monitoring';

vi.mock('@/services/regionalIngestionService', () => ({
  ingestRegionalRouteSummaries: vi.fn(),
}));

vi.mock('@/services/allRouteMonitoringService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/allRouteMonitoringService')>();
  return {
    ...actual,
    fetchRegionalMonitoringData: vi.fn(),
    syncRegionalDailyFromGlobalSheet: vi.fn(),
    SUPERVISORS: [
      'Ranto Lumban Toruan',
      'Abdul Manan',
      'Moamar Z.A. Mahu'
    ]
  };
});

vi.mock('@/services/dailyRouteReportService', () => ({
  verifyDailyRouteReport: vi.fn(),
}));

vi.mock('@/services/fleetStatusService', () => ({
  fetchDailyFleetShiftsByDate: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/utils/alertUtils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  showErrorAlert: vi.fn(),
  showRegionalSyncModal: vi.fn(),
  showConfirmationDialog: vi.fn().mockResolvedValue(true),
}));

const mockData: RegionalMonitoringResult = {
  date: '2026-09-02',
  yesterdayDate: '2026-09-01',
  lastWeekDate: '2026-08-26',
  routes: [
    {
      id: 1,
      routeCode: 'JAK.60',
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
      achievementKm: 17.95,
      totalTrips: 130,
      dataSource: 'app_input',
      targetPercentage: 105,
      targetPassengersPerKm: 1.5,
      passengersPerKm: 14.6,
      passengersPerKmPercentage: 97.3,
      tripsPerBus: 10.8,
      passengersPerBus: 262.5,
    },
    {
      id: 2,
      routeCode: 'JAK.05',
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
      achievementKm: 14.2,
      totalTrips: 110,
      dataSource: 'sheet_ingestion',
      targetPercentage: 104,
      targetPassengersPerKm: 1.5,
      passengersPerKm: 18.3,
      passengersPerKmPercentage: 122,
      tripsPerBus: 11,
      passengersPerBus: 260,
    },
    {
      id: 3,
      routeCode: 'JAK.01',
      routeName: 'Tanjung Priok - Plumpang',
      operatorName: 'KOLAMAS',
      supervisorName: 'Moamar Z.A. Mahu',
      isLooping: false,
      kmBaku: 14.4,
      targetHk: 2000,
      bestRecord: 3000,
      defaultRenops: 20,
      renopsShift1: 20,
      realopsShift1: 20,
      renopsShift2: 20,
      realopsShift2: 20,
      totalRenops: 20,
      totalRealops: 20,
      headwayFastest: 4,
      headwaySlowest: 10,
      trafficJamSpots: [],
      operationalIssues: '',
      status: 'submitted',
      todayPassengers: 2000,
      yesterdayPassengers: 1900,
      lastWeekPassengers: 1800,
      toaShift1: 1000,
      manualShift1: 100,
      totalShift1: 1100,
      toaShift2: 800,
      manualShift2: 100,
      totalShift2: 900,
      totalKm: 150.0,
      achievementKm: 15.0,
      totalTrips: 120,
      dataSource: 'empty',
      targetPercentage: 100,
      targetPassengersPerKm: 1.5,
      passengersPerKm: 13.3,
      passengersPerKmPercentage: 88.6,
      tripsPerBus: 6,
      passengersPerBus: 100,
    }
  ],
  totalRenops: 42,
  totalRealops: 42,
  totalTodayPassengers: 7750,
  totalTargetPassengers: 7500,
  totalYesterdayPassengers: 7500,
  totalLastWeekPassengers: 7100,
  totalKm: 507.4,
  averageKmPerBus: 15.5,
  totalTrips: 360,
  averageTripsPerBus: 12,
  tomShift1: 3950,
  manualShift1: 250,
  totalShift1: 4200,
  yesterdayShift1: 4000,
  lastWeekShift1: 3800,
  tomShift2: 3350,
  manualShift2: 200,
  totalShift2: 3550,
  yesterdayShift2: 3500,
  lastWeekShift2: 3300,
  submittedCount: 2,
  verifiedCount: 1,
  draftCount: 0,
  emptyCount: 0,
  totalRoutesCount: 3,
  appInputCount: 1,
  sheetSyncCount: 1,
  emptySourceCount: 1
};

describe('AllRouteMonitoringPage Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (regionalService.fetchRegionalMonitoringData as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
    (dailyReportService.verifyDailyRouteReport as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (fleetService.fetchDailyFleetShiftsByDate as ReturnType<typeof vi.fn>).mockResolvedValue([]);

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

  it('renders executive dashboard tab by default with KPIs and chart', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    // Header title
    expect(container.textContent).toContain(TEXT_MONITORING.HEADER.TITLE);
    // Tab 1 (Dashboard) components
    expect(container.textContent).toContain('Kesiapan Status Armada PDO');
    expect(container.textContent).toContain('7.750'); // Total Pelanggan
    expect(container.textContent).toContain('507,4'); // Total KM
    expect(container.textContent).toContain('Tren TOA Penumpang per Rute');
    expect(container.textContent).toContain('Perbandingan Beban Operasional Shift');
    expect(container.textContent).toContain('Kinerja Rute Wilayah');
  });

  it('navigates to Rute tab and filters by supervisor', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    // Click Rute tab in bottom nav
    const routesTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-routes"]'
    );
    expect(routesTabBtn).toBeTruthy();

    await act(async () => {
      routesTabBtn?.click();
    });

    // Should show routes list
    expect(container.textContent).toContain('JAK.60');
    expect(container.textContent).toContain('JAK.05');
    expect(container.textContent).toContain('JAK.01');

    // Filter by Abdul Manan
    const abdulTab = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Abdul')
    );
    expect(abdulTab).toBeDefined();

    await act(async () => {
      abdulTab?.click();
    });

    // Only JAK.05 visible
    expect(container.textContent).toContain('JAK.05');
    expect(container.textContent).not.toContain('JAK.60');
    expect(container.textContent).not.toContain('JAK.01');
  });

  it('triggers verification when Verifikasi button on route card is clicked in Rute tab', async () => {
    await act(async () => {
      root.render(
        <AllRouteMonitoringPage
          currentDate="2026-09-02"
          currentUserEmail="korlap@example.com"
        />
      );
    });

    // Switch to Rute tab
    const routesTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-routes"]'
    );
    await act(async () => {
      routesTabBtn?.click();
    });

    // Find verify button for JAK.60
    const verifyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="verify-btn-JAK.60"]'
    );
    expect(verifyBtn).toBeTruthy();

    await act(async () => {
      verifyBtn?.click();
    });

    expect(dailyReportService.verifyDailyRouteReport).toHaveBeenCalledWith(
      1,
      '2026-09-02',
      'korlap@example.com'
    );
  });

  it('navigates to WhatsApp Report Studio tab via bottom nav', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    const waTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-wa_report"]'
    );
    expect(waTabBtn).toBeTruthy();

    await act(async () => {
      waTabBtn?.click();
    });

    expect(container.textContent).toContain('Report Studio WhatsApp');
    expect(container.textContent).toContain('Format 1 (Wilayah Lengkap)');
  });

  it('updates selected date and calls onDateChange when step buttons are clicked', async () => {
    const onDateChange = vi.fn();
    await act(async () => {
      root.render(
        <AllRouteMonitoringPage
          currentDate="2026-09-02"
          onDateChange={onDateChange}
        />
      );
    });

    expect(container.textContent).toContain('2 September 2026');

    // Find next day button
    const nextBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.title === 'Hari Berikutnya'
    );
    expect(nextBtn).toBeDefined();

    await act(async () => {
      nextBtn?.click();
    });

    expect(container.textContent).toContain('3 September 2026');
    expect(onDateChange).toHaveBeenCalledWith('2026-09-03');

    // Find previous day button
    const prevBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.title === 'Hari Sebelumnya'
    );
    expect(prevBtn).toBeDefined();

    await act(async () => {
      prevBtn?.click();
    });

    expect(container.textContent).toContain('2 September 2026');
    expect(onDateChange).toHaveBeenCalledWith('2026-09-02');
  });

  it('triggers 18 routes direct ingestion when Tarik 18 Rute (Load All) button is clicked', async () => {
    (regionalIngestionService.ingestRegionalRouteSummaries as any).mockResolvedValue({
      success: true,
      syncedFromSheet: 10,
      skippedFromApp: 8,
      errors: [],
    });

    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    const syncBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-load-all-btn"]'
    );
    expect(syncBtn).toBeTruthy();

    await act(async () => {
      syncBtn?.click();
    });

    expect(regionalIngestionService.ingestRegionalRouteSummaries).toHaveBeenCalledWith(
      '2026-09-02',
      expect.any(Function)
    );
  });

  it('displays data provenance badges (Input App vs Tarik Sheet) on route cards', async () => {
    await act(async () => {
      root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />);
    });

    const routesTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-routes"]'
    );
    await act(async () => {
      routesTabBtn?.click();
    });

    expect(container.textContent).toContain(TEXT_MONITORING.PROVENANCE.APP_INPUT);
    expect(container.textContent).toContain(TEXT_MONITORING.PROVENANCE.SHEET_SYNC);
  });
});
