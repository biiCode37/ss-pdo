# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Supabase as a Metadata Catalog (Routes & Period Sheets), User Profile Registry, Audit Logging System, and Offline Sync Backup Queue without altering Google Sheets as the SSOT for operational bus data.

**Architecture:** Install `@supabase/supabase-js`, initialize client (`src/services/supabase.ts`), define TypeScript types (`src/types/supabase.ts`), implement service layer with local storage caching (`src/services/routeService.ts`), and update `LoginScreen.tsx` & `RouteSelectorCard.tsx`.

**Tech Stack:** React 19, TypeScript, `@supabase/supabase-js`, Vite, pnpm.

## Global Constraints
- Google Sheets MUST remain 100% SSOT for operational bus shift data.
- User session MUST remain permanent with silent token refresh without forcing logouts.
- All user-facing text MUST be in clear, polite Bahasa Indonesia.
- UI MUST support 100% offline fallback using local caching (`PDO_CACHE_ROUTES`).
- Always use `pnpm` (`pnpm add`, `pnpm run build`).
- Auto-increment `id` (bigint) + `uuid` (UUID) on all tables.
- `activity_logs.route_code` MUST be text snapshot without FK.

---

### Task 1: Install `@supabase/supabase-js` & Define TypeScript Types

**Files:**
- Modify: `package.json`
- Create: `src/types/supabase.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`
- Produces: TypeScript interfaces (`Route`, `RouteSheet`, `UserProfile`, `ActivityLog`, `SyncQueueBackup`)

- [ ] **Step 1: Install `@supabase/supabase-js`**

Run: `pnpm add @supabase/supabase-js`

- [ ] **Step 2: Create `src/types/supabase.ts` with complete type definitions**

```typescript
export interface Route {
  id: number;
  uuid: string;
  route_code: string;
  route_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  route_sheets?: RouteSheet[];
}

export interface RouteSheet {
  id: number;
  uuid: string;
  route_id: number;
  year: number;
  month: number;
  spreadsheet_id: string;
  sheet_url: string;
  tab_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id?: number;
  uuid?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'petugas';
  is_active?: boolean;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id?: number;
  uuid?: string;
  user_email: string;
  action: string;
  route_code?: string;
  details?: Record<string, any>;
  created_at?: string;
}

export interface SyncQueueBackup {
  id?: number;
  uuid?: string;
  user_email: string;
  spreadsheet_id: string;
  tab_name: string;
  row_index: number;
  payload: Record<string, any>;
  status: 'pending' | 'synced' | 'failed';
  error_message?: string;
  created_at?: string;
  synced_at?: string;
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `pnpm run build`

- [ ] **Step 4: Commit Task 1**

```bash
git add package.json pnpm-lock.yaml src/types/supabase.ts
git commit -m "feat(supabase): install @supabase/supabase-js and add typescript types"
```

---

### Task 2: Implement Supabase Client & Route Service Layer

**Files:**
- Create: `src/services/supabase.ts`
- Create: `src/services/routeService.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `src/types/supabase.ts`
- Produces: `supabase`, `fetchRoutesWithSheets()`, `upsertUserProfile()`, `logActivity()`, `backupSyncQueue()`

- [ ] **Step 1: Create `src/services/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- [ ] **Step 2: Create `src/services/routeService.ts` with offline fallback**

```typescript
import { supabase } from './supabase';
import type { Route, UserProfile, ActivityLog, SyncQueueBackup } from '../types/supabase';

const CACHE_KEY_ROUTES = 'PDO_CACHE_ROUTES';

export async function fetchRoutesWithSheets(): Promise<Route[]> {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, route_sheets(*)')
      .eq('is_active', true)
      .order('route_code', { ascending: true });

    if (error) throw error;
    if (data) {
      localStorage.setItem(CACHE_KEY_ROUTES, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[RouteService] Offline/Error fetching from Supabase, loading local cache:', err);
  }

  const cached = localStorage.getItem(CACHE_KEY_ROUTES);
  return cached ? JSON.parse(cached) : [];
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { email: string; full_name: string }): Promise<void> {
  try {
    const { error } = await supabase.from('user_profiles').upsert(
      [
        {
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'email' }
    );
    if (error) console.error('[RouteService] Error upserting user profile:', error);
  } catch (err) {
    console.warn('[RouteService] Failed to upsert user profile (offline?):', err);
  }
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

- [ ] **Step 3: Verify build**

Run: `pnpm run build`

- [ ] **Step 4: Commit Task 2**

```bash
git add src/services/supabase.ts src/services/routeService.ts
git commit -m "feat(supabase): create supabase client and route service with offline fallback"
```

---

### Task 3: Integrate User Profile Sync in Login Flow

**Files:**
- Modify: `src/components/LoginScreen.tsx`
- Modify: `src/App.tsx` (or auth handler)

**Interfaces:**
- Consumes: `upsertUserProfile` from `src/services/routeService.ts`
- Produces: Automatic user profile sync upon successful Google Sign-In

- [ ] **Step 1: Trigger `upsertUserProfile` after successful Google Login**

Call `upsertUserProfile` with Google user's email and full name upon successful authentication.

- [ ] **Step 2: Verify build**

Run: `pnpm run build`

- [ ] **Step 3: Commit Task 3**

```bash
git add src/components/LoginScreen.tsx src/App.tsx
git commit -m "feat(auth): integrate user profile upsert on google login"
```

---

### Task 4: Connect RouteSelectorCard & Dashboard to Metadata Service

**Files:**
- Modify: `src/components/RouteSelectorCard.tsx`
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `fetchRoutesWithSheets` from `src/services/routeService.ts`
- Produces: Dynamic route & period sheet selection driven by Supabase / cache

- [ ] **Step 1: Load routes using `fetchRoutesWithSheets` in Dashboard/RouteSelectorCard**
- [ ] **Step 2: Handle hierarchical selection (Route -> Month/Year -> Date)**
- [ ] **Step 3: Verify build**

Run: `pnpm run build`

- [ ] **Step 4: Commit Task 4**

```bash
git add src/components/RouteSelectorCard.tsx src/components/Dashboard.tsx
git commit -m "feat(ui): update route selector and dashboard with supabase metadata service"
```

---

### Task 5: Final Verification & Clean Build

**Files:**
- All modified files

- [ ] **Step 1: Run clean build**

Run: `pnpm run build`

- [ ] **Step 2: Commit final verification**

```bash
git commit --allow-empty -m "chore: verify supabase integration build"
```
