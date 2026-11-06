// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardUiState } from "./useDashboardUiState";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latestHookResult: ReturnType<typeof useDashboardUiState>;

function TestHookComponent({
  onClearError,
}: {
  onClearError?: () => void;
}) {
  latestHookResult = useDashboardUiState({ onClearError });
  return (
    <div id="test-view">
      View: {latestHookResult.currentView}, Tab: {latestHookResult.mainTab}
    </div>
  );
}

describe("useDashboardUiState Hook", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
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

  it("initializes with default dashboard view, analytics tab, and online state", () => {
    act(() => {
      root.render(<TestHookComponent />);
    });

    expect(latestHookResult.currentView).toBe("dashboard");
    expect(latestHookResult.mainTab).toBe("analytics");
    expect(latestHookResult.isOnline).toBe(true);
    expect(latestHookResult.isAuthExpired).toBe(false);
    expect(latestHookResult.isReauthenticating).toBe(false);
    expect(latestHookResult.isQueueModalOpen).toBe(false);
    expect(latestHookResult.isAccSheetOpen).toBe(false);
    expect(latestHookResult.isProfileMenuOpen).toBe(false);
  });

  it("toggles theme and updates document attributes and localStorage", () => {
    act(() => {
      root.render(<TestHookComponent />);
    });

    const initialTheme = latestHookResult.theme;
    expect(initialTheme).toBe("dark");

    act(() => {
      latestHookResult.toggleTheme();
    });

    expect(latestHookResult.theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("PDO_THEME")).toBe("light");

    act(() => {
      latestHookResult.toggleTheme();
    });

    expect(latestHookResult.theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("cycles tabs forward and backward on swipe handlers", () => {
    act(() => {
      root.render(<TestHookComponent />);
    });

    expect(latestHookResult.mainTab).toBe("analytics");

    // Cycle forward: analytics -> units -> input -> analytics
    act(() => {
      latestHookResult.handleSwipeNextTab();
    });
    expect(latestHookResult.mainTab).toBe("units");

    act(() => {
      latestHookResult.handleSwipeNextTab();
    });
    expect(latestHookResult.mainTab).toBe("input");

    act(() => {
      latestHookResult.handleSwipeNextTab();
    });
    expect(latestHookResult.mainTab).toBe("analytics");

    // Cycle backward: analytics -> input -> units -> analytics
    act(() => {
      latestHookResult.handleSwipePrevTab();
    });
    expect(latestHookResult.mainTab).toBe("input");

    act(() => {
      latestHookResult.handleSwipePrevTab();
    });
    expect(latestHookResult.mainTab).toBe("units");

    act(() => {
      latestHookResult.handleSwipePrevTab();
    });
    expect(latestHookResult.mainTab).toBe("analytics");
  });

  it("responds to window auth expired and login success events", () => {
    const onClearError = vi.fn();
    act(() => {
      root.render(<TestHookComponent onClearError={onClearError} />);
    });

    expect(latestHookResult.isAuthExpired).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("google-auth-expired"));
    });
    expect(latestHookResult.isAuthExpired).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("google-login-success"));
    });
    expect(latestHookResult.isAuthExpired).toBe(false);
    expect(onClearError).toHaveBeenCalledTimes(1);
  });

  it("responds to window online and offline events", () => {
    act(() => {
      root.render(<TestHookComponent />);
    });

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(latestHookResult.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(latestHookResult.isOnline).toBe(true);
  });

  it("initializes with regional_monitoring view for non-pdo roles (superadmin, admin, korwil, korlap)", () => {
    const nonPdoRoles = ["superadmin", "admin", "korwil", "korlap"];

    for (const role of nonPdoRoles) {
      act(() => {
        root.unmount();
      });
      container.remove();
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);

      localStorage.setItem("PDO_USER_ROLE", role);

      act(() => {
        root.render(<TestHookComponent />);
      });

      expect(latestHookResult.currentView).toBe("regional_monitoring");
    }
  });

  it("retains dashboard view when role is explicitly pdo", () => {
    localStorage.setItem("PDO_USER_ROLE", "pdo");

    act(() => {
      root.render(<TestHookComponent />);
    });

    expect(latestHookResult.currentView).toBe("dashboard");
  });

  it("allows custom initialView to override role-based default", () => {
    localStorage.setItem("PDO_USER_ROLE", "admin");

    function CustomViewComponent() {
      latestHookResult = useDashboardUiState({ initialView: "dashboard" });
      return <div>View: {latestHookResult.currentView}</div>;
    }

    act(() => {
      root.render(<CustomViewComponent />);
    });

    expect(latestHookResult.currentView).toBe("dashboard");
  });

  it("falls back to dashboard view when non-pdo role cannot access regional_monitoring (under maintenance)", () => {
    localStorage.setItem("PDO_USER_ROLE", "admin");

    const canAccessPage = vi.fn((pageKey: string) => {
      if (pageKey === "regional_monitoring") return false;
      return true;
    });

    function MaintenanceFallbackComponent() {
      latestHookResult = useDashboardUiState({
        canAccessPage: canAccessPage as any,
      });
      return <div>View: {latestHookResult.currentView}</div>;
    }

    act(() => {
      root.render(<MaintenanceFallbackComponent />);
    });

    expect(latestHookResult.currentView).toBe("dashboard");
    expect(canAccessPage).toHaveBeenCalledWith("regional_monitoring", "admin");
  });

  it("initializes with regional_monitoring when canAccessPage allows it", () => {
    localStorage.setItem("PDO_USER_ROLE", "admin");

    const canAccessPage = vi.fn(() => true);

    function NormalAccessComponent() {
      latestHookResult = useDashboardUiState({
        canAccessPage: canAccessPage as any,
      });
      return <div>View: {latestHookResult.currentView}</div>;
    }

    act(() => {
      root.render(<NormalAccessComponent />);
    });

    expect(latestHookResult.currentView).toBe("regional_monitoring");
  });
});
