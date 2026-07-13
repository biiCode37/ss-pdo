# Offline Auto-Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan antrean `localStorage` untuk menyimpan data bus yang gagal dikirim saat offline, lalu otomatis mengirimnya saat sinyal kembali.

**Architecture:** Custom React hook `useOfflineSync` akan mengelola state `PDO_SYNC_QUEUE` di `localStorage`. Komponen `BusCard` akan menggunakan hook ini untuk menyimpan data yang gagal di-fetch, dan `Dashboard` akan menampilkan status antrean di UI. Fitur otomatis-kirim menggunakan `window.addEventListener('online')`.

**Tech Stack:** React, TypeScript, localStorage

## Global Constraints

- Kode harus mendukung React 19.
- Tidak ada framework testing; pengujian dilakukan dengan manual verification di browser.
- Gunakan `lucide-react` untuk ikon.

---

### Task 1: Create `useOfflineSync` Hook

**Files:**
- Create: `src/hooks/useOfflineSync.ts`

**Interfaces:**
- Produces: `useOfflineSync()` hook, `SyncItem` interface, `addToQueue(item)`, `processQueue()` methods.

- [ ] **Step 1: Write `useOfflineSync.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { updateBusData } from '../services/googleSheets';

export interface SyncItem {
  id: string;
  sheetId: string;
  tabName: string;
  rowIndex: number;
  updates: Partial<BusData>;
  headerMap: HeaderMap;
  status: 'pending' | 'failed';
}

export function useOfflineSync() {
  const [queue, setQueue] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load initial queue
  useEffect(() => {
    const saved = localStorage.getItem('PDO_SYNC_QUEUE');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse queue', e);
      }
    }
  }, []);

  const saveQueue = (newQueue: SyncItem[]) => {
    setQueue(newQueue);
    localStorage.setItem('PDO_SYNC_QUEUE', JSON.stringify(newQueue));
  };

  const addToQueue = useCallback((item: Omit<SyncItem, 'id' | 'status'>) => {
    const newItem: SyncItem = {
      ...item,
      id: Date.now().toString(),
      status: 'pending'
    };
    // Replace if same row is already in queue
    setQueue(prev => {
      const filtered = prev.filter(q => !(q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex));
      const newQueue = [...filtered, newItem];
      localStorage.setItem('PDO_SYNC_QUEUE', JSON.stringify(newQueue));
      return newQueue;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    // Get latest queue from storage to ensure we have the freshest data
    const saved = localStorage.getItem('PDO_SYNC_QUEUE');
    let currentQueue: SyncItem[] = [];
    if (saved) {
      try {
        currentQueue = JSON.parse(saved);
      } catch (e) {}
    }

    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    let remainingQueue = [...currentQueue];

    for (const item of currentQueue) {
      try {
        await updateBusData(item.sheetId, item.tabName, item.rowIndex, item.updates, item.headerMap);
        // If success, remove from remaining
        remainingQueue = remainingQueue.filter(q => q.id !== item.id);
        saveQueue(remainingQueue);
      } catch (err: any) {
        // If it's auth error, stop processing immediately
        if (err.message && err.message.includes('Auth') || err.status === 401) {
          break;
        }
        // If other error, keep it in queue and continue or break
        break; 
      }
    }
    
    setIsSyncing(false);
  }, [isSyncing]);

  // Listen for online events
  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  // Initial attempt on load
  useEffect(() => {
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return { queue, addToQueue, processQueue, isSyncing };
}
```

---

### Task 2: Implement Queue in Components

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/BusList.tsx`
- Modify: `src/components/BusCard.tsx`

**Interfaces:**
- Consumes: `useOfflineSync()`

- [ ] **Step 1: Modify `Dashboard.tsx` to display badge**

Add `useOfflineSync` hook, pass to `BusList`, and show badge near header.

```typescript
import { CloudOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

// Inside Dashboard component:
const { queue, addToQueue } = useOfflineSync();

// In JSX header area:
{queue.length > 0 && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)', fontSize: '14px', fontWeight: 'bold' }}>
    <CloudOff size={16} />
    {queue.length} Data Tertunda
  </div>
)}

// Update BusList props to pass queue and addToQueue:
<BusList 
  data={busData} 
  sheetId={currentSheetId} 
  tabName={currentTabName} 
  headerMap={headerMap}
  syncQueue={queue}
  addToQueue={addToQueue}
/>
```

- [ ] **Step 2: Modify `BusList.tsx` to forward props**

```typescript
import type { SyncItem } from '../hooks/useOfflineSync';

interface Props {
  // existing props...
  syncQueue: SyncItem[];
  addToQueue: (item: any) => void;
}

// In JSX, pass to BusCard:
<BusCard 
  // existing props...
  isQueued={syncQueue.some(q => q.rowIndex === bus.row)}
  addToQueue={addToQueue}
/>
```

- [ ] **Step 3: Modify `BusCard.tsx` to handle failures**

```typescript
interface Props {
  // existing props...
  isQueued: boolean;
  addToQueue: (item: any) => void;
}

// In handleSave:
try {
  await updateBusData(sheetId, tabName, row, updates, headerMap);
  setIsEditing(false);
  setSaveStatus('success');
  setTimeout(() => setSaveStatus('idle'), 2000);
} catch (err: any) {
  // If it's auth error, show error. Else queue it.
  if (err.message && err.message.includes('API Credentials missing')) {
    setSaveStatus('error');
    alert('Sesi login telah habis. Silakan refresh dan login ulang.');
  } else {
    // Treat as network/sync error
    addToQueue({ sheetId, tabName, rowIndex: row, updates, headerMap });
    setIsEditing(false);
    setSaveStatus('queued'); // We'll add this new status
  }
}

// Add 'queued' to saveStatus type:
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'queued'>('idle');

// In JSX for status text:
{saveStatus === 'queued' || isQueued ? (
  <span style={{ color: 'var(--warning-color)', fontSize: '14px', fontWeight: 'bold' }}>Menunggu Sinyal...</span>
) : /* existing logic */}
```
