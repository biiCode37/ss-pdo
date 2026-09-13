import { isAuthError } from "../../utils/errorClassifier";
import type { AuthResult } from "./types";
import { checkProxyHealth, isUsingServiceAccount } from "./transport";
import { getGapi, getTokenClient } from "./authGis";

// BUG-11: Timer refresh token proaktif
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export function stopTokenRefreshTimer() {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

export function startTokenRefreshTimer(expiresInMs: number) {
  stopTokenRefreshTimer();
  // Refresh 5 menit sebelum kedaluwarsa (atau segera jika < 5 menit tersisa)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const refreshDelay = Math.max(expiresInMs - FIVE_MINUTES, 0);

  refreshTimerId = setTimeout(async () => {
    try {
      const client = getTokenClient();
      if (client) {
        // Silent refresh — tanpa prompt consent
        client.requestAccessToken({ prompt: "" });
      }
    } catch {
      window.dispatchEvent(new CustomEvent("google-token-expiring"));
    }
  }, refreshDelay);
}

// Auto start timer saat login berhasil jika dalam mode client OAuth
if (typeof window !== "undefined") {
  window.addEventListener("google-login-success", (e: any) => {
    if (!isUsingServiceAccount() && e.detail?.expiresIn) {
      startTokenRefreshTimer(e.detail.expiresIn * 1000);
    }
  });
}

let tokenRefreshPromise: Promise<void> | null = null;

export const refreshTokenInteractiveOrSilent = async (
  silentOnly = false,
): Promise<void> => {
  const client = getTokenClient();
  if (!client) return;
  if (tokenRefreshPromise) return tokenRefreshPromise;

  tokenRefreshPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener("google-login-success", handleSuccess);
      window.removeEventListener("google-login-error", handleError);
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
        reject(
          e?.detail ||
            new Error("Gagal memperbarui token autentikasi Google"),
        );
      }
    };

    window.addEventListener("google-login-success", handleSuccess);
    window.addEventListener("google-login-error", handleError);

    try {
      client.requestAccessToken({ prompt: "" });
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
        else reject(new Error("Token refresh timeout"));
      }
    }, 8000); // ponytail: 8 detik untuk mengakomodasi sinyal lemah di lapangan (BUG-38)
  });

  return tokenRefreshPromise;
};

export const ensureValidToken = async (): Promise<void> => {
  const isPersistentSignedIn =
    localStorage.getItem("PDO_IS_SIGNED_IN") === "true";
  if (!isPersistentSignedIn) return;

  const tokenStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      // Jika token masih berlaku lebih dari 2 menit, pasang ke gapi client
      if (
        tokenObj.token &&
        tokenObj.expiresAt &&
        tokenObj.expiresAt - Date.now() > 2 * 60 * 1000
      ) {
        const gapiObj = getGapi();
        if (gapiObj?.client) {
          gapiObj.client.setToken({ access_token: tokenObj.token });
        }
        return;
      }
    } catch (_e) {}
  }

  // Lakukan silent token refresh tanpa prompt consent
  await refreshTokenInteractiveOrSilent(true);
};

export const reauthenticateSession = async (): Promise<void> => {
  const client = getTokenClient();
  return new Promise((resolve, reject) => {
    if (!client) {
      reject(new Error("Token client belum siap"));
      return;
    }

    let settled = false;

    const cleanup = () => {
      window.removeEventListener("google-login-success", handleSuccess);
      window.removeEventListener(
        "google-login-error",
        handleError as EventListener,
      );
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
      reject(e.detail || new Error("Perbaruan sesi dibatalkan"));
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new Error(
          "Perbaruan sesi timeout: tidak ada respons dari Google. Silakan coba lagi.",
        ),
      );
    }, 20000);

    window.addEventListener("google-login-success", handleSuccess);
    window.addEventListener("google-login-error", handleError as EventListener);

    // Trigger popup directly from user gesture (click event)
    try {
      client.requestAccessToken();
    } catch (_e) {
      client.requestAccessToken({ prompt: "select_account" });
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
      console.warn(
        "[GoogleSheets] Access Token kedaluwarsa/unauthorized (401/403). Memicu modal re-auth...",
      );
      window.dispatchEvent(new CustomEvent("google-auth-expired"));
    }
    throw err;
  }
}

/**
 * Mengambil profil akun Google (nama, email, avatar/picture) via Google OAuth UserInfo API
 */
export const fetchGoogleUserProfile = async (): Promise<{
  email?: string;
  name?: string;
  picture?: string;
} | null> => {
  let token = "";
  const gapiObj = getGapi();
  if (gapiObj?.client) {
    const gapiToken = gapiObj.client.getToken();
    if (gapiToken && gapiToken.access_token) {
      token = gapiToken.access_token;
    }
  }

  if (!token) {
    const tokenStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
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
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (res.ok) {
      const info = await res.json();
      if (info) {
        if (info.email) localStorage.setItem("PDO_USER_EMAIL", info.email);
        if (info.name) localStorage.setItem("PDO_USER_NAME", info.name);
        if (info.picture)
          localStorage.setItem("PDO_USER_AVATAR", info.picture);
        return info;
      }
    }
  } catch (e) {
    console.warn("[Auth] Gagal mengambil profil userinfo dari Google:", e);
  }
  return null;
};

/**
 * Validasi auth secara async — ISS-01 fix & Golden Rule #3.
 * Menunggu hasil validasi token sebelum mengembalikan status final.
 * Gunakan ini saat cold start / page load.
 */
export const checkSignedInAsync = async (): Promise<AuthResult> => {
  const isPersistentSignedIn =
    localStorage.getItem("PDO_IS_SIGNED_IN") === "true";
  if (!isPersistentSignedIn)
    return { authenticated: false, reason: "no_flag" };

  // Golden Rule #3: Jika Service Account proxy aktif, sesi pengguna bersifat 100% permanen
  const proxy = await checkProxyHealth();
  if (proxy.active) {
    if (!localStorage.getItem("PDO_USER_AVATAR")) {
      fetchGoogleUserProfile().catch(() => {});
    }
    return { authenticated: true };
  }

  const tokenStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
  if (!tokenStr) {
    // Coba silent refresh
    try {
      await ensureValidToken();
      // Cek lagi setelah refresh
      const refreshedToken = localStorage.getItem("GAPI_ACCESS_TOKEN");
      if (refreshedToken) {
        const obj = JSON.parse(refreshedToken);
        if (obj.token) {
          if (!localStorage.getItem("PDO_USER_AVATAR")) {
            fetchGoogleUserProfile().catch(() => {});
          }
          return { authenticated: true };
        }
      }
    } catch (_e) {
      /* silent */
    }
    // ATURAN EMAS #3: Tetap authenticated, tapi tandai needs_reauth
    return { authenticated: true, reason: "needs_reauth" };
  }

  try {
    const tokenObj = JSON.parse(tokenStr);
    if (!tokenObj.token) {
      return { authenticated: true, reason: "needs_reauth" };
    }

    const gapiObj = getGapi();
    if (gapiObj?.client) {
      gapiObj.client.setToken({ access_token: tokenObj.token });
    }

    if (!localStorage.getItem("PDO_USER_AVATAR")) {
      fetchGoogleUserProfile().catch(() => {});
    }

    if (tokenObj.expiresAt && tokenObj.expiresAt > Date.now()) {
      startTokenRefreshTimer(tokenObj.expiresAt - Date.now());
      return { authenticated: true };
    }

    // Token expired — coba refresh
    await ensureValidToken();

    // BUG-46: Re-read token SETELAH refresh.
    try {
      const refreshedStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
      if (refreshedStr) {
        const fresh = JSON.parse(refreshedStr);
        if (fresh.token && fresh.expiresAt && fresh.expiresAt > Date.now()) {
          const freshGapiObj = getGapi();
          if (freshGapiObj?.client) {
            freshGapiObj.client.setToken({ access_token: fresh.token });
          }
          startTokenRefreshTimer(fresh.expiresAt - Date.now());
          return { authenticated: true };
        }
      }
    } catch (_e) {
      /* fallthrough */
    }

    return { authenticated: true, reason: "needs_reauth" };
  } catch (_e) {
    return { authenticated: true, reason: "needs_reauth" };
  }
};
