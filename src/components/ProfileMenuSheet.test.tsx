// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ProfileMenuSheet } from "./ProfileMenuSheet";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock dependencies
vi.mock("@/services/routeService", () => ({
  verifyUserProfile: vi.fn().mockResolvedValue({ isAllowed: false }),
  upsertUserProfile: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/services/googleSheets/auth", () => ({
  fetchGoogleUserProfile: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/utils/alertUtils", () => ({
  showLogoutConfirm: vi.fn().mockResolvedValue(true),
  showFormatSheetConfirm: vi.fn().mockResolvedValue(true),
  showToast: vi.fn(),
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn(),
  showErrorAlert: vi.fn(),
}));

describe("ProfileMenuSheet", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders null when isOpen is false", async () => {
    await act(async () => {
      root.render(
        <ProfileMenuSheet
          isOpen={false}
          onClose={vi.fn()}
          isDarkMode={false}
          onToggleTheme={vi.fn()}
          offlineQueueCount={0}
          isOnline={true}
          onLogout={vi.fn()}
        />
      );
    });

    expect(document.body.querySelector(".profile-menu-overlay")).toBeNull();
  });

  it("renders user details and features when isOpen is true", async () => {
    localStorage.setItem("PDO_USER_NAME", "Petugas Lapangan");
    localStorage.setItem("PDO_USER_EMAIL", "petugas@example.com");
    localStorage.setItem("PDO_USER_ROLE", "pdo");

    const onToggleTheme = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <ProfileMenuSheet
          isOpen={true}
          onClose={onClose}
          isDarkMode={false}
          onToggleTheme={onToggleTheme}
          offlineQueueCount={0}
          isOnline={true}
          onLogout={vi.fn()}
        />
      );
    });

    const overlay = document.body.querySelector(".profile-menu-overlay");
    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toContain("Petugas Lapangan");
    expect(overlay?.textContent).toContain("petugas@example.com");

    // Regular PDO user should NOT see Admin section
    expect(overlay?.textContent).not.toContain(TEXT_DASHBOARD.PROFILE_MENU.ADMIN_SECTION);
    expect(overlay?.textContent).not.toContain(TEXT_DASHBOARD.PROFILE_MENU.USER_MANAGEMENT);

    // Should see features section
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.FEATURES_SECTION);
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING);
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.CROSS_PERIOD);
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.THEME_MODE);
  });

  it("renders admin section when user role is admin or superadmin", async () => {
    localStorage.setItem("PDO_USER_NAME", "Admin Pengawas");
    localStorage.setItem("PDO_USER_ROLE", "admin");

    await act(async () => {
      root.render(
        <ProfileMenuSheet
          isOpen={true}
          onClose={vi.fn()}
          isDarkMode={true}
          onToggleTheme={vi.fn()}
          offlineQueueCount={0}
          isOnline={true}
          onLogout={vi.fn()}
        />
      );
    });

    const overlay = document.body.querySelector(".profile-menu-overlay");
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.ADMIN_SECTION);
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.USER_MANAGEMENT);
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.AUDIT_LOG);
  });

  it("displays offline indicator when offline or offlineQueueCount > 0", async () => {
    await act(async () => {
      root.render(
        <ProfileMenuSheet
          isOpen={true}
          onClose={vi.fn()}
          isDarkMode={false}
          onToggleTheme={vi.fn()}
          offlineQueueCount={3}
          isOnline={false}
          onLogout={vi.fn()}
        />
      );
    });

    const overlay = document.body.querySelector(".profile-menu-overlay");
    expect(overlay?.textContent).toContain(TEXT_DASHBOARD.PROFILE_MENU.OFFLINE_MODE);
    expect(overlay?.textContent).toContain(`3 ${TEXT_DASHBOARD.PROFILE_MENU.PENDING_SUFFIX}`);
  });
});
