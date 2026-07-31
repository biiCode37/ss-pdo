# Persistent Auth Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove login session expiration timeout so users stay signed in indefinitely until they explicitly logout or clear app storage.

**Architecture:** Maintain a persistent login indicator in `localStorage` (`PDO_IS_SIGNED_IN = 'true'`), preserve access token in `localStorage`, update `checkSignedIn()` to return `true` persistently if the session flag exists, and perform silent token refresh in background.

**Tech Stack:** TypeScript, React 19, Google Identity Services (GIS).

## Global Constraints

- Must follow strict TypeScript (`strict: true`).
- User must remain logged in across browser reloads, device restarts, or idle timeouts until explicit `signOut()` call.
- Must preserve token refresh mechanism in background for API requests without forcing logout UI.

---

### Task 1: Update Auth Session Persistence (`src/services/googleSheets.ts`)

**Files:**
- Modify: `src/services/googleSheets.ts:35-145`

**Interfaces:**
- Consumes: `localStorage` token & session flags
- Produces: Updated `checkSignedIn()`, `signOut()`, and token callback

- [ ] **Step 1: Set persistent session flag on login callback in `initGoogleApi`**

In `src/services/googleSheets.ts`:
Set `localStorage.setItem('PDO_IS_SIGNED_IN', 'true')` when token response is received:
```typescript
localStorage.setItem('PDO_IS_SIGNED_IN', 'true');
localStorage.setItem('GAPI_ACCESS_TOKEN', JSON.stringify({
  token: tokenResponse.access_token,
  expiresAt: Date.now() + tokenResponse.expires_in * 1000
}));
```

- [ ] **Step 2: Update `checkSignedIn()` to return `true` persistently if session flag exists**

In `src/services/googleSheets.ts`:
```typescript
export const checkSignedIn = (): boolean => {
  const isPersistentSignedIn = localStorage.getItem('PDO_IS_SIGNED_IN') === 'true';
  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');

  if (!isPersistentSignedIn && !tokenStr) {
    return false;
  }

  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      gapi.client.setToken({ access_token: tokenObj.token });
      
      const remainingMs = tokenObj.expiresAt - Date.now();
      if (remainingMs > 0) {
        startTokenRefreshTimer(remainingMs);
      } else if (tokenClient) {
        // Silent token refresh in background without clearing session
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (e) {
      // Ignore JSON parse error, stay signed in
    }
  }

  return true;
};
```

- [ ] **Step 3: Clear persistent session flag in `signOut()`**

In `src/services/googleSheets.ts`:
```typescript
export const signOut = async () => {
  const tokenStr = localStorage.getItem('GAPI_ACCESS_TOKEN');
  if (tokenStr) {
    try {
      const tokenObj = JSON.parse(tokenStr);
      if ((window as any).google) {
        (window as any).google.accounts.oauth2.revoke(tokenObj.token, () => {});
      }
    } catch (e) {}
  }
  localStorage.removeItem('GAPI_ACCESS_TOKEN');
  localStorage.removeItem('PDO_IS_SIGNED_IN');
  gapi.client.setToken(null);
};
```

- [ ] **Step 4: Verify type safety with `pnpm run build`**

Run: `pnpm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/googleSheets.ts
git commit -m "feat(auth): enable persistent login session without automatic timeout"
```
