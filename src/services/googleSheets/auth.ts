import { gapi } from 'gapi-script';
import { logActivity } from '../routeService';
import { isAuthError } from '../../utils/errorClassifier';
import type { AuthResult } from './types';
import { checkProxyHealth, isUsingServiceAccount } from './transport';

export const getGoogleCreds = () => {
  return {
    clientId: import.meta.env.VITE_GAPI_CLIENT_ID || '',
    apiKey: import.meta.env.VITE_GAPI_API_KEY || ''
  };
};

export const hasGoogleCreds = () => {
  const creds = getGoogleCreds();
  return !!creds.clientId && !!creds.apiKey;
};

let tokenClient: any;

export const initGoogleApi = async (): Promise<void> => {
  const creds = getGoogleCreds();
  if (!hasGoogleCreds()) throw new Error('API Credentials missing');

  return new Promise((resolve, reject) => {
    // 1. Load the GAPI client for API calls (without auth2)
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: creds.apiKey,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        
        // 2. Load Google Identity Services script for modern Auth
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: creds.clientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets email profile',
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                gapi.client.setToken({ access_token: tokenResponse.access_token });
                localStorage.setItem('PDO_IS_SIGNED_IN', 'true');
                localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
                  token: tokenResponse.access_token,
                  expiresAt: Date.now() + tokenResponse.expires_in * 1000
                }));

                // Fetch Google profile userinfo SEBELUM dispatch success
                // agar PDO_USER_EMAIL tersedia saat LoginScreen melanjutkan
                let resolvedEmail = '';
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  if (res.ok) {
                    const info = await res.json();
                    if (info && info.email) {
                      resolvedEmail = info.email;
                      localStorage.setItem('PDO_USER_EMAIL', info.email);
                      localStorage.setItem('PDO_USER_NAME', info.name || info.email);
                      localStorage.setItem('PDO_USER_AVATAR', info.picture || '');
                    }
                  }
                } catch (_e) {
                  // Fallback: network error saat fetch userinfo
                }

                // Dispatch SETELAH userinfo tersimpan ke localStorage
                window.dispatchEvent(new CustomEvent('google-login-success', {
                  detail: { email: resolvedEmail }
                }));

                // Mulai timer refresh token otomatis hanya jika dalam mode client OAuth
                if (!isUsingServiceAccount()) {
                  startTokenRefreshTimer(tokenResponse.expires_in * 1000);
                }

                // Telemetry: Catat activity log LOGIN dengan email yang baru terverifikasi
                const emailToLog = resolvedEmail || localStorage.getItem('PDO_USER_EMAIL') || 'google_user';
                logActivity({
                  user_email: emailToLog,
                  action: 'LOGIN',
                  details: { loginMethod: 'google_gis' },
                }).catch(() => {});
              } else if (tokenResponse && tokenResponse.error) {
                window.dispatchEvent(new CustomEvent('google-login-error', { detail: tokenResponse }));
              }
            },
            // BUG-04: Tangkap semua kegagalan popup (ditutup user, akses ditolak, dll.)
            error_callback: (err: any) => {
              window.dispatchEvent(new CustomEvent('google-login-error', { detail: err }));
            },
          });
          resolve();
        };
        script.onerror = () => reject(new Error('Gagal memuat Google Identity Services'));
        document.body.appendChild(script);
        
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const signIn = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client belum siap'));
      return;
    }
    
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError as EventListener);
      clearTimeout(timeoutId);
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    // BUG-04: Tangkap error dari popup (ditutup/dibatalkan user)
    const handleError = (e: CustomEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.detail || new Error('Login dibatalkan'));
    };

    // BUG-04: Timeout pengaman 60 detik jika Google tidak memberi respons apa pun
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Login timeout: tidak ada respons dari Google. Silakan coba lagi.'));
    }, 20000);

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError as EventListener);
    
    // Trigger popup (prompt empty allows Google to skip consent if user already consented)
    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export const signOut = async () => {
  const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'google_user';
  logActivity({
    user_email: userEmail,
    action: 'LOGOUT',
  }).catch(() => {});

  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      if (tokenObj.token && (window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(tokenObj.token, (done: any) => {
          if (done?.error) {
            console.warn('[Auth] Gagal revoke token Google OAuth pada logout:', done.error);
          }
        });
      }
    } catch (e) {
      console.warn('[Auth] Error saat memproses revoke token Google:', e);
    }
  }
  localStorage.removeItem('GAPI_ACCESS_TOKEN');
  localStorage.removeItem('PDO_IS_SIGNED_IN');
  localStorage.removeItem('PDO_USER_EMAIL');
  localStorage.removeItem('PDO_USER_NAME');
  localStorage.removeItem('PDO_USER_AVATAR');
  if (gapi.client) {
    gapi.client.setToken(null);
  }
};

export const ensureValidToken = async (): Promise<void> => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  if (!isPersistentSignedIn) return;

  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      // Jika token masih berlaku lebih dari 2 menit, pasang ke gapi client
      if (tokenObj.token && tokenObj.expiresAt && tokenObj.expiresAt - Date.now() > 2 * 60 * 1000) {
        if (gapi.client) {
          gapi.client.setToken({ access_token: tokenObj.token });
        }
        return;
      }
    } catch (e) {}
  }

  // Lakukan silent token refresh tanpa prompt consent
  await refreshTokenInteractiveOrSilent(true);
};

let tokenRefreshPromise: Promise<void> | null = null;

export const refreshTokenInteractiveOrSilent = async (silentOnly = false): Promise<void> => {
  if (!tokenClient) return;
  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError);
      tokenRefreshPromise = null;
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = (e?: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (silentOnly) {
        // Pada mode silent, resolve agar caller bisa menentukan fallback
        resolve();
      } else {
        reject(e?.detail || new Error('Gagal memperbarui token autentikasi Google'));
      }
    };

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError);

    try {
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (e) {
      if (!settled) {
        settled = true;
        cleanup();
        if (silentOnly) resolve();
        else reject(e);
      }
    }

    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        if (silentOnly) resolve();
        else reject(new Error('Token refresh timeout'));
      }
    }, 8000); // ponytail: 8 detik untuk mengakomodasi sinyal lemah di lapangan (BUG-38)
  });

  return tokenRefreshPromise;
};

export const reauthenticateSession = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client belum siap'));
      return;
    }
    
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('google-login-success', handleSuccess);
      window.removeEventListener('google-login-error', handleError as EventListener);
      clearTimeout(timeoutId);
    };

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = (e: CustomEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.detail || new Error('Perbaruan sesi dibatalkan'));
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Perbaruan sesi timeout: tidak ada respons dari Google. Silakan coba lagi.'));
    }, 20000);

    window.addEventListener('google-login-success', handleSuccess);
    window.addEventListener('google-login-error', handleError as EventListener);
    
    // Trigger popup directly from user gesture (click event)
    try {
      tokenClient.requestAccessToken();
    } catch (e) {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    }
  });
};

export async function withAuthRetry<T>(apiFn: () => Promise<T>): Promise<T> {
  // Jika Service Account aktif, langsung eksekusi tanpa ketergantungan OAuth token browser
  if (isUsingServiceAccount()) {
    return await apiFn();
  }
  await ensureValidToken();
  try {
    return await apiFn();
  } catch (err: any) {
    if (isAuthError(err)) {
      console.warn('[GoogleSheets] Access Token kedaluwarsa/unauthorized (401/403). Memicu modal re-auth...');
      window.dispatchEvent(new CustomEvent('google-auth-expired'));
    }
    throw err;
  }
}

/**
 * Mengambil profil akun Google (nama, email, avatar/picture) via Google OAuth UserInfo API
 */
export const fetchGoogleUserProfile = async (): Promise<{ email?: string; name?: string; picture?: string } | null> => {
  let token = '';
  if (typeof gapi !== 'undefined' && gapi.client) {
    const gapiToken = gapi.client.getToken();
    if (gapiToken && gapiToken.access_token) {
      token = gapiToken.access_token;
    }
  }

  if (!token) {
    const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
    if (tokenStr) {
      try {
        const tokenObj = JSON.parse(tokenStr);
        if (tokenObj && tokenObj.token) {
          token = tokenObj.token;
        }
      } catch (_e) {}
    }
  }

  if (!token) return null;

  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const info = await res.json();
      if (info) {
        if (info.email) localStorage.setItem('PDO_USER_EMAIL', info.email);
        if (info.name) localStorage.setItem('PDO_USER_NAME', info.name);
        if (info.picture) localStorage.setItem('PDO_USER_AVATAR', info.picture);
        return info;
      }
    }
  } catch (e) {
    console.warn('[Auth] Gagal mengambil profil userinfo dari Google:', e);
  }
  return null;
};

/**
 * Validasi auth secara async — ISS-01 fix & Golden Rule #3.
 * Menunggu hasil validasi token sebelum mengembalikan status final.
 * Gunakan ini saat cold start / page load.
 */
export const checkSignedInAsync = async (): Promise<AuthResult> => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  if (!isPersistentSignedIn) return { authenticated: false, reason: 'no_flag' };

  // Golden Rule #3: Jika Service Account proxy aktif, sesi pengguna bersifat 100% permanen
  const proxy = await checkProxyHealth();
  if (proxy.active) {
    if (!localStorage.getItem('PDO_USER_AVATAR')) {
      fetchGoogleUserProfile().catch(() => {});
    }
    return { authenticated: true };
  }

  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (!tokenStr) {
    // Coba silent refresh
    try {
      await ensureValidToken();
      // Cek lagi setelah refresh
      const refreshedToken = localStorage.getItem('GAPI_ACCESS_TOKEN');
      if (refreshedToken) {
        const obj = JSON.parse(refreshedToken);
        if (obj.token) {
          if (!localStorage.getItem('PDO_USER_AVATAR')) {
            fetchGoogleUserProfile().catch(() => {});
          }
          return { authenticated: true };
        }
      }
    } catch (_e) { /* silent */ }
    // ATURAN EMAS #3: Tetap authenticated, tapi tandai needs_reauth
    return { authenticated: true, reason: 'needs_reauth' };
  }

  try {
    const tokenObj = JSON.parse(tokenStr);
    if (!tokenObj.token) {
      return { authenticated: true, reason: 'needs_reauth' };
    }

    if (gapi.client) {
      gapi.client.setToken({ access_token: tokenObj.token });
    }

    if (!localStorage.getItem('PDO_USER_AVATAR')) {
      fetchGoogleUserProfile().catch(() => {});
    }

    if (tokenObj.expiresAt && tokenObj.expiresAt > Date.now()) {
      startTokenRefreshTimer(tokenObj.expiresAt - Date.now());
      return { authenticated: true };
    }

    // Token expired — coba refresh
    await ensureValidToken();

    // BUG-46: Re-read token SETELAH refresh. Sebelumnya selalu return
    // 'needs_reauth' walau silent refresh berhasil & token baru tersimpan,
    // sehingga banner "sesi kedaluwarsa" muncul palsu setiap cold-start.
    try {
      const refreshedStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
      if (refreshedStr) {
        const fresh = JSON.parse(refreshedStr);
        if (fresh.token && fresh.expiresAt && fresh.expiresAt > Date.now()) {
          if (gapi.client) {
            gapi.client.setToken({ access_token: fresh.token });
          }
          startTokenRefreshTimer(fresh.expiresAt - Date.now());
          return { authenticated: true };
        }
      }
    } catch (_e) { /* fallthrough */ }

    return { authenticated: true, reason: 'needs_reauth' };
  } catch (_e) {
    return { authenticated: true, reason: 'needs_reauth' };
  }
};

// BUG-11: Timer refresh token proaktif
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export function startTokenRefreshTimer(expiresInMs: number) {
  stopTokenRefreshTimer();
  // Refresh 5 menit sebelum kedaluwarsa (atau segera jika < 5 menit tersisa)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const refreshDelay = Math.max(expiresInMs - FIVE_MINUTES, 0);
  
  refreshTimerId = setTimeout(async () => {
    try {
      if (tokenClient) {
        // Silent refresh — tanpa prompt consent
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch {
      window.dispatchEvent(new CustomEvent('google-token-expiring'));
    }
  }, refreshDelay);
}

export function stopTokenRefreshTimer() {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}
