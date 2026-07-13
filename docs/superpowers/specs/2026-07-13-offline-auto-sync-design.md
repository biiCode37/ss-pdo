# Offline Auto-Sync Design Spec

**Date**: 2026-07-13
**Topic**: Offline Auto-Sync (Sistem Antrean Data)

## Context & Purpose
PDO Mobile is used by field workers to update Google Sheets. In the field, network connectivity is often unstable. When a user taps "Simpan" (Save) while the connection is dropping, the Google Sheets API request fails, and the user's data entry is lost unless they manually retry. The goal of this feature is to catch failed network requests, queue the data locally, and automatically resend it when the network returns.

## Core Architecture
Since we rely on Google Identity Services and `gapi.client`, which require DOM access and the Google API script to be loaded, we cannot use a background Service Worker (BackgroundSync API) for this. Instead, we will implement an **App-Level Queue** utilizing `localStorage`.

### 1. Data Structure (Queue)
A new array in `localStorage` named `PDO_SYNC_QUEUE` will store pending updates.
```typescript
interface SyncItem {
  id: string; // Unique ID (e.g. timestamp)
  sheetId: string;
  tabName: string;
  rowIndex: number;
  updates: Partial<BusData>;
  headerMap: HeaderMap; // Need this to know which columns to update
  status: 'pending' | 'failed';
}
```

### 2. Failure Catching
In `BusCard.tsx`, the `handleSave` function calls `updateBusData`.
If `updateBusData` throws a network error or a 503 error, we catch it.
Instead of showing an error to the user, we package the payload into a `SyncItem`, push it to `PDO_SYNC_QUEUE`, and visually show the user that the item is "Tersimpan (Tertunda)".

### 3. Sync Engine (Auto-Execution)
We will create a custom React hook `useOfflineSync` or handle it in a top-level component (`Dashboard.tsx`).
- **Listeners**: The hook will listen to the browser's `window.addEventListener('online', ...)` event.
- **Execution Loop**: When triggered, it checks the queue. If items exist, it loops through them sequentially, calling `updateBusData`.
- **Conflict Handling**: If a sync fails due to auth (token expired), the loop stops and waits. If it fails due to network, it remains in the queue.
- **Cleanup**: Successfully sent items are removed from the queue.

### 4. UI Components
- **Sync Badge**: A small floating badge or header indicator displaying the number of pending items (e.g., "☁️ 3 Tertunda").
- **Card Status**: The specific bus card will show a yellow "Menunggu Sinyal" status instead of the green "Tersimpan" status.

## Error Handling & Edge Cases
- **Token Expiry during Sync**: The sync loop must gracefully handle 401 Unauthorized errors by pausing the queue, as the user will need to manually re-authenticate via the UI.
- **Page Refresh**: On initial app load (refresh), the sync engine will immediately check the queue and attempt to process it if `navigator.onLine` is true.

## Scope Check
This is scoped perfectly for a single implementation plan. It touches the saving logic, adds a small top-level UI badge, and introduces a custom hook for the sync logic.
