// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringWaReportTab } from "./MonitoringWaReportTab";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { TEXT_WA_REPORT } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/utils/alertUtils", () => ({
  showToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn(),
  showErrorAlert: vi.fn(),
}));

const mockData: RegionalMonitoringResult = {
  date: "2026-09-21",
  yesterdayDate: "2026-09-20",
  lastWeekDate: "2026-09-14",
  routes: [
    {
      id: 1,
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
      realopsShift2: 10,
      totalRenops: 10,
      totalRealops: 10,
      headwayFastest: 3,
      headwaySlowest: 8,
      trafficJamSpots: [],
      operationalIssues: "",
      status: "verified",
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
  ],
  totalRenops: 10,
  totalRealops: 10,
  totalTodayPassengers: 2150,
  totalTargetPassengers: 2000,
  totalYesterdayPassengers: 2000,
  totalLastWeekPassengers: 1950,
  totalKm: 1800,
  averageKmPerBus: 180,
  totalTrips: 120,
  averageTripsPerBus: 12,
  tomShift1: 1200,
  manualShift1: 0,
  totalShift1: 1200,
  yesterdayShift1: 1100,
  lastWeekShift1: 1050,
  tomShift2: 950,
  manualShift2: 0,
  totalShift2: 950,
  yesterdayShift2: 900,
  lastWeekShift2: 900,
  submittedCount: 0,
  verifiedCount: 1,
  draftCount: 0,
  emptyCount: 0,
  totalRoutesCount: 1,
};

describe("MonitoringWaReportTab Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    // Mock navigator.clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
    // Mock window.open
    window.open = vi.fn();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders format tabs and live preview", async () => {
    await act(async () => {
      root.render(
        <MonitoringWaReportTab
          data={mockData}
          selectedDate="2026-09-21"
        />
      );
    });

    expect(container.textContent).toContain(TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_1);
    expect(container.textContent).toContain(TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_2);
    expect(container.textContent).toContain(TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_3);

    // Live preview contains route details
    const previewBox = container.querySelector('[data-testid="wa-preview-box"]');
    expect(previewBox).toBeTruthy();
    expect(previewBox?.textContent).toContain("JAK.01");
  });

  it("switches format to Format 2 and updates preview", async () => {
    await act(async () => {
      root.render(
        <MonitoringWaReportTab
          data={mockData}
          selectedDate="2026-09-21"
        />
      );
    });

    const format2Btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="format-tab-2"]'
    );
    expect(format2Btn).toBeTruthy();

    await act(async () => {
      format2Btn?.click();
    });

    const previewBox = container.querySelector('[data-testid="wa-preview-box"]');
    expect(previewBox?.textContent).toContain("SHIFT 1");
    expect(previewBox?.textContent).toContain("SHIFT 2");
  });

  it("copies report text to clipboard", async () => {
    await act(async () => {
      root.render(
        <MonitoringWaReportTab
          data={mockData}
          selectedDate="2026-09-21"
        />
      );
    });

    const copyBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="copy-wa-report-btn"]'
    );
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      copyBtn?.click();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("opens WhatsApp with report text", async () => {
    await act(async () => {
      root.render(
        <MonitoringWaReportTab
          data={mockData}
          selectedDate="2026-09-21"
        />
      );
    });

    const shareBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="send-wa-report-btn"]'
    );
    expect(shareBtn).toBeTruthy();

    await act(async () => {
      shareBtn?.click();
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank"
    );
  });
});
