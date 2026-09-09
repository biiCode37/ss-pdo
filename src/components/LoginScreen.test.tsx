// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginScreen } from "./LoginScreen";
import { TEXT_AUTH, TEXT_DASHBOARD } from "../constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock dependencies
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockVerifyUserProfile = vi.fn();
const mockUpsertUserProfile = vi.fn().mockResolvedValue({});

vi.mock("../services/googleSheets", () => ({
  signIn: () => mockSignIn(),
  signOut: () => mockSignOut(),
}));

vi.mock("../services/routeService", () => ({
  verifyUserProfile: (email: string) => mockVerifyUserProfile(email),
  upsertUserProfile: (profile: any) => mockUpsertUserProfile(profile),
}));

describe("LoginScreen Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    window.location.hash = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders brand, titles, badges, and login action button", () => {
    act(() => {
      root.render(<LoginScreen onLoginSuccess={() => {}} isApiReady={true} />);
    });

    expect(container.textContent).toContain(TEXT_DASHBOARD.APP_TITLE);
    expect(container.textContent).toContain(TEXT_DASHBOARD.APP_SUBTITLE);
    expect(container.textContent).toContain(TEXT_AUTH.BADGE);

    const loginBtn = container.querySelector('[data-testid="google-login-btn"]') as HTMLButtonElement;
    expect(loginBtn).not.toBeNull();
    expect(loginBtn.disabled).toBe(false);
    expect(loginBtn.textContent).toContain(TEXT_AUTH.SIGN_IN_BTN);
  });

  it("disables login button when isApiReady is false", () => {
    act(() => {
      root.render(<LoginScreen onLoginSuccess={() => {}} isApiReady={false} />);
    });

    const loginBtn = container.querySelector('[data-testid="google-login-btn"]') as HTMLButtonElement;
    expect(loginBtn.disabled).toBe(true);
  });

  it("completes successful login flow and triggers onLoginSuccess", async () => {
    const handleLoginSuccess = vi.fn();
    mockSignIn.mockImplementation(async () => {
      localStorage.setItem("PDO_USER_EMAIL", "petugas@transjakarta.co.id");
      localStorage.setItem("PDO_USER_NAME", "Petugas Lapangan");
    });
    mockVerifyUserProfile.mockResolvedValue({
      isAllowed: true,
      profile: {
        email: "petugas@transjakarta.co.id",
        full_name: "Petugas Lapangan",
        role: "petugas",
      },
    });

    await act(async () => {
      root.render(<LoginScreen onLoginSuccess={handleLoginSuccess} isApiReady={true} />);
    });

    const loginBtn = container.querySelector('[data-testid="google-login-btn"]') as HTMLButtonElement;
    await act(async () => {
      loginBtn.click();
    });

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockVerifyUserProfile).toHaveBeenCalledWith("petugas@transjakarta.co.id");
    expect(handleLoginSuccess).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("PDO_USER_ROLE")).toBe("petugas");
  });

  it("shows error when user profile is not allowed", async () => {
    const handleLoginSuccess = vi.fn();
    mockSignIn.mockImplementation(async () => {
      localStorage.setItem("PDO_USER_EMAIL", "unknown@gmail.com");
    });
    mockVerifyUserProfile.mockResolvedValue({
      isAllowed: false,
      message: "Akun belum terdaftar.",
    });

    await act(async () => {
      root.render(<LoginScreen onLoginSuccess={handleLoginSuccess} isApiReady={true} />);
    });

    const loginBtn = container.querySelector('[data-testid="google-login-btn"]') as HTMLButtonElement;
    await act(async () => {
      loginBtn.click();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(handleLoginSuccess).not.toHaveBeenCalled();

    const errorAlert = container.querySelector('[role="alert"]');
    expect(errorAlert?.textContent).toContain("Akun belum terdaftar.");
  });

  it("opens and closes info modal when triggered", async () => {
    await act(async () => {
      root.render(<LoginScreen onLoginSuccess={() => {}} isApiReady={true} />);
    });

    expect(container.querySelector(".login-info-sheet")).toBeNull();

    const openInfoBtn = container.querySelector('[data-testid="open-info-modal-btn"]') as HTMLButtonElement;
    await act(async () => {
      openInfoBtn.click();
    });

    expect(container.querySelector(".login-info-sheet")).not.toBeNull();
    expect(container.textContent).toContain("Tentang Aplikasi & Izin Akses");

    const closeBtn = container.querySelector('[data-testid="close-info-modal-btn"]') as HTMLButtonElement;
    await act(async () => {
      closeBtn.click();
    });

    expect(container.querySelector(".login-info-sheet")).toBeNull();
  });
});
