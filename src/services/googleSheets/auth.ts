/**
 * Facade Layanan Autentikasi Google Sheets & GIS
 * Mere-ekspor modul authGis (Google Identity Services) dan authSession (Token & Session Lifecycle)
 */

export {
  getGapi,
  getGoogleCreds,
  hasGoogleCreds,
  getTokenClient,
  setTokenClient,
  initGoogleApi,
  signIn,
  signOut,
} from "./authGis";

export {
  ensureValidToken,
  refreshTokenInteractiveOrSilent,
  reauthenticateSession,
  withAuthRetry,
  fetchGoogleUserProfile,
  checkSignedInAsync,
  startTokenRefreshTimer,
  stopTokenRefreshTimer,
} from "./authSession";
