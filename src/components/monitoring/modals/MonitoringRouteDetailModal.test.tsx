// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRouteDetailModal } from "./MonitoringRouteDetailModal";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function getMetricCardValue(container: HTMLElement, labelText: string): string | undefined {
  const allDivs = Array.from(container.querySelectorAll("div"));
  const labelDiv = allDivs.find((el) => el.textContent?.trim() === labelText);
  if (!labelDiv || !labelDiv.parentElement) return undefined;
  const valueDiv = labelDiv.nextElementSibling || labelDiv.parentElement.children[1];
  return valueDiv?.textContent?.trim().replace(/\s+/g, " ");
}

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

  describe("ritase metrics calculations and precision", () => {
    it("handles total ritase PP fallback: 101 trips -> 50.5 rit without rounding to 51", async () => {
      const routeWith101Trips: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 101,
        totalRitasePp: undefined,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWith101Trips}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      const cardValue = getMetricCardValue(
        container,
        TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
      );
      expect(cardValue).toBe("50.5 Rit");
    });

    it("handles total ritase PP fallback: 100 trips -> 50 rit, and 0 trips -> 0 rit", async () => {
      const routeWith100Trips: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 100,
        totalRitasePp: undefined,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWith100Trips}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      expect(
        getMetricCardValue(
          container,
          TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
        )
      ).toBe("50 Rit");

      const routeWith0Trips: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 0,
        totalRitasePp: undefined,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWith0Trips}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const zeroCardVal = getMetricCardValue(
        container,
        TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
      );
      // R85-01: Buktikan nilai tepat pada kartu adalah "0 Rit" dan membedakan dari hasil salah "50 Rit"
      expect(zeroCardVal).toBe("0 Rit");
      expect(zeroCardVal).not.toBe("50 Rit");
    });

    it("prioritizes explicit totalRitasePp over trips, including 0", async () => {
      const routeWithExplicitZero: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 100,
        totalRitasePp: 0,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWithExplicitZero}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      const explicitZeroCardVal = getMetricCardValue(
        container,
        TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
      );
      // R85-01: Nilai tepat kartu adalah "0 Rit", dan tes ini pasti gagal jika bernilai salah "50 Rit"
      expect(explicitZeroCardVal).toBe("0 Rit");
      expect(explicitZeroCardVal).not.toBe("50 Rit");

      const routeWithExplicitDecimal: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 100,
        totalRitasePp: 50.5,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWithExplicitDecimal}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      expect(
        getMetricCardValue(
          container,
          TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP
        )
      ).toBe("50.5 Rit");
    });

    it("calculates ritase per bus accurately without .toFixed(1) truncation: 50.5 / 10 bus -> 5.05 rit/Bus", async () => {
      const routeForCalc: RegionalRouteItem = {
        ...mockRoute,
        totalTrips: 101, // fallback totalRitasePp = 50.5
        totalRitasePp: undefined,
        totalRealops: 10,
        ritasePerBus: undefined,
        tripsPerBus: undefined,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeForCalc}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      // 50.5 / 10 = 5.05 rit/Bus (tepat pada kartu RITASE_BUS, tidak terpotong menjadi 5.1 atau 5)
      expect(
        getMetricCardValue(
          container,
          TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.RITASE_BUS
        )
      ).toBe("5.05 Rit/Bus");
    });

    it("prioritizes tripsPerBus / 2 (10.1 -> 5.05 rit/Bus) when ritasePerBus is undefined", async () => {
      const routeWithTripsPerBus: RegionalRouteItem = {
        ...mockRoute,
        ritasePerBus: undefined,
        tripsPerBus: 10.1,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWithTripsPerBus}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      expect(
        getMetricCardValue(
          container,
          TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.RITASE_BUS
        )
      ).toBe("5.05 Rit/Bus");
    });

    it("prioritizes explicit ritasePerBus 5.05 without truncation", async () => {
      const routeWithExplicitRitasePerBus: RegionalRouteItem = {
        ...mockRoute,
        ritasePerBus: 5.05,
        tripsPerBus: 20,
      };

      await act(async () => {
        root.render(
          <MonitoringRouteDetailModal
            route={routeWithExplicitRitasePerBus}
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      });

      const ritaseTabBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="tab-produktivitas"]'
      );
      await act(async () => {
        ritaseTabBtn?.click();
      });

      expect(
        getMetricCardValue(
          container,
          TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.RITASE_BUS
        )
      ).toBe("5.05 Rit/Bus");
    });
  });
});
