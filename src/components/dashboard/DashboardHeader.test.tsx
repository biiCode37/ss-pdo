// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DashboardHeader } from "./DashboardHeader";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { BusList } from "@/components/busList/BusList";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/services/routeService", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/routeService")>(),
  fetchRoutesWithSheets: vi.fn().mockResolvedValue([]),
}));

describe("DashboardHeader Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
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
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("--sticky-header-height");
  });

  it.each(["pdo", "superadmin"])("keeps Input SS controls inside the route/profile header for %s and removes them on tab switch", (role) => {
    localStorage.setItem("PDO_USER_ROLE", role);
    function Layout({ active = true }) {
      const [target, setTarget] = useState<HTMLDivElement | null>(null);
      return <>
        <DashboardHeader {...defaultProps} hideRouteControlBar={active}
          onBackToMonitoring={role === "superadmin" ? vi.fn() : undefined}
          inputControlsRef={setTarget} />
        <div style={{ display: active ? "block" : "none" }}>
          <BusList data={[]} sheetId="abc" tabName="25" headerMap={{}}
            syncQueue={[]} addToQueue={vi.fn()} headerTarget={active ? target : null}
            routeControlBar={<span data-testid="input-date">25 Oktober</span>} />
        </div>
      </>;
    }
    act(() => root.render(<Layout />));
    const header = container.querySelector(".sticky-top-block")!;
    expect(header.querySelector('[data-testid="active-route-badge-btn"]')).not.toBeNull();
    expect(header.querySelector('[data-testid="user-profile-header-btn"]')).not.toBeNull();
    expect(header.querySelector('[data-testid="input-date"]')).not.toBeNull();
    expect(header.querySelector(".search-input")).not.toBeNull();
    expect(header.textContent).toContain(TEXT_DASHBOARD.BUS_LIST.FILTER_BTN);
    expect(container.querySelectorAll(".search-input")).toHaveLength(1);

    act(() => root.render(<Layout active={false} />));
    expect(header.querySelector(".search-input")).toBeNull();
    expect(header.querySelector(".unified-route-control-bar")).not.toBeNull();
    act(() => root.render(<Layout />));
    expect(header.querySelectorAll(".search-input")).toHaveLength(1);
  });

  it("measures the header when it mounts after the regional view and clears the offset on unmount", () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(300);
    act(() => root.render(<div>Wilayah</div>));
    act(() => root.render(<DashboardHeader {...defaultProps} />));
    expect(document.documentElement.style.getPropertyValue("--sticky-header-height")).toBe("300px");
    act(() => root.render(<div>Wilayah</div>));
    expect(document.documentElement.style.getPropertyValue("--sticky-header-height")).toBe("");
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

  it("renders UnifiedRouteControlBar when hideRouteControlBar is false or undefined", () => {
    act(() => {
      root.render(<DashboardHeader {...defaultProps} hideRouteControlBar={false} />);
    });

    const controlBar = container.querySelector(".unified-route-control-bar");
    expect(controlBar).toBeTruthy();
  });

  it("does not render UnifiedRouteControlBar when hideRouteControlBar is true (e.g. input tab active)", () => {
    act(() => {
      root.render(<DashboardHeader {...defaultProps} hideRouteControlBar={true} />);
    });

    const controlBar = container.querySelector(".unified-route-control-bar");
    expect(controlBar).toBeNull();
  });
});
