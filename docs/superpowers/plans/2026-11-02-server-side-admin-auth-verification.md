# Rencana Implementasi: Verifikasi Autentikasi Server-Side untuk Aksi Administratif (Opsi A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menutup celah pemalsuan identitas administratif (*spoofable identity / privilege escalation*) dengan mencabut akses publik anonim dari RPC database administratif dan memverifikasi token Google OAuth pengguna secara kriptografis di sisi server melalui Supabase Edge Function `admin-action`.

**Architecture:** Membangun *Defense in Depth* tiga lapis: (1) Lapisan Database mencabut izin `EXECUTE` fungsi admin dari `anon` dan hanya mengizinkan `service_role`, (2) Lapisan Server (Edge Function `admin-action`) memverifikasi Google Access Token ke endpoint resmi Google Tokeninfo dan mengeksekusi RPC hanya dengan email terverifikasi, (3) Lapisan Klien menyalurkan seluruh mutasi administratif melalui `adminActionService` berautentikasi token.

**Tech Stack:** Supabase PostgreSQL (SECURITY DEFINER RPC, RLS), Supabase Edge Functions (Deno Runtime, Google Tokeninfo Verification), TypeScript, React, Vitest.

## Global Constraints

- **Branch Wajib:** Seluruh pekerjaan wajib berada di branch `devmode`. Dilarang menyentuh branch `main`.
- **Tooling:** Wajib menggunakan `pnpm` (dilarang `npm`/`yarn`/`npx`).
- **Kamus Teks Sentral:** Dilarang keras *hardcoded UI string* di komponen atau servis. Seluruh teks antarmuka wajib merujuk ke `src/constants/texts/`.
- **Sistem Token Warna:** Dilarang hardcode hex/rgb mentah. Wajib memakai token semantik dari `src/styles/tokens/semantic.css` dan lolos rasio kontras WCAG AA/AAA.
- **Proteksi Formula Spreadsheet:** Dilarang menyentuh atau menimpa kolom berumus bawaan spreadsheet.
- **Dokumentasi Refactor:** Setiap perubahan wajib didokumentasikan di `refactor-ss-pdo/refact_191/` (`AUDIT_BUGS.md` dan `REPAIR_REPORT.md`).
- **Quality Gates Sebelum Selesai:**
  1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` (100% pass)
  2. `pnpm vitest run src/` (100% pass)
  3. `pnpm run build` (0 error)
  4. `graphify update .` (terupdate)

---

## File Structure Map

| File Path | Tanggung Jawab |
|---|---|
| `supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql` | Mencabut hak `anon` pada 5 RPC admin, membatasi hanya untuk `service_role`, dan menambahkan RPC `admin_add_user_profile`. |
| `supabase/functions/admin-action/deno.json` | Konfigurasi Deno runtime dan imports untuk Edge Function. |
| `supabase/functions/admin-action/index.ts` | Serverless gateway yang memvalidasi Google Token ke Google Identity API dan memanggil RPC via Supabase Service Role. |
| `src/services/googleSheets/authSession.ts` | Menyediakan fungsi `getGoogleAccessToken()` untuk mengambil dan memastikan token Google aktif dari `localStorage` / GIS. |
| `src/services/adminActionService.ts` | Client adapter yang menyematkan Google Token ke header request dan memanggil `supabase.functions.invoke('admin-action')`. |
| `src/services/adminActionService.test.ts` | Unit test untuk `adminActionService` (validasi token, penanganan HTTP status 401/403/500, parsing respons). |
| `src/services/routes/users.ts` | Migrasi fungsi `updateUserProfileRole`, `toggleUserProfileStatus`, `revokeUserProfile`, dan `addUserProfile` ke `adminActionService`. |
| `src/services/routes/users.test.ts` | Update mock dan pengujian unit test servis users. |
| `src/services/pageManagementService.ts` | Migrasi fungsi `updatePageSetting`, `updatePagePermissions`, dan `bulkUpdatePageSettings` ke `adminActionService`. |
| `src/services/pageManagementService.test.ts` | Update mock dan pengujian unit test servis manajemen halaman. |
| `refactor-ss-pdo/refact_191/AUDIT_BUGS.md` | Dokumentasi temuan audit keamanan identitas pengguna (ID, lokasi, dampak, mitigasi). |
| `refactor-ss-pdo/refact_191/REPAIR_REPORT.md` | Laporan implementasi perbaikan teknis, Before vs After, skenario lapangan, dan bukti pengujian. |

---

### Task 1: Supabase Database Migration (Revoke Anon RPCs & Add admin_add_user_profile)

**Files:**
- Create: `supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql`

**Interfaces:**
- Produces: Database RPCs yang hanya dapat dieksekusi oleh role PostgreSQL `service_role`. Akses langsung oleh pengguna dengan `anon` key akan menghasilkan `403 Permission Denied`.

- [ ] **Step 1: Tulis berkas migrasi SQL**

Tulis berkas `supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql` dengan isi berikut:

```sql
-- ============================================================================
-- Migrasi: Restriksi RPC Administratif ke Service Role (Refactor 191)
-- File: supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql
--
-- RINGKASAN:
-- 1. Cabut izin EXECUTE dari anon dan authenticated pada semua RPC admin:
--    - admin_update_user_role
--    - admin_toggle_user_status
--    - set_app_page_setting
--    - admin_update_page_permissions
--    - admin_bulk_update_page_settings
-- 2. Berikan izin EXECUTE hanya kepada role service_role.
-- 3. Tambahkan fungsi SECURITY DEFINER public.admin_add_user_profile untuk
--    menutup celah penambahan akun dengan peran istimewa via direct INSERT.
-- ============================================================================

-- 1. Cabut izin eksekusi dari anon dan authenticated
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(text, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_user_status(text, text, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_app_page_setting(text, text, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_page_permissions(text, text, text[], text[], text[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_update_page_settings(text, text[], text, boolean, text[]) FROM anon, authenticated;

-- 2. Berikan izin eksekusi eksklusif ke service_role
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_app_page_setting(text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_page_permissions(text, text, text[], text[], text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_page_settings(text, text[], text, boolean, text[]) TO service_role;

-- 3. Tambahkan fungsi RPC aman untuk penambahan profil pengguna baru
CREATE OR REPLACE FUNCTION public.admin_add_user_profile(
    p_acting_email text,
    p_email text,
    p_full_name text,
    p_role_id integer,
    p_notes text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acting_role text;
    v_clean_email text;
    v_clean_name text;
    v_assigned_role_id integer;
BEGIN
    IF p_acting_email IS NULL OR p_email IS NULL THEN
        RAISE EXCEPTION 'Parameter tidak lengkap.';
    END IF;

    -- Validasi apakah pemanggil adalah Superadmin atau Admin aktif
    SELECT r.code INTO v_acting_role
    FROM public.user_profiles u
    JOIN public.roles r ON u.role_id = r.id
    WHERE lower(trim(u.email)) = lower(trim(p_acting_email))
      AND u.is_active = true;

    IF v_acting_role IS NULL OR (v_acting_role <> 'superadmin' AND v_acting_role <> 'admin') THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin atau Admin aktif yang berwenang menambahkan pengguna baru.';
    END IF;

    -- Admin biasa dilarang membuat akun Superadmin
    v_assigned_role_id := COALESCE(p_role_id, 5);
    IF v_acting_role = 'admin' AND v_assigned_role_id = 1 THEN
        RAISE EXCEPTION 'Akses ditolak: Administrator tidak dapat menambahkan akun dengan peran Superadmin.';
    END IF;

    v_clean_email := lower(trim(p_email));
    v_clean_name := COALESCE(nullif(trim(p_full_name), ''), split_part(v_clean_email, '@', 1));

    INSERT INTO public.user_profiles (
        email,
        full_name,
        role_id,
        notes,
        created_by,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_clean_email,
        v_clean_name,
        v_assigned_role_id,
        nullif(trim(p_notes), ''),
        p_acting_email,
        true,
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE
    SET role_id = EXCLUDED.role_id,
        notes = COALESCE(EXCLUDED.notes, public.user_profiles.notes),
        is_active = true,
        updated_at = now();

    RETURN FOUND;
END;
$$;

-- Cabut eksekusi dari publik dan berikan ke service_role
REVOKE EXECUTE ON FUNCTION public.admin_add_user_profile(text, text, text, integer, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_user_profile(text, text, text, integer, text) TO service_role;

-- 4. Catat migrasi
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261102000001', 'restrict_admin_rpcs_to_service_role')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Verifikasi sintaks SQL**

Jalankan: `Test-Path supabase/migrations/20261102000001_restrict_admin_rpcs_to_service_role.sql`
Ekspektasi: `True`

---

### Task 2: Supabase Edge Function `admin-action`

**Files:**
- Create: `supabase/functions/admin-action/deno.json`
- Create: `supabase/functions/admin-action/index.ts`

**Interfaces:**
- Consumes: Header `x-google-token` atau `Authorization: Bearer <google_token>`, Body `{ action: string, payload: any }`.
- Produces: JSON response `{ success: true, data?: any }` atau HTTP 401/403/400/500 `{ success: false, error: string }`.

- [ ] **Step 1: Buat `supabase/functions/admin-action/deno.json`**

```json
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"]
  },
  "imports": {
    "@supabase/functions-js/edge-runtime.d.ts": "jsr:@supabase/functions-js@2/edge-runtime.d.ts"
  }
}
```

- [ ] **Step 2: Buat `supabase/functions/admin-action/index.ts`**

Tulis implementasi Edge Function yang memverifikasi Google Token dan mengeksekusi RPC via `service_role`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GoogleTokenInfo {
  email?: string;
  verified_email?: boolean | string;
  expires_in?: number;
  audience?: string;
  issued_to?: string;
  error_description?: string;
}

async function verifyGoogleAccessToken(token: string): Promise<{ valid: boolean; email: string | null; error?: string }> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        valid: false,
        email: null,
        error: errBody.error_description || "Token Google tidak valid atau telah kedaluwarsa.",
      };
    }

    const data: GoogleTokenInfo = await res.json();
    if (!data.email) {
      return { valid: false, email: null, error: "Token Google tidak memuat identitas email." };
    }

    const isVerified = data.verified_email === true || data.verified_email === "true";
    if (!isVerified) {
      return { valid: false, email: null, error: "Email akun Google belum terverifikasi." };
    }

    return { valid: true, email: data.email.toLowerCase().trim() };
  } catch (err: any) {
    return { valid: false, email: null, error: err?.message || "Gagal menghubungi layanan verifikasi Google." };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Hanya metode POST yang didukung." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Ekstraksi Google Token dari header khusus x-google-token atau Authorization
    let googleToken = req.headers.get("x-google-token") || "";
    if (!googleToken) {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ") && !authHeader.includes("supabase")) {
        googleToken = authHeader.replace("Bearer ", "").trim();
      }
    }

    if (!googleToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Akses ditolak: Token autentikasi Google tidak disertakan dalam permintaan.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verifikasi kriptografis token ke Google Tokeninfo
    const verification = await verifyGoogleAccessToken(googleToken);
    if (!verification.valid || !verification.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Autentikasi gagal: ${verification.error || "Token tidak valid"}`,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifiedActingEmail = verification.email;

    // 3. Inisialisasi Supabase Client dengan Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Konfigurasi server internal Supabase belum lengkap.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Parse request body
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter 'action' wajib disertakan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Dispatch RPC berdasarkan action yang diminta
    let rpcName = "";
    let rpcParams: Record<string, any> = {};

    switch (action) {
      case "update_user_role":
        rpcName = "admin_update_user_role";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_target_email: payload?.targetEmail,
          p_new_role_id: payload?.newRoleId,
        };
        break;

      case "toggle_user_status":
        rpcName = "admin_toggle_user_status";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_target_email: payload?.targetEmail,
          p_is_active: payload?.isActive,
        };
        break;

      case "add_user_profile":
        rpcName = "admin_add_user_profile";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_email: payload?.email,
          p_full_name: payload?.fullName,
          p_role_id: payload?.roleId,
          p_notes: payload?.notes,
        };
        break;

      case "set_page_setting":
        rpcName = "set_app_page_setting";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_key: payload?.pageKey,
          p_is_enabled: payload?.isEnabled,
        };
        break;

      case "update_page_permissions":
        rpcName = "admin_update_page_permissions";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_key: payload?.pageKey,
          p_allowed_roles: payload?.allowedRoles,
          p_allowed_user_emails: payload?.allowedUserEmails,
          p_denied_user_emails: payload?.deniedUserEmails,
        };
        break;

      case "bulk_update_page_settings":
        rpcName = "admin_bulk_update_page_settings";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_keys: payload?.pageKeys,
          p_action: payload?.bulkAction,
          p_is_enabled: payload?.isEnabled,
          p_allowed_roles: payload?.allowedRoles,
        };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Aksi administratif '${action}' tidak dikenali.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Eksekusi RPC via Service Role
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc(rpcName, rpcParams);

    if (rpcError) {
      const isAccessDenied = rpcError.message && rpcError.message.includes("Akses ditolak");
      return new Response(
        JSON.stringify({
          success: false,
          error: rpcError.message || "Gagal mengeksekusi operasi administratif.",
        }),
        {
          status: isAccessDenied ? 403 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: rpcData,
        verified_email: verifiedActingEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Terjadi kesalahan internal server.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

### Task 3: Client Token Helper (`src/services/googleSheets/authSession.ts`)

**Files:**
- Modify: `src/services/googleSheets/authSession.ts`
- Modify: `src/services/googleSheets/auth.ts` (re-export `getGoogleAccessToken`)

**Interfaces:**
- Produces: `getGoogleAccessToken(): Promise<string | null>`

- [ ] **Step 1: Tambahkan `getGoogleAccessToken` ke `authSession.ts`**

Tambahkan fungsi pembantu untuk mengambil access token yang terjamin valid (melakukan silent refresh jika mendekati expiry):

```typescript
export const getGoogleAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const isPersistentSignedIn = localStorage.getItem("PDO_IS_SIGNED_IN") === "true";
  if (!isPersistentSignedIn) return null;

  await ensureValidToken();

  const tokenStr = localStorage.getItem("GAPI_ACCESS_TOKEN");
  if (!tokenStr) return null;
  try {
    const tokenObj = JSON.parse(tokenStr);
    return tokenObj.token || null;
  } catch {
    return null;
  }
};
```

- [ ] **Step 2: Re-ekspor di `src/services/googleSheets/auth.ts`**

Tambahkan `getGoogleAccessToken` ke dalam ekspor `auth.ts`.

---

### Task 4: Admin Action Client Service & Unit Test

**Files:**
- Create: `src/services/adminActionService.ts`
- Create: `src/services/adminActionService.test.ts`

**Interfaces:**
- Produces: `invokeAdminAction(action: AdminActionType, payload: Record<string, any>): Promise<{ success: boolean; data?: any; message?: string }>`

- [ ] **Step 1: Tulis failing unit test `src/services/adminActionService.test.ts`**

```typescript
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeAdminAction } from './adminActionService';

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('./googleSheets/auth', () => ({
  getGoogleAccessToken: vi.fn(),
}));

import { supabase } from './supabase';
import { getGoogleAccessToken } from './googleSheets/auth';

describe('AdminActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gagal jika Google access token tidak tersedia (offline atau sesi habis)', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue(null);

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'target@test.com', newRoleId: 2 });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Token autentikasi Google tidak ditemukan');
  });

  it('berhasil memanggil Edge Function admin-action dengan token di headers', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, data: true, verified_email: 'superadmin@transjakarta.co.id' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 2 });
    expect(res.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('admin-action', {
      body: { action: 'update_user_role', payload: { targetEmail: 'budi@test.com', newRoleId: 2 } },
      headers: { 'x-google-token': 'mock-google-token-123' },
    });
  });

  it('mengembalikan pesan ramah pengguna jika Edge Function mengembalikan error akses ditolak', async () => {
    vi.mocked(getGoogleAccessToken).mockResolvedValue('mock-google-token-123');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Akses ditolak: Hanya Superadmin aktif yang berwenang mengubah peran akun pengguna.' },
      error: null,
    });

    const res = await invokeAdminAction('update_user_role', { targetEmail: 'budi@test.com', newRoleId: 1 });
    expect(res.success).toBe(false);
    expect(res.message).toContain('Akses ditolak');
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan awal**

Jalankan: `pnpm vitest run src/services/adminActionService.test.ts`
Ekspektasi: FAIL (module not found)

- [ ] **Step 3: Tulis implementasi `src/services/adminActionService.ts`**

```typescript
import { supabase, isSupabaseConfigured } from './supabase';
import { getGoogleAccessToken } from './googleSheets/auth';
import { formatUserError } from '../utils/errorFormatter';

export type AdminActionType =
  | 'update_user_role'
  | 'toggle_user_status'
  | 'add_user_profile'
  | 'set_page_setting'
  | 'update_page_permissions'
  | 'bulk_update_page_settings';

export interface AdminActionResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  verifiedEmail?: string;
}

export async function invokeAdminAction<T = any>(
  action: AdminActionType,
  payload: Record<string, any>
): Promise<AdminActionResult<T>> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Koneksi database tidak terkonfigurasi.',
    };
  }

  try {
    // 1. Dapatkan Google Access Token yang masih valid
    const googleToken = await getGoogleAccessToken();
    if (!googleToken) {
      return {
        success: false,
        message: 'Token autentikasi Google tidak ditemukan atau telah kedaluwarsa. Silakan refresh halaman atau login ulang.',
      };
    }

    // 2. Kirim permintaan ke Edge Function admin-action
    const { data, error } = await supabase.functions.invoke('admin-action', {
      body: {
        action,
        payload,
      },
      headers: {
        'x-google-token': googleToken,
      },
    });

    if (error) {
      const errorMsg = error.message || 'Gagal menghubungi server otorisasi.';
      return {
        success: false,
        message: formatUserError(error, errorMsg) || errorMsg,
      };
    }

    if (!data || data.success === false) {
      return {
        success: false,
        message: data?.error || 'Operasi administratif gagal diproses oleh server.',
      };
    }

    return {
      success: true,
      data: data.data as T,
      verifiedEmail: data.verified_email,
    };
  } catch (err: any) {
    console.error(`[AdminActionService] Error executing action '${action}':`, err);
    return {
      success: false,
      message: formatUserError(err, 'Terjadi kesalahan sistem saat memproses permintaan administratif.') || 'Terjadi kesalahan sistem.',
    };
  }
}
```

- [ ] **Step 4: Jalankan test kembali untuk memverifikasi kelulusan**

Jalankan: `pnpm vitest run src/services/adminActionService.test.ts`
Ekspektasi: PASS (3 tests passed)

---

### Task 5: Refactor `src/services/routes/users.ts` & `src/services/pageManagementService.ts`

**Files:**
- Modify: `src/services/routes/users.ts`
- Modify: `src/services/routes/users.test.ts`
- Modify: `src/services/pageManagementService.ts`
- Modify: `src/services/pageManagementService.test.ts`

- [ ] **Step 1: Perbarui fungsi administratif pada `src/services/routes/users.ts`**

Gantikan RPC direct call dengan `invokeAdminAction`:
- `updateUserProfileRole`: panggil `invokeAdminAction('update_user_role', { targetEmail: cleanTarget, newRoleId: roleId })`.
- `toggleUserProfileStatus`: panggil `invokeAdminAction('toggle_user_status', { targetEmail: cleanTarget, isActive })`.
- `revokeUserProfile`: panggil `invokeAdminAction('toggle_user_status', { targetEmail: cleanTarget, isActive: false })`.
- `addUserProfile`: panggil `invokeAdminAction('add_user_profile', { email: cleanEmail, fullName: params.full_name, roleId: assignedRoleId, notes: params.notes })`.

- [ ] **Step 2: Perbarui fungsi administratif pada `src/services/pageManagementService.ts`**

Gantikan RPC direct call dengan `invokeAdminAction`:
- `updatePageSetting`: panggil `invokeAdminAction('set_page_setting', { pageKey, isEnabled })`.
- `updatePagePermissions`: panggil `invokeAdminAction('update_page_permissions', { pageKey, allowedRoles: finalRoles, allowedUserEmails, deniedUserEmails })`.
- `bulkUpdatePageSettings`: panggil `invokeAdminAction('bulk_update_page_settings', { pageKeys, bulkAction: action, isEnabled, allowedRoles })`.

- [ ] **Step 3: Sesuaikan unit test pada `users.test.ts` & `pageManagementService.test.ts`**

Sesuaikan mock `supabase.functions.invoke` atau `invokeAdminAction` agar seluruh unit test eksisting tetap lulus 100%.

Jalankan: `pnpm vitest run src/services/routes/users.test.ts src/services/pageManagementService.test.ts`
Ekspektasi: PASS 100%.

---

### Task 6: Dokumentasi Audit Refactor (`refact_191`) & Quality Gates

**Files:**
- Create: `refactor-ss-pdo/refact_191/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_191/REPAIR_REPORT.md`

- [ ] **Step 1: Buat `refactor-ss-pdo/refact_191/AUDIT_BUGS.md`**

Mendokumentasikan temuan audit identitas pengguna:
- ID: `SS191-SEC-01`
- Lokasi: `supabase/migrations/`, `src/services/routes/users.ts`, `src/services/pageManagementService.ts`
- Keparahan: Kritis / Tinggi
- Deskripsi: Server dan database tidak memverifikasi token identitas Google pemanggil; RPC menerima `p_acting_email` dari klien tanpa validasi kriptografis.
- Dampak: Potensi privilege escalation oleh pihak yang memiliki anon key dan mengetahui email superadmin.
- Mitigasi: Restriksi RPC ke `service_role` + Edge Function `admin-action` dengan Google Tokeninfo verification.

- [ ] **Step 2: Buat `refactor-ss-pdo/refact_191/REPAIR_REPORT.md`**

Mendokumentasikan:
- Before vs After arsitektur otentikasi admin.
- Skenario Lapangan: Upaya memanggil RPC langsung via anon key menghasilkan `403 Permission Denied`; aksi sah dari peramban memvalidasi token Google ke Google Identity API.
- Batas dampak mutasi: Tidak ada formula spreadsheet yang terdampak; alur login GIS dan sesi pengguna tetap permanen tanpa batas waktu.

- [ ] **Step 3: Jalankan Quality Gates Lengkap**

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` (Wajib 100% lulus)
2. `pnpm vitest run src/` (Wajib seluruh unit test lulus)
3. `pnpm run build` (Wajib tsc & vite build 0 error)
4. `graphify update .` (Update graph pengetahuan)
