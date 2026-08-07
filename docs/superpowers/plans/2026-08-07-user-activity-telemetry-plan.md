# User Activity & Telemetry System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement audit event logging (`activity_logs`) and user duration/last active heartbeat telemetry (`user_profiles`) in SS_PDO.

**Architecture:** Extend `routeService.ts` with telemetry helpers (`sendUserHeartbeat`), create `useUserActivityTracking` hook for background heartbeat pulse every 3 minutes, and instrument crucial user events (`LOGIN`, `LOGOUT`, `UPDATE_BUS_DATA`, `CREATE_ROUTE`, `DELETE_ROUTE`, `SYNC_OFFLINE_QUEUE`).

**Tech Stack:** React, TypeScript, Vitest, Supabase JS Client, Google Sheets API.

## Global Constraints

- **Gold Rule #3:** Login sessions are permanent. Telemetry must never force logout or block main UI.
- **Fail-Safe:** All telemetry calls are non-blocking fire-and-forget (`.catch(() => {})`).
- **Visibility Aware:** Heartbeat pulse runs ONLY when `document.visibilityState === 'visible'`.
- **Quality Gates:** `pnpm test -- --run` and `pnpm run build` must pass after every task.

---

### Task 1: Supabase Service & Types Telemetry Helpers

**Files:**
- Modify: `src/types/supabase.ts:25-36`
- Modify: `src/services/routeService.ts:114-132`
- Modify: `src/services/routeService.test.ts`

**Interfaces:**
- Consumes: `supabase` client from `src/services/supabase.ts`
- Produces: `sendUserHeartbeat(userEmail: string, secondsInterval: number): Promise<void>` and updated `logActivity(log: ActivityLog): Promise<void>`

- [ ] **Step 1: Write failing unit test for `sendUserHeartbeat`**

Add tests to `src/services/routeService.test.ts`:

```typescript
it('sendUserHeartbeat updates user_profiles last_active_at and total_active_seconds', async () => {
  const email = 'test@example.com';
  await sendUserHeartbeat(email, 180);
  expect(supabase.from).toHaveBeenCalledWith('user_profiles');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/services/routeService.test.ts`  
Expected: FAIL ("sendUserHeartbeat is not defined")

- [ ] **Step 3: Update `src/types/supabase.ts`**

Add `last_active_at?: string;` and `total_active_seconds?: number;` to `UserProfile`.

- [ ] **Step 4: Implement `sendUserHeartbeat` & improve `logActivity` in `src/services/routeService.ts`**

```typescript
export async function sendUserHeartbeat(email: string, secondsInterval: number = 180): Promise<void> {
  if (!isSupabaseConfigured || !email) return;
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('total_active_seconds')
      .eq('email', email)
      .single();

    const currentSeconds = Number(data?.total_active_seconds || 0);

    await supabase
      .from('user_profiles')
      .update({
        last_active_at: new Date().toISOString(),
        total_active_seconds: currentSeconds + secondsInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);
  } catch (_err) {
    /* non-blocking silent failure */
  }
}
```

- [ ] **Step 5: Run tests and build to verify PASS**

Run: `pnpm test -- --run src/services/routeService.test.ts && pnpm run build`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/supabase.ts src/services/routeService.ts src/services/routeService.test.ts
git commit -m "feat(telemetry): add sendUserHeartbeat service & update UserProfile types"
```

---

### Task 2: Activity Tracking Hook (`useUserActivityTracking`)

**Files:**
- Create: `src/hooks/useUserActivityTracking.ts`
- Create: `src/hooks/__tests__/useUserActivityTracking.test.tsx`

**Interfaces:**
- Consumes: `sendUserHeartbeat` from `src/services/routeService.ts`
- Produces: `useUserActivityTracking(isSignedIn: boolean, userEmail?: string): void`

- [ ] **Step 1: Write failing unit test for `useUserActivityTracking`**

Create `src/hooks/__tests__/useUserActivityTracking.test.tsx`:

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUserActivityTracking } from '../useUserActivityTracking';

describe('useUserActivityTracking', () => {
  it('initializes without crashing', () => {
    const { result } = renderHook(() => useUserActivityTracking(true, 'user@example.com'));
    expect(result.current).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- --run src/hooks/__tests__/useUserActivityTracking.test.tsx`  
Expected: FAIL ("useUserActivityTracking not found")

- [ ] **Step 3: Implement `useUserActivityTracking.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { sendUserHeartbeat } from '../services/routeService';

const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const HEARTBEAT_SECONDS = 180;

export function useUserActivityTracking(isSignedIn: boolean, userEmail?: string) {
  const emailRef = useRef(userEmail);
  emailRef.current = userEmail;

  useEffect(() => {
    if (!isSignedIn || !emailRef.current) return;

    const email = emailRef.current;
    // Initial heartbeat on mount / login
    sendUserHeartbeat(email, 0).catch(() => {});

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        sendUserHeartbeat(emailRef.current, HEARTBEAT_SECONDS).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        sendUserHeartbeat(emailRef.current, 0).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, userEmail]);
}
```

- [ ] **Step 4: Run test to verify PASS**

Run: `pnpm test -- --run src/hooks/__tests__/useUserActivityTracking.test.tsx && pnpm run build`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUserActivityTracking.ts src/hooks/__tests__/useUserActivityTracking.test.tsx
git commit -m "feat(telemetry): add useUserActivityTracking hook for periodic heartbeat"
```

---

### Task 3: Instrumentation of Auth, Route Events, & App Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/services/googleSheets.ts`
- Modify: `src/services/routeService.ts`

**Interfaces:**
- Consumes: `logActivity`, `sendUserHeartbeat`, `useUserActivityTracking`
- Produces: Log events for `LOGIN`, `LOGOUT`, `CREATE_ROUTE`, `DELETE_ROUTE`

- [ ] **Step 1: Instrument `LOGIN` & `LOGOUT` events**

In `src/services/googleSheets.ts` (inside GIS callback):
```typescript
logActivity({
  user_email: info.email,
  action: 'LOGIN',
  details: { loginMethod: 'google_gis' }
}).catch(() => {});
```

In `src/App.tsx` (`handleLogout`):
```typescript
const userEmail = localStorage.getItem('PDO_USER_EMAIL') || '';
if (userEmail) {
  logActivity({
    user_email: userEmail,
    action: 'LOGOUT',
  }).catch(() => {});
}
```

- [ ] **Step 2: Instrument `CREATE_ROUTE` & `DELETE_ROUTE` in `routeService.ts`**

In `createRouteWithSheet`:
```typescript
logActivity({
  user_email: localStorage.getItem('PDO_USER_EMAIL') || 'admin',
  action: 'CREATE_ROUTE',
  route_code: params.routeCode,
  details: { year: params.year, month: params.month, spreadsheetId: params.spreadsheetId }
}).catch(() => {});
```

In `deleteRouteSheet`:
```typescript
logActivity({
  user_email: localStorage.getItem('PDO_USER_EMAIL') || 'admin',
  action: 'DELETE_ROUTE',
  details: { sheetId, routeId }
}).catch(() => {});
```

- [ ] **Step 3: Integrate `useUserActivityTracking` in `App.tsx`**

```typescript
const userEmail = localStorage.getItem('PDO_USER_EMAIL') || undefined;
useUserActivityTracking(isSignedIn, userEmail);
```

- [ ] **Step 4: Run tests and build**

Run: `pnpm test -- --run && pnpm run build`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/services/googleSheets.ts src/services/routeService.ts
git commit -m "feat(telemetry): instrument LOGIN, LOGOUT, CREATE_ROUTE, DELETE_ROUTE audit logs"
```

---

### Task 4: Instrumentation of Data Updates & Offline Sync

**Files:**
- Modify: `src/services/googleSheets.ts`
- Modify: `src/hooks/useOfflineSync.ts`

**Interfaces:**
- Consumes: `logActivity` from `src/services/routeService.ts`
- Produces: Audit logs for `UPDATE_BUS_DATA` & `SYNC_OFFLINE_QUEUE`

- [ ] **Step 1: Instrument `UPDATE_BUS_DATA` in `updateBusData()`**

In `src/services/googleSheets.ts` (`updateBusData` function, upon successful batchUpdate):
```typescript
const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'field_operator';
const updatedFields = Object.keys(updates).filter(k => (updates as any)[k] !== undefined);
logActivity({
  user_email: userEmail,
  action: 'UPDATE_BUS_DATA',
  details: { sheetId, tabName, rowIndex, updatedFields }
}).catch(() => {});
```

- [ ] **Step 2: Instrument `SYNC_OFFLINE_QUEUE` in `useOfflineSync.ts`**

In `src/hooks/useOfflineSync.ts` (`processQueue` loop, upon successful `updateBusData`):
```typescript
const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'field_operator';
logActivity({
  user_email: userEmail,
  action: 'SYNC_OFFLINE_QUEUE',
  details: { queueItemId: item.id, sheetId: item.sheetId, tabName: item.tabName, rowIndex: item.rowIndex }
}).catch(() => {});
```

- [ ] **Step 3: Run full test suite and build verification**

Run: `pnpm test -- --run && pnpm run build`  
Expected: All 58+ tests pass, Vite build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/services/googleSheets.ts src/hooks/useOfflineSync.ts
git commit -m "feat(telemetry): instrument UPDATE_BUS_DATA and SYNC_OFFLINE_QUEUE audit logs"
```
