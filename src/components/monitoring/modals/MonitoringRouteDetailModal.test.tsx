// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRouteDetailModal } from "@/components/monitoring/modals/MonitoringRouteDetailModal";
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
  targetPaxPerKm: 1.11,
  paxPerKmPercentage: 107.2,
};

describe("MonitoringRouteDetailModal", () => {
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

  it("does not render when isOpen is false or route is null", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={false}
          onClose={vi.fn()}
        />
      );
    });
    expect(container.innerHTML).toBe("");

    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={null}
          isOpen={true}
          onClose={vi.fn()}
        />
      );
    });
    expect(container.innerHTML).toBe("");
  });

  it("renders route title, korlap, and tab Operasional by default", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={vi.fn()}
          onSelectRoute={vi.fn()}
          onVerifyRoute={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("Detail Operasional Rute JAK.01");
    expect(container.textContent).toContain("Ranto Lumban Toruan");
    expect(container.textContent).toContain("Operasional");
    expect(container.textContent).toContain("1.800"); // Total KM Tempuh
    expect(container.textContent).toContain("180"); // KM / Bus
  });

  it("switches to Pelanggan & Shift and Produktivitas & Rit tabs on click", async () => {
    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={vi.fn()}
        />
      );
    });

    // Tab Shift
    const shiftTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="tab-shift"]'
    );
    expect(shiftTabBtn).toBeTruthy();

    await act(async () => {
      shiftTabBtn?.click();
    });

    expect(container.textContent).toContain("Rincian Shift 1 (Pagi)");
    expect(container.textContent).toContain("1.200"); // TOA S1
    expect(container.textContent).toContain("50"); // Manual S1
    expect(container.textContent).toContain("1.250"); // Total S1

    // Tab Produktivitas
    const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="tab-produktivitas"]'
    );
    expect(ritaseTabBtn).toBeTruthy();

    await act(async () => {
      ritaseTabBtn?.click();
    });

    expect(container.textContent).toContain("Total Ritase (PP)");
    expect(container.textContent).toContain("KM Baku (per 1 Rit PP)");
  });

  it("triggers onSelectRoute and onVerifyRoute from modal actions", async () => {
    const onSelectRoute = vi.fn();
    const onVerifyRoute = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRouteDetailModal
          route={mockRoute}
          isOpen={true}
          onClose={onClose}
          onSelectRoute={onSelectRoute}
          onVerifyRoute={onVerifyRoute}
        />
      );
    });

    const openSheetBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="modal-btn-open-sheet"]'
    );
    expect(openSheetBtn).toBeTruthy();
    act(() => {
      openSheetBtn?.click();
    });
    expect(onSelectRoute).toHaveBeenCalledWith("JAK.01");

    const verifyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="modal-btn-verify"]'
    );
    expect(verifyBtn).toBeTruthy();
    act(() => {
      verifyBtn?.click();
    });
    expect(onVerifyRoute).toHaveBeenCalledWith(1, "verified");

    const closeBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="modal-btn-close"]'
    );
    expect(closeBtn).toBeTruthy();
    act(() => {
      closeBtn?.click();
    });
    expect(onClose).toHaveBeenCalled();
  });
});
