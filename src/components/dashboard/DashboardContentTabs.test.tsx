// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DashboardContentTabs } from "./DashboardContentTabs";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/components/BusList", () => ({
  BusList: () => <div data-testid="mock-bus-list">Mock BusList</div>,
}));

vi.mock("@/components/AnalyticsDashboard", () => ({
  AnalyticsDashboard: () => <div data-testid="mock-analytics-dashboard">Mock Analytics</div>,
}));

vi.mock("@/components/UnitSummaryDashboard", () => ({
  UnitSummaryDashboard: () => <div data-testid="mock-unit-summary">Mock Unit Summary</div>,
}));

vi.mock("@/components/plotting", () => ({
  DailyPlottingPage: () => <div data-testid="mock-daily-plotting">Mock Daily Plotting</div>,
}));

vi.mock("@/components/SwipeableContainer", () => ({
  SwipeableContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/context/PageAccessContext", () => ({
  usePageAccess: () => ({
    canAccessPage: () => true,
    isUnderMaintenance: () => false,
  }),
}));

vi.mock("@/utils/roleStorage", () => ({
  getStoredUserRole: () => "admin",
}));

describe("DashboardContentTabs Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    mainTab: "input" as const,
    onSwipeNext: vi.fn(),
    onSwipePrev: vi.fn(),
    busData: [],
    headerMap: {},
    currentSheetId: "test-sheet",
    currentTabName: "25",
    queue: [],
    addToQueue: vi.fn(),
    isLoading: false,
    onUpdateBus: vi.fn(),
    accRangeDetails: null,
    onExitAccumulation: vi.fn(),
    isShiftConfirmed: false,
    activeShift: 1 as const,
    sheetSummary: {},
    selectedTab: "25",
    refreshKey: 1,
    sheetUrl: "https://docs.google.com/spreadsheets/d/test",
    activeMonth: 10,
    activeYear: 2026,
    onSelectTab: vi.fn().mockResolvedValue(undefined),
    onSelectUnit: vi.fn(),
    missingColumns: ["KODE BUS", "NAMA DRIVER"],
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

  it("does not render duplicate missing columns warning card in Tab 1 even when missingColumns is non-empty", () => {
    act(() => {
      root.render(<DashboardContentTabs {...defaultProps} missingColumns={["KODE BUS", "NAMA DRIVER"]} />);
    });

    // Peringatan kolom tidak boleh dirender di tab ini karena sudah ditangani secara terpusat oleh DashboardStatusBanners
    expect(container.textContent).not.toContain(TEXT_DASHBOARD.MISSING_COLS_TITLE);
    expect(container.textContent).not.toContain("KODE BUS");
    expect(container.querySelector('[data-testid="mock-bus-list"]')).toBeTruthy();
  });

  it("renders mock-bus-list when on input tab", () => {
    act(() => {
      root.render(<DashboardContentTabs {...defaultProps} mainTab="input" />);
    });

    expect(container.querySelector('[data-testid="mock-bus-list"]')).toBeTruthy();
  });
});
