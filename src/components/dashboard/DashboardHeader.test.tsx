// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DashboardHeader } from "./DashboardHeader";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("DashboardHeader Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    headerBlockRef: { current: null },
    onOpenProfile: vi.fn(),
    activeRouteCode: "JAK.60",
    onOpenRouteSelector: vi.fn(),
    queue: [],
    onOpenQueue: vi.fn(),
    sheetUrl: "https://docs.google.com/spreadsheets/d/abc",
    setSheetUrl: vi.fn(),
    selectedTab: "25",
    setSelectedTab: vi.fn(),
    days: ["24", "25", "26"],
    isLoading: false,
    isDataLoaded: true,
    currentSheetId: "abc",
    currentTabName: "25",
    onLoadData: vi.fn().mockResolvedValue(undefined),
    accRange: null,
    onExitAccumulation: vi.fn().mockResolvedValue(undefined),
    reportRoute: null,
    reportStatus: "draft" as const,
    confirmedShifts: { 1: false, 2: false },
    onOpenReportModal: vi.fn(),
    onRouteCodeChange: vi.fn(),
    routeSelectorOpenTrigger: 0,
  };

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

  it("renders active route badge and does not render back-to-monitoring button when onBackToMonitoring is undefined (PDO role)", () => {
    act(() => {
      root.render(<DashboardHeader {...defaultProps} />);
    });

    const routeBadge = container.querySelector('[data-testid="active-route-badge-btn"]');
    expect(routeBadge).toBeTruthy();
    expect(routeBadge?.textContent).toContain("JAK.60");

    const backBtn = container.querySelector('[data-testid="back-to-monitoring-btn"]');
    expect(backBtn).toBeNull();
  });

  it("renders back-to-monitoring button when onBackToMonitoring is provided (non-PDO roles)", () => {
    const onBackToMonitoring = vi.fn();

    act(() => {
      root.render(
        <DashboardHeader
          {...defaultProps}
          onBackToMonitoring={onBackToMonitoring}
        />
      );
    });

    const backBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="back-to-monitoring-btn"]'
    );
    expect(backBtn).toBeTruthy();
    expect(backBtn?.textContent).toContain(
      TEXT_DASHBOARD.SWITCHER.REGIONAL_MONITORING
    );

    act(() => {
      backBtn?.click();
    });

    expect(onBackToMonitoring).toHaveBeenCalledTimes(1);
  });
});
