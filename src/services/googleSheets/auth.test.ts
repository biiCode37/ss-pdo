// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGapi,
  hasGoogleCreds,
  getGoogleCreds,
  initGoogleApi,
  checkSignedInAsync,
  startTokenRefreshTimer,
  stopTokenRefreshTimer,
  setTokenClient,
} from "./auth";
import { setTransportMode } from "./transport";

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setTransportMode("client_oauth");
  });

  afterEach(() => {
    setTransportMode("auto");
    setTokenClient(null);
    // Bersihkan script tag yang di-inject selama test
    document
      .querySelectorAll(
        'script[src*="apis.google.com"], script[src*="accounts.google.com"]',
      )
      .forEach((el) => el.remove());
    stopTokenRefreshTimer();
  });

  it("getGapi returns window.gapi or undefined", () => {
    (window as any).gapi = { load: vi.fn() };
    expect(getGapi()).toBeDefined();
    delete (window as any).gapi;
    expect(getGapi()).toBeUndefined();
  });

  it("hasGoogleCreds checks presence of clientId and apiKey", () => {
    const creds = getGoogleCreds();
    if (creds.clientId && creds.apiKey) {
      expect(hasGoogleCreds()).toBe(true);
    } else {
      expect(hasGoogleCreds()).toBe(false);
    }
  });

  it("initGoogleApi resolves cleanly when gapi and gsi are already available in window", async () => {
    const mockInit = vi.fn().mockResolvedValue(undefined);
    const mockLoad = vi.fn((_name: string, callback: () => void) =>
      callback(),
    );
    (window as any).gapi = {
      load: mockLoad,
      client: {
        init: mockInit,
        setToken: vi.fn(),
      },
    };

    const mockInitTokenClient = vi.fn().mockReturnValue({
      requestAccessToken: vi.fn(),
    });
    (window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };

    // Panggil initGoogleApi
    const promise = initGoogleApi();

    // Karena window.gapi dan window.google.accounts.oauth2 sudah tersedia,
    // initGoogleApi harus langsung resolve tanpa error
    await expect(promise).resolves.toBeUndefined();
    expect(mockLoad).toHaveBeenCalledWith("client", expect.any(Function));
    expect(mockInit).toHaveBeenCalled();
    expect(mockInitTokenClient).toHaveBeenCalled();
  });

  it("initGoogleApi rejects when script fails to load", async () => {
    delete (window as any).gapi;
    delete (window as any).google;

    // Happy-dom memblokir network script loading dan memicu onerror
    await expect(initGoogleApi()).rejects.toThrow(
      "Gagal memuat Google API client script",
    );
  });

  it("checkSignedInAsync returns unauthenticated when no flag in localStorage", async () => {
    const result = await checkSignedInAsync();
    expect(result.authenticated).toBe(false);
    expect(result.reason).toBe("no_flag");
  });

  it("checkSignedInAsync marks needs_reauth when signed in but no token in localStorage", async () => {
    localStorage.setItem("PDO_IS_SIGNED_IN", "true");
    const result = await checkSignedInAsync();
    expect(result.authenticated).toBe(true);
    expect(result.reason).toBe("needs_reauth");
  });

  it("checkSignedInAsync returns authenticated when valid unexpired token exists", async () => {
    localStorage.setItem("PDO_IS_SIGNED_IN", "true");
    localStorage.setItem(
      "GAPI_ACCESS_TOKEN",
      JSON.stringify({
        token: "mock-valid-token",
        expiresAt: Date.now() + 3600 * 1000,
      }),
    );

    const result = await checkSignedInAsync();
    expect(result.authenticated).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("starts and stops token refresh timer without error", () => {
    expect(() => {
      startTokenRefreshTimer(3600 * 1000);
      stopTokenRefreshTimer();
    }).not.toThrow();
  });
});
