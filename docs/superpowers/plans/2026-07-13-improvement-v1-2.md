# Improvement v1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan fitur keamanan kredensial, pencegahan spam API (rate limiting), dan validasi form beserta fitur Salin KM untuk PDO Mobile v1.2.

**Architecture:** Memindahkan kredensial dari `localStorage` ke `.env` (Environment Variables) agar terhindar dari *user setup*. Menambahkan jeda (delay) pada *hook* `useOfflineSync` untuk sinkronisasi. Menambahkan validasi komprehensif pada komponen `BusCard`.

**Tech Stack:** React, TypeScript, Vite, Google Sheets API.

## Global Constraints

- Wajib menggunakan TypeScript (no any).
- Hanya gunakan referensi yang ada pada PDO Mobile saat ini.
- Gunakan bahasa Indonesia untuk semua notifikasi dan alert UI.

---

### Task 1: Environment Variables & Security Cleanup

**Files:**
- Create: `.env.example`
- Modify: `src/services/googleSheets.ts`, `src/App.tsx`, `src/components/LoginScreen.tsx`, `src/components/Dashboard.tsx`
- Delete: `src/components/SettingsModal.tsx`

**Interfaces:**
- Consumes: None
- Produces: `hasGoogleCreds` and `getGoogleCreds` from `googleSheets.ts` no longer depend on `localStorage`.

- [ ] **Step 1: Create `.env.example`**

```env
VITE_GAPI_CLIENT_ID=your_google_oauth_client_id_here
VITE_GAPI_API_KEY=your_google_api_key_here
```

- [ ] **Step 2: Modify `src/services/googleSheets.ts`**
Change `getGoogleCreds` to read from environment variables.

```typescript
// src/services/googleSheets.ts:4-9
export const getGoogleCreds = () => {
  return {
    clientId: import.meta.env.VITE_GAPI_CLIENT_ID || '',
    apiKey: import.meta.env.VITE_GAPI_API_KEY || ''
  };
};
```

- [ ] **Step 3: Modify `src/App.tsx`**
Remove `SettingsModal` imports and states.

```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { initGoogleApi, checkSignedIn, signOut, hasGoogleCreds } from './services/googleSheets';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError('Kredensial API tidak ditemukan di Environment Variables.');
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsSignedIn(checkSignedIn());
    } catch (err: any) {
      console.error('Failed to init Google API:', err);
      setInitError('Gagal menginisialisasi Google API. Cek kembali API Key dan Client ID Anda.');
    }
  };

  useEffect(() => {
    if (hasGoogleCreds()) {
      initializeApi();
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsSignedIn(false);
  };

  return (
    <>
      {!isSignedIn ? (
        <LoginScreen onLoginSuccess={() => setIsSignedIn(true)} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}

      {initError && (
        <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'var(--danger-color)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', zIndex: 50 }}>
          {initError}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Modify `src/components/LoginScreen.tsx`**
Remove settings button.

```tsx
// src/components/LoginScreen.tsx
import { useState } from 'react';
import { signIn } from '../services/googleSheets';
import { LogIn, Loader2 } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.error !== 'popup_closed_by_user') {
        setError('Gagal login. Pastikan Anda mengizinkan popup Google dan Settings API sudah diatur.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          PDO Mobile
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Aplikasi penginputan data shift bus harian langsung ke Google Sheets.
        </p>
        
        {error && <div className="error-text" style={{ marginBottom: '16px' }}>{error}</div>}

        <button className="btn" onClick={handleLogin} disabled={isLoading} style={{ marginBottom: '16px' }}>
          {isLoading ? <Loader2 className="spinner" size={20} /> : <LogIn size={20} />}
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Modify `src/components/Dashboard.tsx`**
Remove settings button from Dashboard header.

```tsx
// src/components/Dashboard.tsx:8-11
interface Props {
  onLogout: () => void;
}
```

```tsx
// src/components/Dashboard.tsx:219-221
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="btn btn-outline" style={{ padding: '8px', color: 'var(--danger-color)' }} onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
```

- [ ] **Step 6: Remove SettingsModal and Commit**

```bash
rm src/components/SettingsModal.tsx
git add .
git commit -m "feat: migrate credentials to env variables and remove settings UI"
```

---

### Task 2: Offline Auto-Sync Debouncing

**Files:**
- Modify: `src/hooks/useOfflineSync.ts`

**Interfaces:**
- Consumes: None
- Produces: `useOfflineSync` hook with a delay between queue processing.

- [ ] **Step 1: Modify `src/hooks/useOfflineSync.ts`**
Add a delay inside the loop to avoid hitting Google Sheets API rate limits (Error 429).

```typescript
// src/hooks/useOfflineSync.ts:68-82
    for (const item of currentQueue) {
      try {
        await updateBusData(item.sheetId, item.tabName, item.rowIndex, item.updates, item.headerMap);
        // If success, remove from remaining
        remainingQueue = remainingQueue.filter(q => q.id !== item.id);
        saveQueue(remainingQueue);
        
        // Jeda 2 detik sebelum memproses antrean berikutnya untuk menghindari rate limit API
        if (remainingQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err: any) {
        // If it's auth error, stop processing immediately
        if (err.message && err.message.includes('Auth') || err.status === 401 || err.message?.includes('Credentials')) {
          break;
        }
        // If other error, keep it in queue and continue or break
        break; 
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useOfflineSync.ts
git commit -m "feat: add 2-second debounce between offline sync requests"
```

---

### Task 3: Input Validations & "Salin KM" Feature

**Files:**
- Modify: `src/components/BusCard.tsx`

**Interfaces:**
- Consumes: BusData state
- Produces: Stricter validation on `handleSave` and new UI button.

- [ ] **Step 1: Modify `src/components/BusCard.tsx` - handleSave function**
Add strict conditional validations.

```typescript
// src/components/BusCard.tsx:41-61
  const handleSave = async () => {
    // Validation
    const checkKm = (awal?: string, akhir?: string) => {
      if (awal && akhir) {
        const numAwal = Number(awal);
        const numAkhir = Number(akhir);
        if (!isNaN(numAwal) && !isNaN(numAkhir) && numAkhir < numAwal) {
          return false;
        }
      }
      return true;
    };

    if (!checkKm(formData.kmAwal1, formData.kmAkhir1)) {
      setError('KM Akhir Shift 1 tidak boleh lebih kecil dari KM Awal Shift 1');
      return;
    }
    if (!checkKm(formData.kmAwal2, formData.kmAkhir2)) {
      setError('KM Akhir Shift 2 tidak boleh lebih kecil dari KM Awal Shift 2');
      return;
    }
    if (!checkKm(formData.kmAkhir1, formData.kmAwal2)) {
      setError('KM Awal Shift 2 tidak boleh lebih kecil dari KM Akhir Shift 1');
      return;
    }

    setIsLoading(true);
    setError(null);
```

- [ ] **Step 2: Add "Salin KM" button function**

```typescript
// src/components/BusCard.tsx:39-39 (Right after handleChange)
  const handleCopyKm = () => {
    if (formData.kmAkhir1) {
      setFormData(prev => ({ ...prev, kmAwal2: prev.kmAkhir1 }));
      setSaveStatus('idle');
      setError(null);
    }
  };
```

- [ ] **Step 3: Update `kmAwal2` UI to include the button**

```tsx
// src/components/BusCard.tsx:254-269
          <div className="form-grid">
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>KM Awal Shift 2</label>
                <button 
                  type="button"
                  onClick={handleCopyKm} 
                  disabled={isFieldDisabled('kmAwal2') || !formData.kmAkhir1}
                  style={{ background: 'none', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', borderRadius: '4px', fontSize: '11px', padding: '2px 6px', cursor: 'pointer' }}
                >
                  Salin KM Akhir 1
                </button>
              </div>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAwal2 || ''} 
                onChange={handleChange('kmAwal2')}
                placeholder="0"
                disabled={isFieldDisabled('kmAwal2')}
              />
            </div>
            <div className="input-group">
              <label>KM Akhir Shift 2</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAkhir2 || ''} 
                onChange={handleChange('kmAkhir2')}
                placeholder="0"
                disabled={isFieldDisabled('kmAkhir2')}
              />
            </div>
          </div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BusCard.tsx
git commit -m "feat: add robust km validation and copy km feature"
```
