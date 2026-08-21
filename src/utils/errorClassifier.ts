/**
 * Centralized error classifier for Google API, Supabase, and Network errors.
 * // ponytail: unified error classification avoids diverging auth/network checks across services and hooks
 */

/**
 * Checks whether an error is related to Google OAuth / API authentication failure.
 * Distinguishes authentication errors (expired token, 401, insufficient scopes)
 * from file authorization/permission errors (403 caller does not have permission to sheet).
 */
export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const e = err as any;

  const status = e.status || e.result?.error?.code || e.code;
  const statusStr = String(e.statusText || e.result?.error?.status || '').toUpperCase();
  const message = String(e.message || e.result?.error?.message || e.error?.message || '').toLowerCase();

  // 401 is ALWAYS an authentication token error
  if (status === 401 || statusStr === 'UNAUTHENTICATED') return true;

  // File permission error ("The caller does not have permission") is NOT an auth token error!
  // It means the user is logged in, but their Google account doesn't have access to this specific Google Sheet file.
  if (message.includes('caller does not have permission') || message.includes('does not have permission')) {
    return false;
  }

  // 403 is an auth error ONLY IF it is due to insufficient scopes or invalid credentials
  if (status === 403 || statusStr === 'PERMISSION_DENIED' || statusStr === 'FORBIDDEN') {
    return (
      message.includes('insufficient') ||
      message.includes('scope') ||
      message.includes('invalid credentials') ||
      message.includes('invalid authentication') ||
      message.includes('token expired') ||
      message.includes('token has expired') ||
      message.includes('access token') ||
      message.includes('oauth')
    );
  }

  return (
    message.includes('401') ||
    message.includes('unauthenticated') ||
    message.includes('invalid credentials') ||
    message.includes('invalid authentication') ||
    message.includes('token expired') ||
    message.includes('token has expired') ||
    message.includes('credentials missing') ||
    message.includes('api credentials missing') ||
    message.includes('access token') ||
    message.includes('oauth')
  );
}

/**
 * Checks whether an error is caused by network disruption or offline status.
 */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network error')) {
      return true;
    }
  }
  const e = err as any;
  if (e && (e.status !== undefined || e.result?.error?.code !== undefined || e.code !== undefined)) {
    return false;
  }
  return true;
}
