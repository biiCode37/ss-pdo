// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringBottomNav } from "@/components/monitoring/MonitoringBottomNav";
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

  it("renders all tabs with correct labels and places Dashboard in the center position", async () => {
    const onSelectTab = vi.fn();
    const onOpenProfile = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="dashboard"
          onSelectTab={onSelectTab}
          onOpenProfile={onOpenProfile}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.NAV.DASHBOARD);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.ROUTES);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.FLEET_STATUS);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.WA_REPORT);
    expect(container.textContent).toContain(TEXT_MONITORING.NAV.PROFILE);

    // Verify ordering: [Routes, Fleet Status, Dashboard (Center), WA Report, Profile]
    const buttons = container.querySelectorAll<HTMLButtonElement>(".monitoring-tab-btn");
    expect(buttons.length).toBe(5);
    expect(buttons[0].getAttribute("data-testid")).toBe("monitoring-tab-routes");
    expect(buttons[1].getAttribute("data-testid")).toBe("monitoring-tab-fleet_status");
    expect(buttons[2].getAttribute("data-testid")).toBe("monitoring-tab-dashboard"); // CENTER!
    expect(buttons[3].getAttribute("data-testid")).toBe("monitoring-tab-wa_report");
    expect(buttons[4].getAttribute("data-testid")).toBe("monitoring-tab-profile");
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

  it("renders profile button when onOpenProfile is provided and handles click", async () => {
    const onSelectTab = vi.fn();
    const onOpenProfile = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="dashboard"
          onSelectTab={onSelectTab}
          onOpenProfile={onOpenProfile}
        />
      );
    });

    const profileBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="monitoring-tab-profile"]'
    );
    expect(profileBtn).toBeTruthy();
    expect(profileBtn?.textContent).toContain(TEXT_MONITORING.NAV.PROFILE);

    act(() => {
      profileBtn?.click();
    });

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
    expect(onSelectTab).not.toHaveBeenCalled();
  });

  it("does not render profile button when onOpenProfile is undefined", async () => {
    const onSelectTab = vi.fn();

    await act(async () => {
      root.render(
        <MonitoringBottomNav
          activeTab="dashboard"
          onSelectTab={onSelectTab}
        />
      );
    });

    const profileBtn = container.querySelector('[data-testid="monitoring-tab-profile"]');
    expect(profileBtn).toBeNull();
  });
});
