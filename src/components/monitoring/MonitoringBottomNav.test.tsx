// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringBottomNav } from "./MonitoringBottomNav";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("MonitoringBottomNav Component", () => {
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

  it("renders all 4 tabs with correct labels", async () => {
    const onSelectTab = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="dashboard"
          onSelectTab={onSelectTab}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.NAV.DASHBOARD);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.ROUTES);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.FLEET_STATUS);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.WA_REPORT);
  });

  it("indicates the active tab via aria-selected or active class", async () => {
    const onSelectTab = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="routes"
          onSelectTab={onSelectTab}
        />
      );
    });

    const routesTabBtn = container.querySelector('[data-testid="monitoring-tab-routes"]');
    expect(routesTabBtn).toBeTruthy();
    expect(routesTabBtn?.classList.contains("active")).toBe(true);
    expect(routesTabBtn?.getAttribute("aria-selected")).toBe("true");

    const dashboardTabBtn = container.querySelector('[data-testid="monitoring-tab-dashboard"]');
    expect(dashboardTabBtn?.classList.contains("active")).toBe(false);
    expect(dashboardTabBtn?.getAttribute("aria-selected")).toBe("false");
  });

  it("calls onSelectTab when an inactive tab is clicked", async () => {
    const onSelectTab = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="dashboard"
          onSelectTab={onSelectTab}
        />
      );
    });

    const fleetTabBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-fleet_status"]'
    );
    expect(fleetTabBtn).toBeTruthy();

    act(() => {
      fleetTabBtn?.click();
    });

    expect(onSelectTab).toHaveBeenCalledWith("fleet_status");
  });
});
