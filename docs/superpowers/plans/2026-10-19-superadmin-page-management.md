# Rencana Implementasi: Fitur Manajemen Halaman Superadmin (Realtime Page Access Control)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur khusus Superadmin untuk mengontrol ketersediaan (*enable/disable*) halaman dan sub-halaman aplikasi secara realtime, dengan tampilan layar pemeliharaan ramah untuk user non-superadmin dan banner pratinjau khusus superadmin.

**Architecture:** Menggunakan tabel `app_page_settings` di Supabase dengan RLS dan WebSocket `supabase_realtime` + *local cache fallback*. State dikelola melalui `PageAccessContext` / `usePageAccess()` hook yang mengintersepsi render view dan tab di `Dashboard.tsx`, serta menu terproteksi di `ProfileMenuSheet.tsx`.

**Tech Stack:** React 18, TypeScript Strict, Supabase Realtime (`@supabase/supabase-js`), Lucide React, Vitest, Testing Library.

## Global Constraints
- Seluruh teks antarmuka (label, pesan, notifikasi) WAJIB didefinisikan di `src/constants/texts/text_page_management.ts` (dilarang *hardcoded string*).
- Halaman "Manajemen Halaman" hanya boleh muncul dan diakses oleh `role === 'superadmin'`.
- Halaman "Manajemen Halaman" diproteksi secara permanen dari opsi *disable* (mencegah *self-lockout*).
- User non-superadmin pada halaman nonaktif hanya melihat pesan: *"Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan"*.
- Mendukung penuh Light Mode & Dark Mode serta Mobile-First layout.
- Seluruh commit wajib menggunakan pesan ringkas Conventional Commits (≤ 50 karakter).

---

### Task 1: Kamus Teks Sentral & Uji Integritas

**Files:**
- Create: `src/constants/texts/text_page_management.ts`
- Modify: `src/constants/texts/index.ts:1-25`
- Test: `src/constants/texts/texts.test.ts:1-50`

**Interfaces:**
- Produces: `TEXT_PAGE_MANAGEMENT` constant containing all strings for page management, maintenance state, banners, tabs, and alerts.

- [ ] **Step 1: Tulis tes kamus teks di `src/constants/texts/texts.test.ts`**

Tambahkan uji untuk memastikan modul `TEXT_PAGE_MANAGEMENT` terdefinisi dan memiliki kunci-kunci wajib:
```typescript
import { TEXT_PAGE_MANAGEMENT } from './text_page_management';

describe('TEXT_PAGE_MANAGEMENT Integrity', () => {
  it('harus mendefinisikan header dan pesan pemeliharaan wajib', () => {
    expect(TEXT_PAGE_MANAGEMENT.TITLE).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.MAINTENANCE.DEFAULT_MESSAGE).toBe(
      'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'
    );
    expect(TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.TEXT).toBeDefined();
    expect(TEXT_PAGE_MANAGEMENT.CATEGORIES.ALL).toBeDefined();
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: FAIL ("Cannot find module './text_page_management'")

- [ ] **Step 3: Implementasi `src/constants/texts/text_page_management.ts` dan ekspor di `index.ts`**

Buat file `src/constants/texts/text_page_management.ts`:
```typescript
export const TEXT_PAGE_MANAGEMENT = {
  TITLE: 'Manajemen Halaman & Fitur',
  SUBTITLE: 'Kontrol ketersediaan halaman dan fitur aplikasi secara realtime',
  SUPERADMIN_BADGE: 'Superadmin Access Only',
  CATEGORIES: {
    ALL: 'Semua',
    PAGE: 'Halaman Utama',
    TAB: 'Sub-Halaman & Tab',
    MODAL: 'Fitur & Modal',
  },
  STATUS: {
    ACTIVE: 'Aktif',
    MAINTENANCE: 'Pemeliharaan',
    LOCKED: 'Terkunci',
    ACTIVE_DESC: 'Dapat diakses oleh seluruh pengguna',
    MAINTENANCE_DESC: 'Hanya dapat diakses oleh Superadmin',
    LOCKED_DESC: 'Halaman inti sistem tidak dapat dinonaktifkan',
  },
  MAINTENANCE: {
    TITLE: 'Sedang Dalam Pemeliharaan',
    DEFAULT_MESSAGE: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
    BACK_TO_HOME: 'Kembali ke Dashboard',
  },
  SUPERADMIN_BANNER: {
    TEXT: 'Mode Pratinjau Superadmin: Halaman ini sedang dinonaktifkan untuk pengguna lain.',
    MANAGE_BTN: 'Kelola Akses',
  },
  TOAST: {
    UPDATE_SUCCESS: 'Status halaman berhasil diperbarui',
    UPDATE_FAILED: 'Gagal memperbarui status halaman',
    FETCH_FAILED: 'Gagal memuat konfigurasi halaman',
  },
  PROFILE_MENU: {
    PAGE_MANAGEMENT: 'Manajemen Halaman',
    PAGE_MANAGEMENT_DESC: 'Atur aktif/nonaktif halaman & fitur aplikasi',
  },
} as const;
```

Ekspor di `src/constants/texts/index.ts`:
```typescript
export { TEXT_PAGE_MANAGEMENT } from './text_page_management';
```

- [ ] **Step 4: Jalankan tes dan pastikan lulus**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/constants/texts/text_page_management.ts src/constants/texts/index.ts src/constants/texts/texts.test.ts
git commit -m "feat: kamus teks page management"
```

---

### Task 2: Skema Database & Types

**Files:**
- Create: `supabase/migrations/20261019000001_create_app_page_settings.sql`
- Create: `src/types/pageManagement.ts`

**Interfaces:**
- Produces:
  - `PageKey` type
  - `PageCategory` type
  - `AppPageSetting` interface
  - `DEFAULT_PAGE_SETTINGS` constant

- [ ] **Step 1: Buat file definisi types `src/types/pageManagement.ts`**

```typescript
export type PageKey =
  | 'dashboard'
  | 'regional_monitoring'
  | 'user_management'
  | 'input'
  | 'analytics'
  | 'units'
  | 'regional_summary'
  | 'regional_wa_report'
  | 'a2_report'
  | 'accumulation';

export type PageCategory = 'page' | 'tab' | 'modal';

export interface AppPageSetting {
  page_key: PageKey;
  page_name: string;
  category: PageCategory;
  is_enabled: boolean;
  disabled_message: string;
  is_locked?: boolean; // True jika halaman sistem yang tidak boleh dimatikan
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_PAGE_SETTINGS: AppPageSetting[] = [
  {
    page_key: 'dashboard',
    page_name: 'Dashboard Operasional Rute',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_monitoring',
    page_name: 'Monitoring 18 Rute Wilayah',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'user_management',
    page_name: 'Manajemen Pengguna RBAC',
    category: 'page',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'input',
    page_name: 'Form Input Bus SS PDO',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'analytics',
    page_name: 'Analitik & Capaian Rute',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'units',
    page_name: 'Daftar Unit Armada',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_summary',
    page_name: 'Tab Rekap Wilayah',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'regional_wa_report',
    page_name: 'Tab Generator Laporan WA',
    category: 'tab',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'a2_report',
    page_name: 'Form Laporan Operasional A2',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
  {
    page_key: 'accumulation',
    page_name: 'Rekap Akumulasi Periode',
    category: 'modal',
    is_enabled: true,
    disabled_message: 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  },
];
```

- [ ] **Step 2: Buat migrasi SQL `supabase/migrations/20261019000001_create_app_page_settings.sql`**

```sql
-- Migration: Tabel Manajemen Halaman & Fitur Superadmin (Realtime Access Control)
CREATE TABLE IF NOT EXISTS public.app_page_settings (
  page_key text PRIMARY KEY,
  page_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('page', 'tab', 'modal')),
  is_enabled boolean NOT NULL DEFAULT true,
  disabled_message text DEFAULT 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan',
  updated_at timestamptz DEFAULT now(),
  updated_by text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.app_page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read app_page_settings" ON public.app_page_settings;
CREATE POLICY "Allow read app_page_settings" ON public.app_page_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow modify app_page_settings for superadmin" ON public.app_page_settings;
CREATE POLICY "Allow modify app_page_settings for superadmin" ON public.app_page_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.email = auth.jwt() ->> 'email'
        AND user_profiles.role_id = 1
        AND user_profiles.is_active = true
    )
  );

-- Seed Initial Rows
INSERT INTO public.app_page_settings (page_key, page_name, category, is_enabled, disabled_message)
VALUES
  ('dashboard', 'Dashboard Operasional Rute', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_monitoring', 'Monitoring 18 Rute Wilayah', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('user_management', 'Manajemen Pengguna RBAC', 'page', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('input', 'Form Input Bus SS PDO', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('analytics', 'Analitik & Capaian Rute', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('units', 'Daftar Unit Armada', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_summary', 'Tab Rekap Wilayah', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('regional_wa_report', 'Tab Generator Laporan WA', 'tab', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('a2_report', 'Form Laporan Operasional A2', 'modal', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'),
  ('accumulation', 'Rekap Akumulasi Periode', 'modal', true, 'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan')
ON CONFLICT (page_key) DO NOTHING;

-- Aktifkan Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_page_settings;
```

- [ ] **Step 3: Commit**

Run:
```bash
git add src/types/pageManagement.ts supabase/migrations/20261019000001_create_app_page_settings.sql
git commit -m "feat: schema & types app_page_settings"
```

---

### Task 3: Servis Manajemen Halaman (`pageManagementService.ts`)

**Files:**
- Create: `src/services/pageManagementService.ts`
- Test: `src/services/pageManagementService.test.ts`

**Interfaces:**
- Consumes: `supabase` from `@/services/supabase`, types from `@/types/pageManagement`
- Produces:
  - `fetchPageSettings(): Promise<AppPageSetting[]>`
  - `updatePageSetting(pageKey: PageKey, isEnabled: boolean, email: string): Promise<boolean>`
  - `subscribeToPageSettings(callback: (setting: AppPageSetting) => void): () => void`

- [ ] **Step 1: Tulis tes unit untuk `pageManagementService` di `src/services/pageManagementService.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPageSettings, updatePageSetting } from './pageManagementService';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
  isSupabaseConfigured: true,
}));

describe('pageManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('mengambil settings dari supabase dan menyimpannya di localStorage', async () => {
    const mockData = [
      { page_key: 'input', page_name: 'Form Input', category: 'tab', is_enabled: true },
    ];
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('input');
    expect(localStorage.getItem('APP_PAGE_SETTINGS')).toContain('input');
  });

  it('menggunakan fallback localStorage jika supabase error', async () => {
    const cached = [{ page_key: 'analytics', page_name: 'Analitik', category: 'tab', is_enabled: false }];
    localStorage.setItem('APP_PAGE_SETTINGS', JSON.stringify(cached));

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
    });

    const result = await fetchPageSettings();
    expect(result).toHaveLength(1);
    expect(result[0].page_key).toBe('analytics');
    expect(result[0].is_enabled).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/services/pageManagementService.test.ts`  
Expected: FAIL ("Cannot find module './pageManagementService'")

- [ ] **Step 3: Implementasikan `src/services/pageManagementService.ts`**

```typescript
import { supabase, isSupabaseConfigured } from './supabase';
import {
  AppPageSetting,
  DEFAULT_PAGE_SETTINGS,
  PageKey,
} from '@/types/pageManagement';

const CACHE_KEY = 'APP_PAGE_SETTINGS';

export async function fetchPageSettings(): Promise<AppPageSetting[]> {
  if (!isSupabaseConfigured) {
    return getCachedSettings();
  }

  try {
    const { data, error } = await supabase
      .from('app_page_settings')
      .select('*')
      .order('page_name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getCachedSettings();
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data as AppPageSetting[];
  } catch (err) {
    console.warn('[pageManagementService] Gagal fetch settings, fallback cache:', err);
    return getCachedSettings();
  }
}

export function getCachedSettings(): AppPageSetting[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as AppPageSetting[];
    }
  } catch {
    // Abaikan parse error, gunakan default
  }
  return DEFAULT_PAGE_SETTINGS;
}

export async function updatePageSetting(
  pageKey: PageKey,
  isEnabled: boolean,
  updatedBy: string
): Promise<boolean> {
  // Guard khusus: cegah mutasi pada halaman yang diproteksi
  if (pageKey === ('page_management' as PageKey)) {
    return false;
  }

  // Update cache lokal langsung (optimistic)
  const current = getCachedSettings();
  const updated = current.map((item) =>
    item.page_key === pageKey
      ? { ...item, is_enabled: isEnabled, updated_at: new Date().toISOString(), updated_by: updatedBy }
      : item
  );
  localStorage.setItem(CACHE_KEY, JSON.stringify(updated));

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('app_page_settings')
      .update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq('page_key', pageKey);

    if (error) {
      console.warn('[pageManagementService] Gagal update status di database:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[pageManagementService] Error updating page setting:', err);
    return false;
  }
}

export function subscribeToPageSettings(
  onChange: (setting: AppPageSetting) => void
): () => void {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const channel = supabase
    .channel('realtime:app_page_settings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_page_settings',
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          const newSetting = payload.new as AppPageSetting;
          onChange(newSetting);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

- [ ] **Step 4: Jalankan tes dan pastikan lulus**

Run: `pnpm vitest run src/services/pageManagementService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/services/pageManagementService.ts src/services/pageManagementService.test.ts
git commit -m "feat: service app page management"
```

---

### Task 4: State Management & Context (`PageAccessContext`)

**Files:**
- Create: `src/context/PageAccessContext.tsx`
- Test: `src/context/PageAccessContext.test.tsx`

**Interfaces:**
- Consumes: `pageManagementService`, types `PageKey`, `AppPageSetting`
- Produces:
  - `PageAccessProvider`
  - `usePageAccess()` hook:
    - `pageSettings: Record<PageKey, AppPageSetting>`
    - `canAccessPage: (pageKey: PageKey, userRole?: string) => boolean`
    - `isUnderMaintenance: (pageKey: PageKey) => boolean`
    - `togglePageStatus: (pageKey: PageKey, nextStatus: boolean) => Promise<boolean>`

- [ ] **Step 1: Tulis tes unit untuk `PageAccessContext` di `src/context/PageAccessContext.test.tsx`**

```typescript
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PageAccessProvider, usePageAccess } from './PageAccessContext';

vi.mock('@/services/pageManagementService', () => ({
  fetchPageSettings: vi.fn().mockResolvedValue([
    { page_key: 'regional_monitoring', page_name: 'Monitoring', category: 'page', is_enabled: false },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    { page_key: 'regional_monitoring', page_name: 'Monitoring', category: 'page', is_enabled: false },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
  subscribeToPageSettings: vi.fn().mockReturnValue(() => {}),
}));

describe('PageAccessContext', () => {
  it('mengizinkan akses untuk superadmin meskipun halaman disabled', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PageAccessProvider>{children}</PageAccessProvider>
    );

    const { result } = renderHook(() => usePageAccess(), { wrapper });

    // Superadmin bypass
    expect(result.current.canAccessPage('regional_monitoring', 'superadmin')).toBe(true);
    // Non-superadmin blocked
    expect(result.current.canAccessPage('regional_monitoring', 'admin')).toBe(false);
    expect(result.current.canAccessPage('regional_monitoring', 'pdo')).toBe(false);
    // Identifikasi maintenance
    expect(result.current.isUnderMaintenance('regional_monitoring')).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/context/PageAccessContext.test.tsx`  
Expected: FAIL ("Cannot find module './PageAccessContext'")

- [ ] **Step 3: Implementasikan `src/context/PageAccessContext.tsx`**

```typescript
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { PageKey, AppPageSetting, DEFAULT_PAGE_SETTINGS } from '@/types/pageManagement';
import {
  fetchPageSettings,
  getCachedSettings,
  updatePageSetting,
  subscribeToPageSettings,
} from '@/services/pageManagementService';

interface PageAccessContextType {
  pageSettings: Record<PageKey, AppPageSetting>;
  isLoading: boolean;
  canAccessPage: (pageKey: PageKey, userRole?: string | null) => boolean;
  isUnderMaintenance: (pageKey: PageKey) => boolean;
  togglePageStatus: (pageKey: PageKey, nextStatus: boolean) => Promise<boolean>;
}

const PageAccessContext = createContext<PageAccessContextType | null>(null);

export const PageAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settingsMap, setSettingsMap] = useState<Record<PageKey, AppPageSetting>>(() => {
    const initial = getCachedSettings();
    return initial.reduce((acc, curr) => {
      acc[curr.page_key] = curr;
      return acc;
    }, {} as Record<PageKey, AppPageSetting>);
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchPageSettings().then((list) => {
      if (isMounted) {
        const nextMap = { ...settingsMap };
        list.forEach((item) => {
          nextMap[item.page_key] = item;
        });
        setSettingsMap(nextMap);
        setIsLoading(false);
      }
    });

    const unsubscribe = subscribeToPageSettings((newSetting) => {
      setSettingsMap((prev) => ({
        ...prev,
        [newSetting.page_key]: newSetting,
      }));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const canAccessPage = useCallback(
    (pageKey: PageKey, userRole?: string | null): boolean => {
      if (userRole === 'superadmin') return true;
      const setting = settingsMap[pageKey];
      return setting ? setting.is_enabled : true;
    },
    [settingsMap]
  );

  const isUnderMaintenance = useCallback(
    (pageKey: PageKey): boolean => {
      const setting = settingsMap[pageKey];
      return setting ? !setting.is_enabled : false;
    },
    [settingsMap]
  );

  const togglePageStatus = useCallback(
    async (pageKey: PageKey, nextStatus: boolean): Promise<boolean> => {
      const email = localStorage.getItem('PDO_USER_EMAIL') || 'superadmin';
      
      // Optimistic update
      setSettingsMap((prev) => {
        const existing = prev[pageKey];
        if (!existing) return prev;
        return {
          ...prev,
          [pageKey]: { ...existing, is_enabled: nextStatus, updated_by: email },
        };
      });

      const success = await updatePageSetting(pageKey, nextStatus, email);
      return success;
    },
    []
  );

  const value = useMemo(
    () => ({
      pageSettings: settingsMap,
      isLoading,
      canAccessPage,
      isUnderMaintenance,
      togglePageStatus,
    }),
    [settingsMap, isLoading, canAccessPage, isUnderMaintenance, togglePageStatus]
  );

  return <PageAccessContext.Provider value={value}>{children}</PageAccessContext.Provider>;
};

export function usePageAccess() {
  const context = useContext(PageAccessContext);
  if (!context) {
    throw new Error('usePageAccess must be used within PageAccessProvider');
  }
  return context;
}
```

- [ ] **Step 4: Jalankan tes dan pastikan lulus**

Run: `pnpm vitest run src/context/PageAccessContext.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/context/PageAccessContext.tsx src/context/PageAccessContext.test.tsx
git commit -m "feat: context state page access"
```

---

### Task 5: Komponen Layar Pemeliharaan & Banner Superadmin

**Files:**
- Create: `src/components/pageManagement/PageDisabledState.tsx`
- Create: `src/components/pageManagement/SuperadminMaintenanceBanner.tsx`
- Test: `src/components/pageManagement/PageDisabledState.test.tsx`
- Test: `src/components/pageManagement/SuperadminMaintenanceBanner.test.tsx`

**Interfaces:**
- Produces:
  - `<PageDisabledState message?: string onBack?: () => void />`
  - `<SuperadminMaintenanceBanner onManageAccess?: () => void />`

- [ ] **Step 1: Tulis tes untuk `PageDisabledState` dan `SuperadminMaintenanceBanner`**

`src/components/pageManagement/PageDisabledState.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageDisabledState } from './PageDisabledState';

describe('PageDisabledState', () => {
  it('menampilkan teks pemeliharaan resmi dan tombol kembali', () => {
    const handleBack = vi.fn();
    render(<PageDisabledState onBack={handleBack} />);

    expect(
      screen.getByText('Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan')
    ).toBeInTheDocument();

    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
});
```

`src/components/pageManagement/SuperadminMaintenanceBanner.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuperadminMaintenanceBanner } from './SuperadminMaintenanceBanner';

describe('SuperadminMaintenanceBanner', () => {
  it('menampilkan teks pratinjau superadmin', () => {
    const onManage = vi.fn();
    render(<SuperadminMaintenanceBanner onManageAccess={onManage} />);

    expect(
      screen.getByText(/Mode Pratinjau Superadmin/i)
    ).toBeInTheDocument();

    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onManage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/components/pageManagement/PageDisabledState.test.tsx src/components/pageManagement/SuperadminMaintenanceBanner.test.tsx`  
Expected: FAIL ("Cannot find module")

- [ ] **Step 3: Implementasikan `PageDisabledState.tsx` dan `SuperadminMaintenanceBanner.tsx`**

`src/components/pageManagement/PageDisabledState.tsx`:
```typescript
import React from 'react';
import { Wrench, ArrowLeft } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  message?: string;
  onBack?: () => void;
}

export const PageDisabledState: React.FC<Props> = ({ message, onBack }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b',
          marginBottom: '20px',
        }}
      >
        <Wrench size={32} />
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '10px',
        }}
      >
        {TEXT_PAGE_MANAGEMENT.MAINTENANCE.TITLE}
      </h2>

      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'var(--text-secondary)',
          maxWidth: '380px',
          marginBottom: '28px',
        }}
      >
        {message || TEXT_PAGE_MANAGEMENT.MAINTENANCE.DEFAULT_MESSAGE}
      </p>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'var(--bg-secondary, #1e293b)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <ArrowLeft size={16} />
          {TEXT_PAGE_MANAGEMENT.MAINTENANCE.BACK_TO_HOME}
        </button>
      )}
    </div>
  );
};
```

`src/components/pageManagement/SuperadminMaintenanceBanner.tsx`:
```typescript
import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  onManageAccess?: () => void;
}

export const SuperadminMaintenanceBanner: React.FC<Props> = ({ onManageAccess }) => {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        backgroundColor: '#78350f',
        color: '#fef3c7',
        borderBottom: '1px solid #b45309',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12.5px',
        fontWeight: 500,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
        <span>{TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.TEXT}</span>
      </div>

      {onManageAccess && (
        <button
          type="button"
          onClick={onManageAccess}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: '#b45309',
            color: '#ffffff',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Settings size={13} />
          {TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.MANAGE_BTN}
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Jalankan tes dan pastikan lulus**

Run: `pnpm vitest run src/components/pageManagement/PageDisabledState.test.tsx src/components/pageManagement/SuperadminMaintenanceBanner.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/pageManagement/PageDisabledState.tsx src/components/pageManagement/SuperadminMaintenanceBanner.tsx src/components/pageManagement/PageDisabledState.test.tsx src/components/pageManagement/SuperadminMaintenanceBanner.test.tsx
git commit -m "feat: disabled state & superadmin banner"
```

---

### Task 6: Komponen Halaman Manajemen Halaman (`PageManagementPage.tsx`)

**Files:**
- Create: `src/components/pageManagement/PageManagementPage.tsx`
- Create: `src/components/pageManagement/index.ts`
- Test: `src/components/pageManagement/PageManagementPage.test.tsx`

**Interfaces:**
- Consumes: `usePageAccess`, `TEXT_PAGE_MANAGEMENT`, `showSuccessToast`, `showErrorToast`
- Produces: `<PageManagementPage onBack={() => void} />`

- [ ] **Step 1: Tulis tes untuk `PageManagementPage`**

`src/components/pageManagement/PageManagementPage.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageManagementPage } from './PageManagementPage';
import { PageAccessProvider } from '@/context/PageAccessContext';

vi.mock('@/services/pageManagementService', () => ({
  fetchPageSettings: vi.fn().mockResolvedValue([
    { page_key: 'input', page_name: 'Form Input Bus', category: 'tab', is_enabled: true },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    { page_key: 'input', page_name: 'Form Input Bus', category: 'tab', is_enabled: true },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
  subscribeToPageSettings: vi.fn().mockReturnValue(() => {}),
}));

describe('PageManagementPage', () => {
  it('merender header dan toggle switch', async () => {
    const handleBack = vi.fn();
    render(
      <PageAccessProvider>
        <PageManagementPage onBack={handleBack} />
      </PageAccessProvider>
    );

    expect(screen.getByText('Manajemen Halaman & Fitur')).toBeInTheDocument();
    expect(screen.getByText('Form Input Bus')).toBeInTheDocument();

    const backButton = screen.getByTestId('page-management-back-btn');
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/components/pageManagement/PageManagementPage.test.tsx`  
Expected: FAIL ("Cannot find module")

- [ ] **Step 3: Implementasikan `src/components/pageManagement/PageManagementPage.tsx` dan `index.ts`**

Implementasikan `PageManagementPage.tsx`:
- Header dengan tombol kembali & badge superadmin.
- Segmented tab filter: Semua | Halaman | Tab | Fitur Modal.
- Baris khusus proteksi self-lockout: Manajemen Halaman (LOCKED).
- Kartu-kartu item halaman dengan toggle switch fisik iOS dan animasi pegas.
- Umpan balik toast notifikasi SweetAlert2 saat toggle ditekan.

- [ ] **Step 4: Jalankan tes dan pastikan lulus**

Run: `pnpm vitest run src/components/pageManagement/PageManagementPage.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/pageManagement/PageManagementPage.tsx src/components/pageManagement/index.ts src/components/pageManagement/PageManagementPage.test.tsx
git commit -m "feat: page management page component"
```

---

### Task 7: Integrasi ke Navigasi, Router, dan Menu Profil

**Files:**
- Modify: `src/App.tsx:1-125` (bungkus dengan `PageAccessProvider`)
- Modify: `src/components/profileMenu/ProfileAdminSection.tsx:1-110` (tambahkan menu Manajemen Halaman khusus Superadmin)
- Modify: `src/components/profileMenu/types.ts:1-50` (tambahkan `onOpenPageManagement`)
- Modify: `src/components/profileMenu/ProfileMenuSheet.tsx:1-150`
- Modify: `src/components/Dashboard.tsx:1-350` (intersepsi `currentView === 'page_management'`, `regional_monitoring`, dan tabs `input`/`analytics`/`units`)

**Interfaces:**
- Integrasi menyeluruh dari state ke UI end-to-end.

- [ ] **Step 1: Update `ProfileAdminSection.tsx` & `types.ts`**

Tambahkan tombol menu "Manajemen Halaman" dengan guard:
```typescript
{role === 'superadmin' && (
  <button
    type="button"
    onClick={() => {
      onClose();
      onOpenPageManagement?.();
    }}
    // styling konsisten
  >
    {/* Ikon Sliders / Layout & Text TEXT_PAGE_MANAGEMENT.PROFILE_MENU */}
  </button>
)}
```

- [ ] **Step 2: Update `Dashboard.tsx` dengan Intersepsi View & Tab**

Gunakan hook `usePageAccess()`:
- Jika `currentView === 'page_management'`: render `<PageManagementPage onBack={() => setCurrentView('dashboard')} />`.
- Jika `currentView === 'regional_monitoring'`:
  - Jika `!canAccessPage('regional_monitoring', currentUserRole)`: render `<PageDisabledState onBack={() => setCurrentView('dashboard')} />`.
  - Jika `currentUserRole === 'superadmin'` dan `isUnderMaintenance('regional_monitoring')`: tampilkan `<SuperadminMaintenanceBanner onManageAccess={() => setCurrentView('page_management')} />`.
- Pada `DashboardContentTabs.tsx`:
  - Jika tab aktif (misal `input`) dinonaktifkan dan bukan superadmin: render `<PageDisabledState />`.
  - Jika superadmin membuka tab yang dinonaktifkan: sertakan banner pemeliharaan di atas konten tab.

- [ ] **Step 3: Update `App.tsx`**

Bungkus `<Dashboard ... />` di dalam `<PageAccessProvider>`.

- [ ] **Step 4: Jalankan seluruh suite tes untuk memastikan zero regression**

Run: `pnpm vitest run src/`  
Expected: Semua unit test lulus 100%.

- [ ] **Step 5: Jalankan typecheck & build**

Run: `pnpm run build`  
Expected: `tsc -b` dan Vite build selesai dengan 0 error.

- [ ] **Step 6: Update Knowledge Graph**

Run: `graphify update .`

- [ ] **Step 7: Commit integrasi**

Run:
```bash
git add src/App.tsx src/components/Dashboard.tsx src/components/profileMenu/ src/components/dashboard/
git commit -m "feat: integrasi realtime page management"
```
