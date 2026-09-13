import { logActivity } from "../routeService";

// ponytail: native dynamic script loading replaces gapi-script and eliminates eval warning
export const getGapi = (): any => {
  return typeof window !== "undefined" ? (window as any).gapi : undefined;
};

export const getGoogleCreds = () => {
  return {
    clientId: import.meta.env.VITE_GAPI_CLIENT_ID || "",
    apiKey: import.meta.env.VITE_GAPI_API_KEY || "",
  };
};

export const hasGoogleCreds = () => {
  const creds = getGoogleCreds();
  return !!creds.clientId && !!creds.apiKey;
};

let tokenClient: any;

export const getTokenClient = (): any => tokenClient;
export const setTokenClient = (client: any): void => {
  tokenClient = client;
};

export const initGoogleApi = async (): Promise<void> => {
  const creds = getGoogleCreds();
  if (!hasGoogleCreds()) throw new Error("API Credentials missing");

  return new Promise((resolve, reject) => {
    let settled = false;

    // Timeout pengaman 15 detik agar startup tidak stuck selamanya jika Google API unreachable
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new Error(
            "Koneksi ke Google API timeout. Silakan periksa koneksi internet Anda.",
          ),
        );
      }
    }, 15000);

    const onDone = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };

    const onError = (err: any) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    };

    const setupGapi = () => {
      const gapiObj = getGapi();
      if (!gapiObj?.load) {
        onError(new Error("Objek gapi tidak tersedia"));
        return;
      }

      gapiObj.load("client", async () => {
        try {
          await gapiObj.client.init({
            apiKey: creds.apiKey,
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });

          // 2. Load Google Identity Services script for modern Auth
          const initTokenClient = () => {
            try {
              tokenClient = (
                window as any
              ).google?.accounts?.oauth2?.initTokenClient({
                client_id: creds.clientId,
                scope:
                  "https://www.googleapis.com/auth/spreadsheets email profile",
                callback: async (tokenResponse: any) => {
                  if (tokenResponse && tokenResponse.access_token) {
                    gapiObj.client.setToken({
                      access_token: tokenResponse.access_token,
                    });
                    localStorage.setItem("PDO_IS_SIGNED_IN", "true");
                    localStorage.setItem(
                      "GAPI_ACCESS_TOKEN",
                      JSON.stringify({
                        token: tokenResponse.access_token,
                        expiresAt:
                          Date.now() + tokenResponse.expires_in * 1000,
                      }),
                    );

                    // Fetch Google profile userinfo SEBELUM dispatch success
                    // agar PDO_USER_EMAIL tersedia saat LoginScreen melanjutkan
                    let resolvedEmail = "";
                    try {
                      const res = await fetch(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        {
                          headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                          },
                        },
                      );
                      if (res.ok) {
                        const info = await res.json();
                        if (info && info.email) {
                          resolvedEmail = info.email;
                          localStorage.setItem("PDO_USER_EMAIL", info.email);
                          localStorage.setItem(
                            "PDO_USER_NAME",
                            info.name || info.email,
                          );
                          localStorage.setItem(
                            "PDO_USER_AVATAR",
                            info.picture || "",
                          );
                        }
                      }
                    } catch (_e) {
                      // Fallback: network error saat fetch userinfo
                    }

                    // Dispatch SETELAH userinfo tersimpan ke localStorage
                    window.dispatchEvent(
                      new CustomEvent("google-login-success", {
                        detail: {
                          email: resolvedEmail,
                          expiresIn: tokenResponse.expires_in,
                        },
                      }),
                    );

                    // Telemetry: Catat activity log LOGIN dengan email yang baru terverifikasi
                    const emailToLog =
                      resolvedEmail ||
                      localStorage.getItem("PDO_USER_EMAIL") ||
                      "google_user";
                    logActivity({
                      user_email: emailToLog,
                      action: "LOGIN",
                      details: { loginMethod: "google_gis" },
                    }).catch(() => {});
                  } else if (tokenResponse && tokenResponse.error) {
                    window.dispatchEvent(
                      new CustomEvent("google-login-error", {
                        detail: tokenResponse,
                      }),
                    );
                  }
                },
                // BUG-04: Tangkap semua kegagalan popup (ditutup user, akses ditolak, dll.)
                error_callback: (err: any) => {
                  window.dispatchEvent(
                    new CustomEvent("google-login-error", { detail: err }),
                  );
                },
              });
              onDone();
            } catch (err) {
              onError(err);
            }
          };

          if ((window as any).google?.accounts?.oauth2) {
            initTokenClient();
          } else if (typeof document !== "undefined") {
            const existingGsi = document.querySelector(
              'script[src*="accounts.google.com/gsi/client"]',
            ) as HTMLScriptElement;
            if (existingGsi) {
              existingGsi.addEventListener("load", initTokenClient);
              existingGsi.addEventListener("error", () =>
                onError(new Error("Gagal memuat Google Identity Services")),
              );
            } else {
              const script = document.createElement("script");
              script.src = "https://accounts.google.com/gsi/client";
              script.async = true;
              script.onload = initTokenClient;
              script.onerror = () =>
                onError(new Error("Gagal memuat Google Identity Services"));
              document.body.appendChild(script);
            }
          } else {
            onDone();
          }
        } catch (error) {
          onError(error);
        }
      });
    };

    if (getGapi()?.load) {
      setupGapi();
    } else if (typeof document !== "undefined") {
      const existingGapi = document.querySelector(
        'script[src*="apis.google.com/js/api.js"]',
      ) as HTMLScriptElement;
      if (existingGapi) {
        existingGapi.addEventListener("load", setupGapi);
        existingGapi.addEventListener("error", () =>
          onError(new Error("Gagal memuat Google API client script")),
        );
      } else {
        const gapiScript = document.createElement("script");
        gapiScript.src = "https://apis.google.com/js/api.js";
        gapiScript.async = true;
        gapiScript.onload = setupGapi;
        gapiScript.onerror = () =>
          onError(new Error("Gagal memuat Google API client script"));
        document.body.appendChild(gapiScript);
      }
    } else {
      onDone();
    }
  });
};

export const signIn = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
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

    // BUG-04: Tangkap error dari popup (ditutup/dibatalkan user)
    const handleError = (e: CustomEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(e.detail || new Error("Login dibatalkan"));
    };

    // BUG-04: Timeout pengaman 20 detik jika Google tidak memberi respons apa pun
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new Error(
          "Login timeout: tidak ada respons dari Google. Silakan coba lagi.",
        ),
      );
    }, 20000);

    window.addEventListener("google-login-success", handleSuccess);
    window.addEventListener("google-login-error", handleError as EventListener);

    // Trigger popup (prompt empty allows Google to skip consent if user already consented)
    tokenClient.requestAccessToken({ prompt: "" });
  });
};

export const signOut = async () => {
  const userEmail = localStorage.getItem("PDO_USER_EMAIL") || "google_user";
  logActivity({
    user_email: userEmail,
    action: "LOGOUT",
  }).catch(() => {});

  const tokenStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      if (tokenObj.token && (window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(
          tokenObj.token,
          (done: any) => {
            if (done?.error) {
              console.warn(
                "[Auth] Gagal revoke token Google OAuth pada logout:",
                done.error,
              );
            }
          },
        );
      }
    } catch (e) {
      console.warn("[Auth] Error saat memproses revoke token Google:", e);
    }
  }
  localStorage.removeItem("GAPI_ACCESS_TOKEN");
  localStorage.removeItem("PDO_IS_SIGNED_IN");
  localStorage.removeItem("PDO_USER_EMAIL");
  localStorage.removeItem("PDO_USER_NAME");
  localStorage.removeItem("PDO_USER_AVATAR");
  const gapiObj = getGapi();
  if (gapiObj?.client) {
    gapiObj.client.setToken(null);
  }
};
