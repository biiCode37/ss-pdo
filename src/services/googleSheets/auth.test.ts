// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGapi, hasGoogleCreds, getGoogleCreds, initGoogleApi } from './auth';

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Bersihkan script tag yang di-inject selama test
    document.querySelectorAll('script[src*="apis.google.com"], script[src*="accounts.google.com"]').forEach(el => el.remove());
  });

  it('getGapi returns window.gapi or undefined', () => {
    (window as any).gapi = { load: vi.fn() };
    expect(getGapi()).toBeDefined();
    delete (window as any).gapi;
    expect(getGapi()).toBeUndefined();
  });

  it('hasGoogleCreds checks presence of clientId and apiKey', () => {
    const creds = getGoogleCreds();
    if (creds.clientId && creds.apiKey) {
      expect(hasGoogleCreds()).toBe(true);
    } else {
      expect(hasGoogleCreds()).toBe(false);
    }
  });

  it('initGoogleApi resolves cleanly when gapi and gsi are already available in window', async () => {
    const mockInit = vi.fn().mockResolvedValue(undefined);
    const mockLoad = vi.fn((_name: string, callback: () => void) => callback());
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
    expect(mockLoad).toHaveBeenCalledWith('client', expect.any(Function));
    expect(mockInit).toHaveBeenCalled();
    expect(mockInitTokenClient).toHaveBeenCalled();
  });

  it('initGoogleApi rejects when script fails to load', async () => {
    delete (window as any).gapi;
    delete (window as any).google;

    // Happy-dom memblokir network script loading dan memicu onerror
    await expect(initGoogleApi()).rejects.toThrow('Gagal memuat Google API client script');
  });
});
