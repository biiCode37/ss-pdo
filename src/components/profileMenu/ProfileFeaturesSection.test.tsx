// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ProfileFeaturesSection } from "./ProfileFeaturesSection";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ProfileFeaturesSection Navigation Toggle", () => {
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

  it("renders 'Monitoring Wilayah' when isInMonitoringView is false or undefined", async () => {
    const onOpenRegionalMonitoring = vi.fn();
    const onDismiss = vi.fn();

    await act(async () => {
      root.render(
        <ProfileFeaturesSection
          onDismiss={onDismiss}
          onOpenRegionalMonitoring={onOpenRegionalMonitoring}
          isInMonitoringView={false}
          isDarkMode={false}
          onToggleTheme={vi.fn()}
          isOnline={true}
          offlineQueueCount={0}
        />
      );
    });

    expect(container.textContent).toContain(
      TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING
    );
    expect(container.textContent).not.toContain(
      TEXT_DASHBOARD.PROFILE_MENU.RETURN_TO_ROUTE
    );

    // Find and click the button
    const buttons = Array.from(container.querySelectorAll("button"));
    const monitoringBtn = buttons.find((btn) =>
      btn.textContent?.includes(TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING)
    );
    expect(monitoringBtn).toBeDefined();

    act(() => {
      monitoringBtn?.click();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onOpenRegionalMonitoring).toHaveBeenCalledTimes(1);
  });

  it("renders 'Kembali ke Operasi Rute' when isInMonitoringView is true", async () => {
    const onReturnToRouteView = vi.fn();
    const onDismiss = vi.fn();

    await act(async () => {
      root.render(
        <ProfileFeaturesSection
          onDismiss={onDismiss}
          onReturnToRouteView={onReturnToRouteView}
          isInMonitoringView={true}
          isDarkMode={false}
          onToggleTheme={vi.fn()}
          isOnline={true}
          offlineQueueCount={0}
        />
      );
    });

    expect(container.textContent).toContain(
      TEXT_DASHBOARD.PROFILE_MENU.RETURN_TO_ROUTE
    );
    expect(container.textContent).not.toContain(
      TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING
    );

    // Find and click the button
    const buttons = Array.from(container.querySelectorAll("button"));
    const returnBtn = buttons.find((btn) =>
      btn.textContent?.includes(TEXT_DASHBOARD.PROFILE_MENU.RETURN_TO_ROUTE)
    );
    expect(returnBtn).toBeDefined();

    act(() => {
      returnBtn?.click();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onReturnToRouteView).toHaveBeenCalledTimes(1);
  });
});
