import { TEXT_ERRORS } from "../constants/texts";

/**
 * Sanitizes technical error messages into clear, human-friendly Bahasa Indonesia for end-users.
 * Logs full technical details to console.error for developer debugging.
 */
export function formatUserError(
  error: unknown,
  fallbackMessage?: string,
): string | null {
  if (!error) return null;

  // Log full error trace for developers
  console.error("[System Error Details]:", error);

  // Extract raw error string/object
  const errorObj =
    typeof error === "object" && error !== null ? (error as any) : {};
  const message =
    typeof error === "string"
      ? error
      : errorObj.message ||
        errorObj.error ||
        errorObj.type ||
        JSON.stringify(error);

  const lowerMsg = String(message).toLowerCase();
  const errorType = String(errorObj.type || errorObj.error || "").toLowerCase();

  // 1. Popup closed by user or cancelled (Not a fatal error, reset state)
  if (
    errorType === "popup_closed_by_user" ||
    lowerMsg.includes("login dibatalkan")
  ) {
    return null;
  }

  // 2. Specific Google Sheet File Access / Permission Denied (Not an Auth Token error)
  if (
    lowerMsg.includes("caller does not have permission") ||
    lowerMsg.includes("does not have permission")
  ) {
    return TEXT_ERRORS.PERMISSION_DENIED_FILE;
  }

  // 3. OAuth Session Expired / Invalid Token (HTTP 401 / Invalid Credentials / Insufficient Scope)
  if (
    lowerMsg.includes("invalid authentication credentials") ||
    lowerMsg.includes("oauth 2 access token") ||
    lowerMsg.includes("insufficient") ||
    lowerMsg.includes("scope") ||
    lowerMsg.includes("401") ||
    lowerMsg.includes("unauthorized")
  ) {
    return TEXT_ERRORS.SESSION_EXPIRED;
  }

  // 3. Technical Credentials / .env missing
  if (
    lowerMsg.includes("credentials missing") ||
    lowerMsg.includes(".env") ||
    lowerMsg.includes("api key missing") ||
    lowerMsg.includes("client id missing") ||
    lowerMsg.includes("environment variables")
  ) {
    return TEXT_ERRORS.CONFIG_MISSING;
  }

  // 3. Timeout / Auth client not ready
  if (
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("token client belum siap") ||
    lowerMsg.includes("gagal memuat google identity")
  ) {
    return TEXT_ERRORS.AUTH_TIMEOUT;
  }

  // 4. Network / Offline errors
  if (
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("networkerror") ||
    lowerMsg.includes("network error")
  ) {
    return TEXT_ERRORS.NETWORK_FAILURE;
  }

  // 5. Google Sheets Column Header Mismatch (BUG-31 fix: avoid matching generic substring 'unit')
  if (
    lowerMsg.includes("tidak bisa menemukan kolom") ||
    lowerMsg.includes("no body") ||
    lowerMsg.includes("pastikan header")
  ) {
    return TEXT_ERRORS.COLUMN_MISMATCH;
  }

  // 6. Empty Sheet
  if (lowerMsg.includes("tidak ada data di sheet ini")) {
    return TEXT_ERRORS.EMPTY_SHEET;
  }

  // 7. Access / Permission Denied
  if (
    lowerMsg.includes("403") ||
    lowerMsg.includes("permissions_denied") ||
    lowerMsg.includes("hak akses")
  ) {
    return TEXT_ERRORS.PERMISSION_DENIED_GENERAL;
  }

  // Fallback to custom message or default friendly Indonesian message
  return (
    fallbackMessage ||
    TEXT_ERRORS.GENERIC_ISSUE
  );
}
