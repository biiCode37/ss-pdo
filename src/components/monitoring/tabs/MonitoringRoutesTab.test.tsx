// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringRoutesTab } from "@/components/monitoring/tabs/MonitoringRoutesTab";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/utils/alertUtils", () => ({
  showToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn(),
  showErrorAlert: vi.fn(),
  showConfirmDialog: vi.fn().mockResolvedValue(true),
}));

const mockRouteItems: RegionalRouteItem[] = [
  {
    id: 1,
    reportId: 101,
    routeCode: "JAK.01",
    routeName: "Tanjung Priok - Plumpang",
    operatorName: "Mayasari Bakti",
    isLooping: false,
    kmBaku: 180,
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
    totalTrips: 120,
    toaShift1: 1200,
    manualShift1: 0,
    totalShift1: 1200,
    toaShift2: 950,
    manualShift2: 0,
    totalShift2: 950,
  },
  {
    id: 2,
    reportId: 102,
    routeCode: "JAK.02",
    routeName: "Kampung Rambutan - Duren Sawit",
    operatorName: "Bianglala",
    isLooping: false,
    kmBaku: 200,
    targetHk: 2200,
    bestRecord: 2600,
    supervisorName: "Abdul Manan",
    defaultRenops: 12,
    renopsShift1: 12,
    realopsShift1: 12,
    renopsShift2: 12,
    realopsShift2: 12,
    totalRenops: 12,
    totalRealops: 12,
    headwayFastest: 4,
    headwaySlowest: 9,
    trafficJamSpots: [],
    operationalIssues: "",
    status: "verified",
    todayPassengers: 2400,
    yesterdayPassengers: 2300,
    lastWeekPassengers: 2200,
    totalKm: 2400,
    achievementKm: 200,
    totalTrips: 144,
    toaShift1: 1300,
    manualShift1: 0,
    totalShift1: 1300,
    toaShift2: 1100,
    manualShift2: 0,
    totalShift2: 1100,
  },
  {
    id: 3,
    reportId: 103,
    routeCode: "JAK.03",
    routeName: "Lebak Bulus - Andara",
    operatorName: "Kopaja",
    isLooping: false,
    kmBaku: 150,
    targetHk: 1800,
    bestRecord: 2100,
    supervisorName: "Moamar Z.A. Mahu",
    defaultRenops: 8,
    renopsShift1: 8,
    realopsShift1: 8,
    renopsShift2: 8,
    realopsShift2: 8,
    totalRenops: 8,
    totalRealops: 8,
    headwayFastest: 5,
    headwaySlowest: 10,
    trafficJamSpots: [],
    operationalIssues: "",
    status: "draft",
    todayPassengers: 1500,
    yesterdayPassengers: 1400,
    lastWeekPassengers: 1450,
    totalKm: 1200,
    achievementKm: 150,
    totalTrips: 96,
    toaShift1: 800,
    manualShift1: 0,
    totalShift1: 800,
    toaShift2: 700,
    manualShift2: 0,
    totalShift2: 700,
  },
];

describe("MonitoringRoutesTab Component", () => {
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

  it("renders routes list and search toolbar", async () => {
    await act(async () => {
      root.render(
        <MonitoringRoutesTab
          routes={mockRouteItems}
          onVerifyRoute={vi.fn()}
          onBulkVerify={vi.fn()}
          onSelectRoute={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("JAK.02");
    expect(container.textContent).toContain("JAK.03");
  });

  it("filters routes by search term", async () => {
    await act(async () => {
      root.render(
        <MonitoringRoutesTab
          routes={mockRouteItems}
          onVerifyRoute={vi.fn()}
          onBulkVerify={vi.fn()}
          onSelectRoute={vi.fn()}
        />
      );
    });

    const searchInput = container.querySelector<HTMLInputElement>(
      'input[data-testid="routes-search-input"]'
    );
    expect(searchInput).toBeTruthy();

    await act(async () => {
      if (searchInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeInputValueSetter?.call(searchInput, "JAK.01");
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).not.toContain("JAK.02");
    expect(container.textContent).not.toContain("JAK.03");
  });

  it("triggers onVerifyRoute when verify button on card is clicked", async () => {
    const onVerifyRoute = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRoutesTab
          routes={mockRouteItems}
          onVerifyRoute={onVerifyRoute}
          onBulkVerify={vi.fn()}
          onSelectRoute={vi.fn()}
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

    expect(onVerifyRoute).toHaveBeenCalledWith(1, "verified");
  });

  it("triggers onSelectRoute when open route button is clicked", async () => {
    const onSelectRoute = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringRoutesTab
          routes={mockRouteItems}
          onVerifyRoute={vi.fn()}
          onBulkVerify={vi.fn()}
          onSelectRoute={onSelectRoute}
        />
      );
    });

    const openRouteBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="open-route-JAK.01"]'
    );
    expect(openRouteBtn).toBeTruthy();

    act(() => {
      openRouteBtn?.click();
    });

    expect(onSelectRoute).toHaveBeenCalledWith("JAK.01");
  });

  it("triggers bulk verify when bulk verify button is clicked", async () => {
    const onBulkVerify = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <MonitoringRoutesTab
          routes={mockRouteItems}
          onVerifyRoute={vi.fn()}
          onBulkVerify={onBulkVerify}
          onSelectRoute={vi.fn()}
        />
      );
    });

    const bulkBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="bulk-verify-btn"]'
    );
    expect(bulkBtn).toBeTruthy();

    await act(async () => {
      bulkBtn?.click();
    });

    expect(onBulkVerify).toHaveBeenCalled();
  });
});
