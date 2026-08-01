# Human-Friendly Error Handling & Sanitization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a centralized error sanitization utility (`formatUserError`) to translate technical error messages (e.g. `.env credentials missing`, stack traces) into clear, friendly Indonesian user-facing messages while preserving full technical details in developer console logs.

**Architecture:** Create `src/utils/errorFormatter.ts` as a pure error sanitization utility with pattern matching. Integrate `formatUserError` into `src/App.tsx`, `src/components/LoginScreen.tsx`, `src/components/Dashboard.tsx`, and `src/services/googleSheets.ts`.

**Tech Stack:** TypeScript, React 19, Vite, oxlint, pnpm.

## Global Constraints
- All user-facing error strings MUST be in clear, polite Bahasa Indonesia.
- Developer-only details (.env, API Key, Client ID, status codes, stack trace) MUST NOT appear in user-facing UI text.
- Full technical error details MUST be logged using `console.error` for developer debugging.
- Use `pnpm` for all commands (`pnpm run build`, `pnpm run lint`).

---

### Task 1: Create Centralized Error Sanitizer Utility (`errorFormatter.ts`)

**Files:**
- Create: `src/utils/errorFormatter.ts`
- Create: `src/utils/errorFormatter.test.ts`

**Interfaces:**
- Consumes: None (pure utility)
- Produces: `formatUserError(error: unknown, fallbackMessage?: string): string | null`

- [ ] **Step 1: Write `src/utils/errorFormatter.ts`**

```typescript
/**
 * Sanitizes technical error messages into clear, human-friendly Bahasa Indonesia for end-users.
 * Logs full technical details to console.error for developer debugging.
 */
export function formatUserError(error: unknown, fallbackMessage?: string): string | null {
  if (!error) return null;

  // Log full error trace for developers
  console.error('[System Error Details]:', error);

  // Extract raw error string/object
  const errorObj = typeof error === 'object' && error !== null ? (error as any) : {};
  const message = typeof error === 'string' 
    ? error 
    : errorObj.message || errorObj.error || errorObj.type || JSON.stringify(error);

  const lowerMsg = String(message).toLowerCase();
  const errorType = String(errorObj.type || errorObj.error || '').toLowerCase();

  // 1. Popup closed by user or cancelled (Not a fatal error, reset state)
  if (errorType === 'popup_closed_by_user' || lowerMsg.includes('login dibatalkan')) {
    return null;
  }

  // 2. Technical Credentials / .env missing
  if (
    lowerMsg.includes('credentials') ||
    lowerMsg.includes('.env') ||
    lowerMsg.includes('api key') ||
    lowerMsg.includes('client id') ||
    lowerMsg.includes('environment variables')
  ) {
    return 'Layanan belum siap dikonfigurasi. Silakan hubungi admin operasional.';
  }

  // 3. Timeout / Auth client not ready
  if (
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('token client belum siap') ||
    lowerMsg.includes('gagal memuat google identity')
  ) {
    return 'Koneksi ke layanan autentikasi terganggu atau membutuhkan waktu lebih lama. Silakan coba lagi.';
  }

  // 4. Network / Offline errors
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network error')
  ) {
    return 'Koneksi internet Anda terputus. Silakan periksa jaringan dan coba beberapa saat lagi.';
  }

  // 5. Google Sheets Column Header Mismatch
  if (
    lowerMsg.includes('no body') ||
    lowerMsg.includes('unit') ||
    lowerMsg.includes('pastikan header')
  ) {
    return 'Format kolom pada tabel Google Sheets tidak sesuai. Mohon periksa kembali dokumen Anda.';
  }

  // 6. Empty Sheet
  if (lowerMsg.includes('tidak ada data di sheet ini')) {
    return 'Tidak ditemukan data pada lembar kerja ini.';
  }

  // 7. Access / Permission Denied
  if (
    lowerMsg.includes('403') ||
    lowerMsg.includes('permissions_denied') ||
    lowerMsg.includes('hak akses')
  ) {
    return 'Gagal mengakses Google Sheets. Pastikan akun Anda memiliki hak akses ke dokumen tersebut.';
  }

  // Fallback to custom message or default friendly Indonesian message
  return fallbackMessage || 'Terjadi kendala sistem. Silakan coba beberapa saat lagi atau hubungi admin.';
}
```

- [ ] **Step 2: Create unit test `src/utils/errorFormatter.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { formatUserError } from './errorFormatter';

describe('formatUserError', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});

  it('returns null for null or user closed popup', () => {
    expect(formatUserError(null)).toBeNull();
    expect(formatUserError({ type: 'popup_closed_by_user' })).toBeNull();
    expect(formatUserError(new Error('Login dibatalkan'))).toBeNull();
  });

  it('sanitizes technical credentials and .env error messages', () => {
    const err = new Error('API Credentials missing in .env file');
    const result = formatUserError(err);
    expect(result).not.toContain('.env');
    expect(result).toContain('Layanan belum siap dikonfigurasi');
  });

  it('sanitizes network errors', () => {
    const err = new TypeError('Failed to fetch');
    const result = formatUserError(err);
    expect(result).toContain('Koneksi internet Anda terputus');
  });

  it('sanitizes sheet header errors', () => {
    const err = new Error('Tidak bisa menemukan kolom "No Body / Unit".');
    const result = formatUserError(err);
    expect(result).not.toContain('No Body');
    expect(result).toContain('Format kolom pada tabel Google Sheets tidak sesuai');
  });
});
```

- [ ] **Step 3: Run Vitest / Typecheck**

Run: `pnpm dlx vitest run src/utils/errorFormatter.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/utils/errorFormatter.ts src/utils/errorFormatter.test.ts
git commit -m "feat: add centralized error sanitizer formatUserError"
```

---

### Task 2: Refactor `src/App.tsx` Error Handling

**Files:**
- Modify: `src/App.tsx:13-27`

**Interfaces:**
- Consumes: `formatUserError` from `src/utils/errorFormatter`
- Produces: Sanitized `initError` state

- [ ] **Step 1: Update `src/App.tsx` to use `formatUserError`**

Replace lines 13-27 in `src/App.tsx` with:

```typescript
import { formatUserError } from './utils/errorFormatter';

// ...
  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError(formatUserError('API Credentials missing'));
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsApiReady(true);
      setIsSignedIn(checkSignedIn());
    } catch (err: any) {
      setInitError(formatUserError(err, 'Gagal menginisialisasi layanan Google API.'));
    }
  };
```

- [ ] **Step 2: Run typecheck & build**

Run: `pnpm run build`
Expected: PASS without TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: use formatUserError for API init error in App.tsx"
```

---

### Task 3: Refactor `src/components/LoginScreen.tsx` Error Handling

**Files:**
- Modify: `src/components/LoginScreen.tsx:14-34`

**Interfaces:**
- Consumes: `formatUserError` from `src/utils/errorFormatter`
- Produces: Clean user error state in `LoginScreen`

- [ ] **Step 1: Update `src/components/LoginScreen.tsx`**

Replace `handleLogin` catch block in `LoginScreen.tsx`:

```typescript
import { formatUserError } from '../utils/errorFormatter';

// ...
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      onLoginSuccess();
    } catch (err: any) {
      const userMessage = formatUserError(err);
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 2: Run typecheck & build**

Run: `pnpm run build`
Expected: PASS without errors

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "refactor: use formatUserError for login errors in LoginScreen.tsx"
```

---

### Task 4: Refactor `src/components/Dashboard.tsx` Error Handling

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `formatUserError` from `src/utils/errorFormatter`
- Produces: Clean user error states in `Dashboard`

- [ ] **Step 1: Check and update `Dashboard.tsx` error handlers**

Import `formatUserError` from `../utils/errorFormatter` and wrap any error setting logic:

```typescript
import { formatUserError } from '../utils/errorFormatter';

// In fetch/update catch blocks:
catch (err: any) {
  setError(formatUserError(err));
}
```

- [ ] **Step 2: Run build & linter verification**

Run: `pnpm run lint && pnpm run build`
Expected: PASS with 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "refactor: use formatUserError for dashboard operations in Dashboard.tsx"
```
