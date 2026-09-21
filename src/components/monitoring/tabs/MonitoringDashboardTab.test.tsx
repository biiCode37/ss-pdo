// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringDashboardTab } from "@/components/monitoring/tabs/MonitoringDashboardTab";
import type { RegionalMonitoringResult, RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockRoute = (code: string, todayPassengers: number, targetHk: number): RegionalRouteItem => ({
  id: Number(code.replace(/\D/g, "")) || 1,
  routeCode: code,
  routeName: `Lintas ${code}`,
  operatorName: "Mayasari Bakti",
  isLooping: false,
  kmBaku: 180,
  targetHk,
  bestRecord: 2500,
  supervisorName: "Ranto Lumban Toruan",
  defaultRenops: 10,
  renopsShift1: 10,
  realopsShift1: 10,
  renopsShift2: 10,
  realopsShift2: 10,
  totalRenops: 10,
  totalRealops: 10,
  headwayFastest: 3,
  headwaySlowest: 8,
  trafficJamSpots: [],
  operationalIssues: "",
  status: "verified",
  todayPassengers,
  yesterdayPassengers: todayPassengers - 100,
  lastWeekPassengers: todayPassengers - 50,
  totalKm: 1800,
  achievementKm: 180,
  totalTrips: 120,
  toaShift1: Math.round(todayPassengers * 0.55),
  manualShift1: 0,
  totalShift1: Math.round(todayPassengers * 0.55),
  toaShift2: Math.round(todayPassengers * 0.45),
  manualShift2: 0,
  totalShift2: Math.round(todayPassengers * 0.45),
});

const mockRoutes: RegionalRouteItem[] = Array.from({ length: 18 }, (_, i) => {
  const code = `JAK.${String(i + 1).padStart(2, "0")}`;
  const passengers = 1000 + i * 150;
  const target = 2000;
  return createMockRoute(code, passengers, target);
});

const mockData: RegionalMonitoringResult = {
  date: "2026-09-21",
  yesterdayDate: "2026-09-20",
  lastWeekDate: "2026-09-14",
  routes: mockRoutes,
  totalRenops: 180,
  totalRealops: 180,
  totalTodayPassengers: 35000,
  totalTargetPassengers: 36000,
  totalYesterdayPassengers: 33000,
  totalLastWeekPassengers: 34000,
  totalKm: 32400,
  averageKmPerBus: 180,
  totalTrips: 2160,
  averageTripsPerBus: 12,
  tomShift1: 19250,
  manualShift1: 0,
  totalShift1: 19250,
  yesterdayShift1: 18000,
  lastWeekShift1: 18500,
  tomShift2: 15750,
  manualShift2: 0,
  totalShift2: 15750,
  yesterdayShift2: 15000,
  lastWeekShift2: 15500,
  submittedCount: 2,
  verifiedCount: 16,
  draftCount: 0,
  emptyCount: 0,
  totalRoutesCount: 18,
};

describe("MonitoringDashboardTab Component", () => {
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

  it("renders PDO fleet confirmation progress bar", async () => {
    await act(async () => {
      root.render(
        <MonitoringDashboardTab
          data={mockData}
          confirmedRoutesCount={14}
          totalRoutesCount={18}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.PROGRESS_TITLE);
    expect(container.textContent).toContain("14 / 18");
  });

  it("renders 18-bar TOA chart and handles bar interaction", async () => {
    await act(async () => {
      root.render(
        <MonitoringDashboardTab
          data={mockData}
          confirmedRoutesCount={18}
          totalRoutesCount={18}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.CHART_TITLE);
    // Should render JAK.01 and JAK.18
    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("JAK.18");

    // Bar click interaction
    const barEl = container.querySelector('[data-testid="toa-bar-JAK.01"]');
    expect(barEl).toBeTruthy();

    act(() => {
      (barEl as HTMLElement).click();
    });

    // Tooltip or breakdown should appear
    const tooltip = container.querySelector('[data-testid="toa-chart-tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain("JAK.01");
  });

  it("renders 4 Hero Macro KPI cards", async () => {
    await act(async () => {
      root.render(
        <MonitoringDashboardTab
          data={mockData}
          confirmedRoutesCount={18}
          totalRoutesCount={18}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PASSENGERS);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.MACRO_KPIS.TRIPS);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.MACRO_KPIS.DISTANCE);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PRODUCTIVITY);
  });

  it("renders Shift Split Bar with Shift 1 & Shift 2 ratio", async () => {
    await act(async () => {
      root.render(
        <MonitoringDashboardTab
          data={mockData}
          confirmedRoutesCount={18}
          totalRoutesCount={18}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.TITLE);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_1);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.SHIFT_SPLIT.SHIFT_2);
  });

  it("renders Leaderboard with Top 3 & Bottom 3 routes", async () => {
    await act(async () => {
      root.render(
        <MonitoringDashboardTab
          data={mockData}
          confirmedRoutesCount={18}
          totalRoutesCount={18}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.LEADERBOARD.TITLE);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.LEADERBOARD.TOP_3);
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.LEADERBOARD.BOTTOM_3);
  });
});
