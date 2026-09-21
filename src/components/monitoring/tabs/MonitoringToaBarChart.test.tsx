// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringToaBarChart } from "./MonitoringToaBarChart";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockRoute = (code: string, toa1: number, toa2: number): RegionalRouteItem => ({
  id: 1,
  routeCode: code,
  routeName: `Rute ${code}`,
  operatorName: "MB",
  isLooping: false,
  kmBaku: 100,
  targetHk: 2000,
  bestRecord: 2500,
  supervisorName: "Pengawas",
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
  todayPassengers: toa1 + toa2,
  yesterdayPassengers: 0,
  lastWeekPassengers: 0,
  totalKm: 1000,
  achievementKm: 100,
  totalTrips: 100,
  toaShift1: toa1,
  manualShift1: 0,
  totalShift1: toa1,
  toaShift2: toa2,
  manualShift2: 0,
  totalShift2: toa2,
});

describe("MonitoringToaBarChart Component", () => {
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
  });

  it("renders 18 route bars in a single frame without 'JAK.' or 'J.' prefix in labels", async () => {
    const mock18Routes: RegionalRouteItem[] = [
      createMockRoute("JAK.01", 600, 500),
      createMockRoute("JAK 02", 400, 300),
      createMockRoute("JAK.05", 800, 700),
      createMockRoute("J.10", 300, 200),
      createMockRoute("JAK 110A", 1200, 1100),
      createMockRoute("JAK 112", 0, 0),
      createMockRoute("JAK.113", 500, 400),
      createMockRoute("JAK 115", 900, 800),
      createMockRoute("JAK 117", 450, 450),
      createMockRoute("JAK.118", 600, 600),
      createMockRoute("JAK 120", 700, 700),
      createMockRoute("JAK 77", 200, 200),
      createMockRoute("JAK 88", 350, 350),
      createMockRoute("JAK 89", 400, 400),
      createMockRoute("JAK 90", 550, 550),
      createMockRoute("JAK 60", 650, 650),
      createMockRoute("JAK 61", 750, 750),
      createMockRoute("JAK 71", 850, 850),
    ];

    await act(async () => {
      root.render(<MonitoringToaBarChart routes={mock18Routes} />);
    });

    // Periksa judul grafik
    expect(container.textContent).toContain(TEXT_MONITORING.DASHBOARD.CHART_TITLE);

    // Periksa ke-18 batang rute ter-render
    const allBars = container.querySelectorAll("[data-testid^='toa-bar-']");
    expect(allBars.length).toBe(18);

    // Periksa label rute: Tidak boleh ada 'JAK.' ataupun awalan 'J.'
    // Contoh 'JAK.01' -> '01', 'JAK 02' -> '02', 'JAK 110A' -> '110A', 'J.10' -> '10'
    const bar01 = container.querySelector("[data-testid='toa-bar-JAK.01']");
    expect(bar01).not.toBeNull();
    expect(bar01?.textContent).toContain("01");
    expect(bar01?.textContent).not.toContain("JAK.01");

    const bar110A = container.querySelector("[data-testid='toa-bar-JAK 110A']");
    expect(bar110A).not.toBeNull();
    expect(bar110A?.textContent).toContain("110A");
    expect(bar110A?.textContent).not.toContain("JAK");

    // Periksa format k untuk nilai >= 1000: 1200 + 1100 = 2300 -> 2.3k
    expect(bar110A?.textContent).toContain("2.3k");

    // Periksa nilai 0 menampilkan '-'
    const bar112 = container.querySelector("[data-testid='toa-bar-JAK 112']");
    expect(bar112?.textContent).toContain("-");

    // Periksa container bar chart memiliki overflow: hidden dan width 100% (zero horizontal scroll)
    const chartContainer = container.querySelector(".no-scrollbar") as HTMLDivElement;
    expect(chartContainer).not.toBeNull();
    expect(chartContainer.style.overflow).toBe("hidden");
    expect(chartContainer.style.width).toBe("100%");
  });

  it("toggles route detail tooltip when clicking a bar", async () => {
    const mockRoutes = [
      createMockRoute("JAK.01", 600, 500),
      createMockRoute("JAK.02", 400, 300),
    ];

    await act(async () => {
      root.render(<MonitoringToaBarChart routes={mockRoutes} />);
    });

    // Tooltip belum ada
    expect(container.querySelector("[data-testid='toa-chart-tooltip']")).toBeNull();

    // Klik batang pertama (JAK.01)
    const bar01 = container.querySelector("[data-testid='toa-bar-JAK.01']") as HTMLDivElement;
    await act(async () => {
      bar01.click();
    });

    // Tooltip muncul
    const tooltip = container.querySelector("[data-testid='toa-chart-tooltip']");
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain("JAK.01");
    expect(tooltip?.textContent).toContain(TEXT_MONITORING.DASHBOARD.CHART_TOA_UNIT);
    expect(tooltip?.textContent).toContain("TOA Shift 1: 600");
    expect(tooltip?.textContent).toContain("Shift 2: 500");

    // Klik lagi untuk menutup
    await act(async () => {
      bar01.click();
    });
    expect(container.querySelector("[data-testid='toa-chart-tooltip']")).toBeNull();
  });
});
