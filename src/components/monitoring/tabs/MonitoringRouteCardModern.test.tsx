// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRouteCardModern } from "@/components/monitoring/tabs/MonitoringRouteCardModern";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockRoute: RegionalRouteItem = {
  id: 1,
  reportId: 101,
  routeCode: "JAK.01",
  routeName: "Tanjung Priok - Plumpang",
  operatorName: "Mayasari Bakti",
  isLooping: false,
  kmBaku: 18,
  targetHk: 2000,
  bestRecord: 2500,
  supervisorName: "Ranto Lumban Toruan",
  defaultRenops: 10,
  renopsShift1: 10,
  realopsShift1: 10,
  renopsShift2: 10,
  realopsShift2: 9,
  totalRenops: 10,
  totalRealops: 10,
  headwayFastest: 3,
  headwaySlowest: 8,
  trafficJamSpots: [],
  operationalIssues: "",
  status: "submitted",
  todayPassengers: 2150,
  yesterdayPassengers: 2000,
  lastWeekPassengers: 1950,
  totalKm: 1800,
  achievementKm: 180,
  totalTrips: 100,
  toaShift1: 1200,
  manualShift1: 50,
  totalShift1: 1250,
  toaShift2: 850,
  manualShift2: 50,
  totalShift2: 900,
  targetPax: 2000,
  paxPercentage: 107.5,
  kmPerBus: 180,
  paxPerKm: 1.19,
  ritasePerBus: 10,
  paxPerBus: 215,
};

describe("MonitoringRouteCardModern", () => {
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

  it("renders priority metrics: Renops, Realops, Total Pelanggan, TOA, Manual, KM/Bus, %, H-1, H-7", async () => {
    await act(async () => {
      root.render(<MonitoringRouteCardModern route={mockRoute} />);
    });

    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("10/10"); // Realops / Renops
    expect(container.textContent).toContain("2.150"); // Total Pelanggan
    expect(container.textContent).toContain("TOA: 2.050"); // TOA S1+S2 (1200 + 850)
    expect(container.textContent).toContain("Man: 100"); // Manual S1+S2 (50 + 50)
    expect(container.textContent).toContain("180"); // KM/Bus
    expect(container.textContent).toContain("107.5%"); // Capaian
    expect(container.textContent).toContain("H-1: 2.000"); // Kemarin
    expect(container.textContent).toContain("H-7: 1.950"); // Minggu Lalu
  });

  it("triggers onCardClick when the card is clicked", async () => {
    const onCardClick = vi.fn();
    await act(async () => {
      root.render(
        <MonitoringRouteCardModern
          route={mockRoute}
          onCardClick={onCardClick}
        />
      );
    });

    const card = container.querySelector<HTMLDivElement>(
      '[data-testid="route-card-JAK.01"]'
    );
    expect(card).toBeTruthy();

    act(() => {
      card?.click();
    });
    expect(onCardClick).toHaveBeenCalledWith(mockRoute);
  });

  it("triggers onVerify without triggering onCardClick (stopPropagation)", async () => {
    const onCardClick = vi.fn();
    const onVerify = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRouteCardModern
          route={mockRoute}
          onCardClick={onCardClick}
          onVerify={onVerify}
        />
      );
    });

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="verify-btn-JAK.01"]'
    );
    expect(verifyBtn).toBeTruthy();

    act(() => {
      verifyBtn?.click();
    });
    expect(onVerify).toHaveBeenCalledWith(1, "verified");
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
