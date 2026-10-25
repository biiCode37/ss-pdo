// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  MonitoringKorwilTab,
  type MonitoringKorwilTabProps,
} from "@/components/monitoring/tabs/MonitoringKorwilTab";
import { TEXT_MONITORING } from "@/constants/texts";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("MonitoringKorwilTab Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
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

  const mockData: RegionalMonitoringResult = {
    date: "2026-10-14",
    yesterdayDate: "2026-10-13",
    lastWeekDate: "2026-10-07",
    routes: [
      {
        id: 1,
        routeCode: "JAK.60",
        routeName: "Kelapa Gading - Rusun",
        operatorName: "Mikrotrans",
        isLooping: true,
        kmBaku: 33.74,
        targetHk: 6853,
        bestRecord: 7000,
        supervisorName: "Ranto Lumban Toruan",
        defaultRenops: 35,
        renopsShift1: 35,
        realopsShift1: 34,
        renopsShift2: 35,
        realopsShift2: 34,
        totalRenops: 35,
        totalRealops: 34,
        headwayFastest: 3,
        headwaySlowest: 10,
        trafficJamSpots: [],
        operationalIssues: "",
        status: "submitted",
        todayPassengers: 5297,
        yesterdayPassengers: 5000,
        lastWeekPassengers: 4800,
        totalKm: 6680.52,
        achievementKm: 196.49,
        totalTrips: 396,
        totalRitasePp: 198,
        toaShift1: 3078,
        manualShift1: 0,
        totalShift1: 3078,
        toaShift2: 1863,
        manualShift2: 356,
        totalShift2: 2219,
      },
      {
        id: 2,
        routeCode: "JAK.05",
        routeName: "Semper - Rorotan",
        operatorName: "Mikrotrans",
        isLooping: false,
        kmBaku: 30.897,
        targetHk: 7315,
        bestRecord: 7500,
        supervisorName: "Abdul Manan",
        defaultRenops: 33,
        renopsShift1: 33,
        realopsShift1: 33,
        renopsShift2: 33,
        realopsShift2: 33,
        totalRenops: 33,
        totalRealops: 33,
        headwayFastest: 3,
        headwaySlowest: 10,
        trafficJamSpots: [],
        operationalIssues: "",
        status: "submitted",
        todayPassengers: 6253,
        yesterdayPassengers: 6100,
        lastWeekPassengers: 5900,
        totalKm: 6390.97,
        achievementKm: 193.67,
        totalTrips: 414,
        totalRitasePp: 207,
        toaShift1: 2870,
        manualShift1: 95,
        totalShift1: 2965,
        toaShift2: 3104,
        manualShift2: 184,
        totalShift2: 3288,
      },
      {
        id: 3,
        routeCode: "JAK.01",
        routeName: "Tg Priok - Plumpang",
        operatorName: "Mikrotrans",
        isLooping: true,
        kmBaku: 14.415,
        targetHk: 5161,
        bestRecord: 5200,
        supervisorName: "Moamar Z.A. Mahu",
        defaultRenops: 20,
        renopsShift1: 20,
        realopsShift1: 20,
        renopsShift2: 20,
        realopsShift2: 20,
        totalRenops: 20,
        totalRealops: 20,
        headwayFastest: 2,
        headwaySlowest: 8,
        trafficJamSpots: [],
        operationalIssues: "",
        status: "submitted",
        todayPassengers: 5056,
        yesterdayPassengers: 4900,
        lastWeekPassengers: 4700,
        totalKm: 3791.76,
        achievementKm: 189.59,
        totalTrips: 526,
        totalRitasePp: 263,
        toaShift1: 2148,
        manualShift1: 25,
        totalShift1: 2173,
        toaShift2: 2883,
        manualShift2: 0,
        totalShift2: 2883,
      },
    ],
    supervisorSummaries: [
      {
        id: "RANTO",
        name: "Ranto Lumban Toruan",
        routes: [
          {
            id: 1,
            routeCode: "JAK.60",
            routeName: "Kelapa Gading - Rusun",
            operatorName: "Mikrotrans",
            isLooping: true,
            kmBaku: 33.74,
            targetHk: 6853,
            bestRecord: 7000,
            supervisorName: "Ranto Lumban Toruan",
            defaultRenops: 35,
            renopsShift1: 35,
            realopsShift1: 34,
            renopsShift2: 35,
            realopsShift2: 34,
            totalRenops: 35,
            totalRealops: 34,
            headwayFastest: 3,
            headwaySlowest: 10,
            trafficJamSpots: [],
            operationalIssues: "",
            status: "submitted",
            todayPassengers: 5297,
            yesterdayPassengers: 5000,
            lastWeekPassengers: 4800,
            totalKm: 6680.52,
            achievementKm: 196.49,
            totalTrips: 396,
            totalRitasePp: 198,
            toaShift1: 3078,
            manualShift1: 0,
            totalShift1: 3078,
            toaShift2: 1863,
            manualShift2: 356,
            totalShift2: 2219,
          },
        ],
        totalRenops: 35,
        totalRealops: 34,
        totalKm: 6680.52,
        averageKmPerBus: 196.49,
        totalTodayPassengers: 5297,
        totalTargetPassengers: 6853,
        targetAchievementPercentage: 77.3,
        totalRitasePp: 198,
        averageRitasePerBus: 5.8,
        passengersPerKm: 0.79,
        passengersPerBus: 155.8,
      },
      {
        id: "ABDUL",
        name: "Abdul Manan",
        routes: [],
        totalRenops: 33,
        totalRealops: 33,
        totalKm: 6390.97,
        averageKmPerBus: 193.67,
        totalTodayPassengers: 6253,
        totalTargetPassengers: 7315,
        targetAchievementPercentage: 85.5,
        totalRitasePp: 207,
        averageRitasePerBus: 6.27,
        passengersPerKm: 0.98,
        passengersPerBus: 189.5,
      },
      {
        id: "MOAMAR",
        name: "Moamar Z.A. Mahu",
        routes: [],
        totalRenops: 20,
        totalRealops: 20,
        totalKm: 3791.76,
        averageKmPerBus: 189.59,
        totalTodayPassengers: 5056,
        totalTargetPassengers: 5161,
        targetAchievementPercentage: 98.0,
        totalRitasePp: 263,
        averageRitasePerBus: 13.15,
        passengersPerKm: 1.33,
        passengersPerBus: 252.8,
      },
    ],
    totalRenops: 88,
    totalRealops: 87,
    totalTodayPassengers: 16606,
    totalTargetPassengers: 19329,
    totalYesterdayPassengers: 16000,
    totalLastWeekPassengers: 15400,
    totalKm: 16863.25,
    averageKmPerBus: 193.83,
    totalTrips: 1336,
    averageTripsPerBus: 15.36,
    tomShift1: 8096,
    manualShift1: 120,
    totalShift1: 8216,
    yesterdayShift1: 0,
    lastWeekShift1: 0,
    tomShift2: 7850,
    manualShift2: 540,
    totalShift2: 8390,
    yesterdayShift2: 0,
    lastWeekShift2: 0,
    submittedCount: 3,
    verifiedCount: 0,
    draftCount: 0,
    emptyCount: 0,
    totalRoutesCount: 3,
  };

  const renderTab = async (props?: Partial<MonitoringKorwilTabProps>) => {
    const defaultProps: MonitoringKorwilTabProps = {
      data: mockData,
      onSelectRoute: vi.fn(),
      ...props,
    };

    await act(async () => {
      root.render(<MonitoringKorwilTab {...defaultProps} />);
    });

    return defaultProps;
  };

  it("renders regional total summary card and 3 supervisor cards", async () => {
    await renderTab();

    expect(container.textContent).toContain(
      TEXT_MONITORING.KORWIL_TAB.TOTAL_WILAYAH_CARD
    );
    expect(container.textContent).toContain("Ranto Lumban Toruan");
    expect(container.textContent).toContain("Abdul Manan");
    expect(container.textContent).toContain("Moamar Z.A. Mahu");

    // Check regional summary figures
    expect(container.textContent).toContain("16.606"); // Today passengers
    expect(container.textContent).toContain("87"); // Total realops
  });

  it("expands route list accordion, opens bottom sheet on row click, and triggers onSelectRoute from sheet", async () => {
    const onSelectRoute = vi.fn();
    await renderTab({ onSelectRoute });

    // Accordion toggle button for Ranto's team
    const toggleBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="toggle-routes-RANTO"]'
    );
    expect(toggleBtn).toBeTruthy();

    await act(async () => {
      toggleBtn?.click();
    });

    // The route JAK.60 should now be visible
    expect(container.textContent).toContain("JAK.60");
    expect(container.textContent).toContain("Kelapa Gading - Rusun");

    const routeRow = container.querySelector<HTMLDivElement>(
      '[data-testid="korwil-route-row-JAK.60"]'
    );
    expect(routeRow).toBeTruthy();

    // Click route row opens bottom sheet
    await act(async () => {
      routeRow?.click();
    });

    // Bottom sheet is now open
    const sheet = container.querySelector<HTMLDivElement>(
      '[data-testid="korwil-route-detail-bottom-sheet"]'
    );
    expect(sheet).toBeTruthy();
    expect(sheet?.textContent).toContain(TEXT_MONITORING.KORWIL_ROUTE_SHEET.RECORD_BADGE);
    expect(sheet?.textContent).toContain(TEXT_MONITORING.KORWIL_ROUTE_SHEET.SECTIONS.FLEET);
    expect(sheet?.textContent).toContain(TEXT_MONITORING.KORWIL_ROUTE_SHEET.SECTIONS.SHIFT_BREAKDOWN);

    // Click open dashboard button inside bottom sheet
    const openDashboardBtn = sheet?.querySelector<HTMLButtonElement>(
      '[data-testid="korwil-sheet-open-dashboard-btn"]'
    );
    expect(openDashboardBtn).toBeTruthy();

    await act(async () => {
      openDashboardBtn?.click();
    });

    expect(onSelectRoute).toHaveBeenCalledWith("JAK.60");

    // Sheet should now be closed
    expect(
      container.querySelector('[data-testid="korwil-route-detail-bottom-sheet"]')
    ).toBeNull();
  });

  it("renders empty state when supervisorSummaries is empty and no routes exist", async () => {
    const emptyData: RegionalMonitoringResult = {
      ...mockData,
      routes: [],
      supervisorSummaries: [],
      totalRoutesCount: 0,
      totalRealops: 0,
      totalTodayPassengers: 0,
    };

    await renderTab({ data: emptyData });
    expect(container.textContent).toContain(
      TEXT_MONITORING.KORWIL_TAB.EMPTY_TITLE
    );
  });
});
