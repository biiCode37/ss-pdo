// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  KorwilRouteDetailBottomSheet,
  type KorwilRouteDetailBottomSheetProps,
} from "./KorwilRouteDetailBottomSheet";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("KorwilRouteDetailBottomSheet Component", () => {
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

  const mockRoute: RegionalRouteItem = {
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
    kmPerBus: 196.49,
    totalTrips: 396,
    totalRitasePp: 198,
    ritasePerBus: 5.8,
    toaShift1: 3078,
    manualShift1: 0,
    totalShift1: 3078,
    toaShift2: 1863,
    manualShift2: 356,
    totalShift2: 2219,
    targetPassengersPerKm: 1.5,
    passengersPerKm: 0.793,
    passengersPerKmPercentage: 52.86,
    passengersPerBus: 156,
  };

  const renderSheet = async (props?: Partial<KorwilRouteDetailBottomSheetProps>) => {
    const defaultProps: KorwilRouteDetailBottomSheetProps = {
      route: mockRoute,
      isOpen: true,
      onClose: vi.fn(),
      onSelectRoute: vi.fn(),
      ...props,
    };

    await act(async () => {
      root.render(<KorwilRouteDetailBottomSheet {...defaultProps} />);
    });

    return defaultProps;
  };

  it("does not render when isOpen is false", async () => {
    await renderSheet({ isOpen: false });
    expect(container.querySelector('[data-testid="korwil-route-detail-bottom-sheet"]')).toBeNull();
  });

  it("does not render when route is null", async () => {
    await renderSheet({ route: null });
    expect(container.querySelector('[data-testid="korwil-route-detail-bottom-sheet"]')).toBeNull();
  });

  it("renders all 22 metrics across 4 card groups and hero record badge", async () => {
    await renderSheet();

    // 1. Header & Hero Record
    expect(container.textContent).toContain("JAK.60");
    expect(container.textContent).toContain("Kelapa Gading - Rusun");
    expect(container.textContent).toContain("Ranto Lumban Toruan");
    expect(container.textContent).toContain(TEXT_MONITORING.KORWIL_ROUTE_SHEET.RECORD_BADGE);
    expect(container.textContent).toContain("7.000"); // best record
    expect(container.textContent).toContain("Kamis, 01 Oktober 2026"); // best record date
    const dateEl = container.querySelector('[data-testid="korwil-sheet-record-date"]');
    expect(dateEl).toBeTruthy();
    expect(dateEl?.textContent).toContain("Kamis, 01 Oktober 2026");
    expect(dateEl?.textContent).not.toContain("Tercapai");

    // 2. Kesiapan Armada (Renops, Realops, Fleet ratio)
    expect(container.textContent).toContain("35"); // Renops
    expect(container.textContent).toContain("34"); // Realops
    expect(container.textContent).toContain("97,1%"); // Fleet ratio (34/35)

    // 3. Rincian Shift 1 & 2
    expect(container.textContent).toContain("3.078"); // Shift 1 TOA & Total
    expect(container.textContent).toContain("1.863"); // Shift 2 TOA
    expect(container.textContent).toContain("356"); // Shift 2 Manual
    expect(container.textContent).toContain("2.219"); // Shift 2 Total
    expect(container.textContent).toContain("5.297"); // Total Pax
    expect(container.textContent).toContain("6.853"); // Target Pax

    // 4. Jarak & Ritase PP
    expect(container.textContent).toContain("6.680,52"); // KM Tempuh
    expect(container.textContent).toContain("196,49"); // KM/bus
    expect(container.textContent).toContain("198"); // Total Ritase PP
    expect(container.textContent).toContain("5,8"); // Ritase/bus

    // 5. Rasio Efisiensi & Produktivitas
    expect(container.textContent).toContain("0,793"); // Pax/KM
    expect(container.textContent).toContain("1,5"); // Target Pax/KM
    expect(container.textContent).toContain("156"); // Pax/bus
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    await renderSheet({ onClose });

    const closeBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="korwil-sheet-close-btn"]'
    );
    expect(closeBtn).toBeTruthy();

    await act(async () => {
      closeBtn?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when dismiss button in footer is clicked", async () => {
    const onClose = vi.fn();
    await renderSheet({ onClose });

    const dismissBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="korwil-sheet-dismiss-btn"]'
    );
    expect(dismissBtn).toBeTruthy();

    await act(async () => {
      dismissBtn?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectRoute and onClose when open dashboard button is clicked", async () => {
    const onClose = vi.fn();
    const onSelectRoute = vi.fn();
    await renderSheet({ onClose, onSelectRoute });

    const openDashboardBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="korwil-sheet-open-dashboard-btn"]'
    );
    expect(openDashboardBtn).toBeTruthy();

    await act(async () => {
      openDashboardBtn?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelectRoute).toHaveBeenCalledWith("JAK.60");
  });
});
