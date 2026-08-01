# Supabase Route Registry & Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Supabase as a centralized Metadata Catalog (Routes & Period Sheets) and Audit/Backup Logging System without altering Google Sheets as the SSOT for operational bus data.

**Architecture:** Create `@supabase/supabase-js` client wrapper in `src/services/supabase.ts` and `src/services/routeService.ts`. Add local storage caching for offline support. Update `RouteSelectorCard.tsx` for hierarchical selection (Route -> Month/Year -> Date). Log audit events & sync queue backups asynchronously.

**Tech Stack:** React 19, TypeScript, `@supabase/supabase-js`, Vite, pnpm.

## Global Constraints
- Google Sheets MUST remain 100% Single Source of Truth (SSOT) for operational bus shift data.
- Supabase is ONLY used for Route matching catalog, User profiles, Audit logs, and Sync queue backups.
- All user-facing text MUST be in clear, polite Bahasa Indonesia.
- UI MUST support 100% offline fallback using local caching (`PDO_CACHE_ROUTES`).

---

### Task 1: Setup Supabase Database Schema & Client Service

**Files:**
- Create: `src/services/supabase.ts`
- Create: `src/services/routeService.ts`
- Create: `src/types/supabase.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`
- Produces: `getRoutes()`, `getSheetsForRoute()`, `addRoute()`, `addRouteSheet()`, `logActivity()`, `backupOfflineQueue()`

- [ ] **Step 1: Define TypeScript interfaces in `src/types/supabase.ts`**

```typescript
export interface Route {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface RouteSheet {
  id: string;
  route_id: string;
  year: number;
  month: number;
  sheet_url: string;
  created_at: string;
}

export interface ActivityLog {
  id?: string;
  user_email: string;
  action: string;
  route_code?: string;
  details?: Record<string, any>;
  created_at?: string;
}

export interface SyncQueueBackup {
  id?: string;
  user_email: string;
  sheet_id: string;
  tab_name: string;
  row_index: number;
  updates: Record<string, any>;
  status: 'pending' | 'synced' | 'failed';
}
```

- [ ] **Step 2: Create Supabase Client Initialization in `src/services/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 3: Create `src/services/routeService.ts` with offline fallback**

```typescript
import { supabase } from './supabase';
import type { Route, RouteSheet, ActivityLog, SyncQueueBackup } from '../types/supabase';

const CACHE_KEY_ROUTES = 'PDO_CACHE_ROUTES';

export async function fetchRoutesWithSheets(): Promise<Route[]> {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_sheets(*)');

    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEY_ROUTES, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[RouteService] Offline/Error fetching from Supabase, loading local cache:', err);
  }

  // Offline fallback
  const cached = localStorage.getItem(CACHE_KEY_ROUTES);
  return cached ? JSON.parse(cached) : [];
}

export async function logActivity(log: ActivityLog): Promise<void> {
  try {
    await supabase.from('activity_logs').insert([log]);
  } catch (err) {
    console.error('[RouteService] Failed to log activity:', err);
  }
}

export async function backupSyncQueue(queueItem: SyncQueueBackup): Promise<void> {
  try {
    await supabase.from('sync_queue_backups').insert([queueItem]);
  } catch (err) {
    console.error('[RouteService] Failed to backup sync queue:', err);
  }
}
```

---

### Task 2: Refactor RouteSelectorCard for Hierarchical Selection

**Files:**
- Modify: `src/components/RouteSelectorCard.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `fetchRoutesWithSheets` from `src/services/routeService`
- Produces: Hierarchical Selection UI (Route -> Month/Year -> Date)

- [ ] **Step 1: Update `RouteSelectorCard.tsx` to handle Route & Period Sheet selection**
- [ ] **Step 2: Add modal for adding new Route and Month/Year Sheet link**
- [ ] **Step 3: Connect `Dashboard.tsx` to fetch routes from `routeService`**
- [ ] **Step 4: Verify build with `pnpm run build`**
