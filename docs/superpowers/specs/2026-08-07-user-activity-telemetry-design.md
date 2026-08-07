# Design Document — User Activity & Audit Telemetry System

**Date:** 2026-08-07  
**Status:** Approved  
**Scope:** User Active Monitoring, Session Duration Heartbeat, & Crucial Activity Audit Trail  

---

## 1. Overview & Objectives

Currently, the `activity_logs` table in Supabase remains empty because the `logActivity` service function is not wired up to application events. Additionally, administrators need visibility into who is using the app, how long they actively use it, and when they were last active, without forcing interactive logouts on field operators (preserving Golden Rule #3: Permanent Login Sessions).

This system provides:
1. **Activity Audit Trail:** Real-time event logging to `activity_logs` for crucial actions (`LOGIN`, `LOGOUT`, `UPDATE_BUS_DATA`, `CREATE_ROUTE`, `DELETE_ROUTE`, `SYNC_OFFLINE_QUEUE`).
2. **User Active & Duration Telemetry:** Periodic non-blocking background heartbeat (every 3 minutes when the app tab is visible) updating `user_profiles.last_active_at` and accumulating `user_profiles.total_active_seconds`.
3. **Fail-Safe & Non-Blocking Design:** Fire-and-forget execution to prevent UI degradation, network latency, or offline state crashes.

---

## 2. Database Schema Modifications

### A. Table `user_profiles` (Add Telemetry Columns)

```sql
-- Migration snippet for Supabase SQL Editor
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_active_seconds BIGINT DEFAULT 0;
```

### B. Table `activity_logs` (Existing Schema Usage)

The `activity_logs` table schema in `src/types/supabase.ts` is used as-is:
- `user_email`: String (Required)
- `action`: `'LOGIN' | 'LOGOUT' | 'UPDATE_BUS_DATA' | 'CREATE_ROUTE' | 'DELETE_ROUTE' | 'SYNC_OFFLINE_QUEUE'` (Required)
- `route_code`: String (Optional)
- `details`: JSONB payload containing metadata (e.g. `{ unit, rowIndex, updatedFields, queueCount }`)
- `created_at`: Timestamp automatically assigned by Supabase.

---

## 3. Architecture & Service Layer Updates

### A. Telemetry & Heartbeat Helper (`src/services/routeService.ts`)

1. **`sendUserHeartbeat(email: string, secondsInterval: number): Promise<void>`**
   - Updates `user_profiles` for the given email:
     - Set `last_active_at = new Date().toISOString()`
     - Increment `total_active_seconds = total_active_seconds + secondsInterval`
   - Wrapped in a non-blocking try-catch (silent failure on network error/offline).

2. **`logActivity(log: ActivityLog): Promise<void>`**
   - Ensure `user_email` is automatically resolved from `localStorage.getItem('PDO_USER_EMAIL')` if omitted in callers.
   - Non-blocking execution.

### B. Hook `useUserActivityTracking` (`src/hooks/useUserActivityTracking.ts`)

- Custom hook used at `App.tsx` / `Dashboard.tsx` level:
- Runs an interval timer every 180 seconds (3 minutes).
- Checks `document.visibilityState === 'visible'` and `navigator.onLine`.
- If tab is visible and user is signed in, calls `sendUserHeartbeat(userEmail, 180)`.
- Listens to `visibilitychange` event: triggers an immediate heartbeat when returning to active tab after > 3 minutes.

---

## 4. Instrumentation Points (Event Mapping)

| Event | Location | Action Key | Details Payload |
|---|---|---|---|
| **User Sign In** | `LoginScreen.tsx` / `googleSheets.ts` | `LOGIN` | `{ email, loginMethod: 'google_gis' }` |
| **User Sign Out** | `App.tsx` (`handleLogout`) | `LOGOUT` | `{ email }` |
| **Single Bus Update** | `googleSheets.ts` (`updateBusData`) | `UPDATE_BUS_DATA` | `{ sheetId, tabName, rowIndex, fieldsUpdated }` |
| **Offline Sync Success** | `useOfflineSync.ts` (`processQueue`) | `SYNC_OFFLINE_QUEUE` | `{ sheetId, tabName, rowIndex, queueItemId }` |
| **Route Created** | `routeService.ts` (`createRouteWithSheet`) | `CREATE_ROUTE` | `{ routeCode, year, month, spreadsheetId }` |
| **Route Deleted** | `routeService.ts` (`deleteRouteSheet`) | `DELETE_ROUTE` | `{ routeId, sheetId }` |

---

## 5. Non-Blocking & Reliability Principles

- All telemetry calls are strictly asynchronous and non-blocking (`.catch(() => {})`).
- Offline queuing is handled gracefully: heartbeat skipped when offline; sync operations log upon successful reconnection.
- No user-facing error toasts or UI interruptions are raised by telemetry network failures.

---

## 6. Verification Plan

1. **Unit Tests:**
   - Test `sendUserHeartbeat` service function with mocked Supabase client.
   - Test `logActivity` function with complete ActivityLog payloads.
   - Test `useUserActivityTracking` hook interval & visibility state handling.
2. **Build Verification:**
   - Execute `pnpm run build` to confirm zero TypeScript / lint regressions.
3. **Manual Testing:**
   - Perform login, bus data save, route creation, and offline sync. Confirm records appear in Supabase `activity_logs` and `user_profiles`.
