# Conflict Resolution, Visual Diff & Smart Offline Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghilangkan risiko kehilangan data (*data loss*) dan penimpaan data antar-pengguna dengan mengimplementasikan dialog komparasi tabrakan visual (Data Server vs Input Baru Anda), memperbaiki resolusi "Gunakan Data Server" (zero-write ke server), menerapkan penggabungan cerdas pada antrean offline (*smart queue merging* dengan preservasi snapshot baseline), serta menerapkan pengiriman kolom *dirty-only* (delta updates).

**Architecture:** 
1. Ekstraksi perubahan murni (*dirty fields*) pada saat simpan kartu bus sehingga hanya kolom yang benar-benar diedit pengguna yang dikirim ke Google Sheets dan antrean offline, melindungi kolom milik petugas lain dan kolom rumus SSOT.
2. Ketika terdeteksi tabrakan data (OCC collision), bangun kartu komparasi visual (*side-by-side diff table*) dalam SweetAlert2 dengan sanitasi anti-XSS dan CSS variables semantik.
3. Tombol "Gunakan Data Server" membatalkan editan lokal, memperbarui UI lokal secara reaktif dengan data server, dan menghapus item antrean tanpa melakukan penulisan balik ke Google Sheets.
4. Pada kondisi offline, jika unit bus yang sama diedit berulang kali, fungsi `addToQueue` menggabungkan kolom-kolom pembaruan (*updates*) dan mempertahankan `originalSnapshot` awal untuk deteksi tabrakan yang akurat saat online.

**Tech Stack:** React, TypeScript, SweetAlert2 (`pdoSwal`), Vitest, CSS Semantic Variables (`semantic.css`).

## Global Constraints
- Bahasa Indonesia baku & ramah pengguna untuk semua string teks antarmuka di `src/constants/texts/`.
- Dilarang keras hardcode nilai warna (hex/rgb); wajib merujuk ke CSS variables dari `src/styles/tokens/semantic.css`.
- Sanitasi ketat anti-XSS via `escapeHtml()` pada seluruh nilai dinamis di template HTML SweetAlert2.
- Proteksi kolom berumus: dilarang menyertakan kolom formula (seperti `toaShift2`, ritase, dll) dalam payload mutasi.
- Branch kerja: Wajib tetap berada di branch `devmode`. Dilarang menyentuh branch `main`.

---

### Task 1: Kamus Teks Sentral & Label Kolom Ramah Pengguna

**Files:**
- Modify: `src/constants/texts/text_alerts.ts:23-42`
- Test: `src/constants/texts/texts.test.ts`

**Interfaces:**
- Produces:
  - `BUS_FIELD_LABELS: Record<string, string>` (pemetaan nama field teknis ke nama ramah operasional)
  - `TEXT_ALERTS.CONFLICT_DIFF`: Header tabel, badge server, badge lokal, dan teks bantuan
  - `TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED`: Pesan sukses pembaruan data dari server

- [ ] **Step 1: Tulis tes gagal di `src/constants/texts/texts.test.ts`**

Tambahkan pengujian untuk memastikan label kolom dan teks komparasi terdefinisi dengan benar:

```typescript
describe('Conflict Comparison & Field Labels Text Dictionary', () => {
  it('defines friendly Indonesian labels for all editable bus fields', () => {
    expect(BUS_FIELD_LABELS.toaShift1).toBe('TOA Shift 1');
    expect(BUS_FIELD_LABELS.manualShift1).toBe('Manual Shift 1');
    expect(BUS_FIELD_LABELS.totalToa).toBe('Total TOA');
    expect(BUS_FIELD_LABELS.kmAwal1).toBe('KM Awal Shift 1');
    expect(BUS_FIELD_LABELS.kmAkhir1).toBe('KM Akhir Shift 1');
    expect(BUS_FIELD_LABELS.kmAwal2).toBe('KM Awal Shift 2');
    expect(BUS_FIELD_LABELS.kmAkhir2).toBe('KM Akhir Shift 2');
    expect(BUS_FIELD_LABELS.tripPergi).toBe('Trip Pergi');
    expect(BUS_FIELD_LABELS.tripPulang).toBe('Trip Pulang');
    expect(BUS_FIELD_LABELS.keterangan).toBe('Keterangan');
  });

  it('defines conflict diff headers and notification toasts', () => {
    expect(TEXT_ALERTS.CONFLICT_DIFF.SECTION_TITLE).toContain('Rincian Perbedaan Kolom');
    expect(TEXT_ALERTS.CONFLICT_DIFF.SERVER_HEADER).toBe('Data Server:');
    expect(TEXT_ALERTS.CONFLICT_DIFF.USER_HEADER).toBe('Input Baru Anda:');
    expect(TEXT_ALERTS.CONFLICT_DIFF.EMPTY_VALUE).toBe('(Kosong)');
    expect(TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED).toBe('Tampilan diperbarui menggunakan data server terbaru.');
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: FAIL dengan pesan `BUS_FIELD_LABELS is not defined` atau `CONFLICT_DIFF is not defined`.

- [ ] **Step 3: Implementasikan kamus teks di `src/constants/texts/text_alerts.ts`**

Tambahkan `BUS_FIELD_LABELS` dan perluas `TEXT_ALERTS` dengan token komparasi:

```typescript
export const BUS_FIELD_LABELS: Record<string, string> = {
  unit: "Nomor Bodi Unit",
  tripPergi: "Trip Pergi",
  tripPulang: "Trip Pulang",
  toaShift1: "TOA Shift 1",
  manualShift1: "Manual Shift 1",
  toaShift2: "TOA Shift 2",
  manualShift2: "Manual Shift 2",
  totalToa: "Total TOA",
  kmAwal1: "KM Awal Shift 1",
  kmAkhir1: "KM Akhir Shift 1",
  kmAwal2: "KM Awal Shift 2",
  kmAkhir2: "KM Akhir Shift 2",
  keterangan: "Keterangan",
};
```

Serta perbarui `TEXT_ALERTS.CONFLICT`, `TEXT_ALERTS.CONFLICT_ONLINE`, dan tambahkan `TEXT_ALERTS.CONFLICT_DIFF`:

```typescript
  CONFLICT: {
    TITLE: "Tabrakan Data (Conflict)",
    UNIT_TEXT: (unit: string) =>
      `Data unit ${unit} di Google Sheets telah berubah saat Anda offline. Silakan tinjau perbedaan data di bawah ini:`,
    GENERAL_TEXT:
      "Data di Google Sheets telah berubah saat Anda offline. Silakan tinjau perbedaan data di bawah ini:",
    CONFIRM_BTN: "Tetap Timpa (Force)",
    DENY_BTN: "Gunakan Data Server",
    CANCEL_BTN: "Batal",
    TOAST_SERVER_DATA_APPLIED: "Tampilan diperbarui menggunakan data server terbaru.",
  },
  CONFLICT_ONLINE: {
    TITLE: "Data Spreadsheet Telah Berubah",
    UNIT_TEXT: (unit: string) =>
      `Data unit ${unit} di Google Sheets baru saja diperbarui oleh pihak lain. Silakan tinjau perbedaan data di bawah ini:`,
    GENERAL_TEXT:
      "Data di Google Sheets baru saja diperbarui oleh pihak lain. Silakan tinjau perbedaan data di bawah ini:",
    CONFIRM_BTN: "Tetap Timpa (Force)",
    DENY_BTN: "Gunakan Data Server",
    CANCEL_BTN: "Batal",
    TOAST_SERVER_DATA_APPLIED: "Tampilan diperbarui menggunakan data server terbaru.",
  },
  CONFLICT_DIFF: {
    SECTION_TITLE: "Rincian Perbedaan Kolom:",
    SERVER_HEADER: "Data Server:",
    USER_HEADER: "Input Baru Anda:",
    EMPTY_VALUE: "(Kosong)",
  },
```

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `pnpm vitest run src/constants/texts/texts.test.ts`
Expected: PASS (seluruh tes kamus teks lulus 100%).

- [ ] **Step 5: Commit Task 1**

```bash
git add src/constants/texts/text_alerts.ts src/constants/texts/texts.test.ts
git commit -m "feat: add conflict diff labels and alert texts"
```

---

### Task 2: Komponen Builder Visual Conflict Diff & Dialog Update

**Files:**
- Modify: `src/utils/alertUtils.ts:215-254`
- Test: `src/utils/alertUtils.test.ts`

**Interfaces:**
- Consumes:
  - `BUS_FIELD_LABELS` & `TEXT_ALERTS` dari `src/constants/texts/text_alerts`
  - `escapeHtml` dari `src/utils/alertUtils`
- Produces:
  - `export interface ConflictDiffItem { field: string; label: string; serverValue: string; userValue: string; }`
  - `export function buildConflictDiffHtml(diffs: ConflictDiffItem[], explanationText?: string): string`
  - Perluasan opsi `showQueueConflictDialog({ diffs?: ConflictDiffItem[], ... })`

- [ ] **Step 1: Tulis tes unit di `src/utils/alertUtils.test.ts`**

Tambahkan pengujian untuk `buildConflictDiffHtml` dan pemanggilan `showQueueConflictDialog` dengan `diffs`:

```typescript
describe("buildConflictDiffHtml", () => {
  it("renders side-by-side comparison cards for colliding fields with proper escaping", () => {
    const diffs: ConflictDiffItem[] = [
      {
        field: "kmAkhir1",
        label: "KM Akhir Shift 1",
        serverValue: "300250",
        userValue: "300180",
      },
      {
        field: "keterangan",
        label: "Keterangan",
        serverValue: "<script>alert(1)</script>",
        userValue: "",
      },
    ];

    const html = buildConflictDiffHtml(diffs, "Pesan pengantar");
    expect(html).toContain("KM Akhir Shift 1");
    expect(html).toContain("300250");
    expect(html).toContain("300180");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("(Kosong)");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

Run: `pnpm vitest run src/utils/alertUtils.test.ts`
Expected: FAIL dengan `buildConflictDiffHtml is not defined`.

- [ ] **Step 3: Implementasikan `buildConflictDiffHtml` dan update `showQueueConflictDialog` di `src/utils/alertUtils.ts`**

```typescript
export interface ConflictDiffItem {
  field: string;
  label: string;
  serverValue: string;
  userValue: string;
}

export function buildConflictDiffHtml(
  diffs: ConflictDiffItem[],
  explanationText?: string,
): string {
  const introHtml = explanationText
    ? `<div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 12px; text-align: left; line-height: 1.5;">${explanationText}</div>`
    : "";

  if (!diffs || diffs.length === 0) {
    return introHtml;
  }

  const itemsHtml = diffs
    .map((item) => {
      const serverDisplay = item.serverValue
        ? escapeHtml(item.serverValue)
        : `<span style="color: var(--color-text-muted); font-style: italic;">${TEXT_ALERTS.CONFLICT_DIFF.EMPTY_VALUE}</span>`;
      const userDisplay = item.userValue
        ? escapeHtml(item.userValue)
        : `<span style="color: var(--color-text-muted); font-style: italic;">${TEXT_ALERTS.CONFLICT_DIFF.EMPTY_VALUE}</span>`;

      return `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--color-border-subtle, rgba(255,255,255,0.08));">
          <div style="font-weight: 700; color: var(--color-text-primary); font-size: 12.5px; margin-bottom: 6px; text-align: left;">
            🔹 ${escapeHtml(item.label)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; text-align: left;">
            <div style="background: var(--color-surface-raised, rgba(255,255,255,0.04)); padding: 8px; border-radius: 8px; border: 1px solid var(--color-border-subtle, rgba(255,255,255,0.1));">
              <div style="color: var(--color-text-muted); font-size: 10.5px; margin-bottom: 2px;">${TEXT_ALERTS.CONFLICT_DIFF.SERVER_HEADER}</div>
              <div style="font-weight: 600; color: var(--color-text-primary); word-break: break-word;">${serverDisplay}</div>
            </div>
            <div style="background: var(--color-surface-raised, rgba(255,255,255,0.04)); padding: 8px; border-radius: 8px; border: 1px solid var(--color-warning-border, rgba(245,158,11,0.3));">
              <div style="color: var(--color-warning-fg, #f59e0b); font-size: 10.5px; margin-bottom: 2px;">${TEXT_ALERTS.CONFLICT_DIFF.USER_HEADER}</div>
              <div style="font-weight: 600; color: var(--color-warning-fg, #f59e0b); word-break: break-word;">${userDisplay}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: inherit;">
      ${introHtml}
      <div style="background: var(--color-surface-subtle, rgba(0,0,0,0.2)); border-radius: 12px; padding: 10px 12px; border: 1px solid var(--color-border-subtle, rgba(255,255,255,0.1)); max-height: 240px; overflow-y: auto;">
        <div style="font-weight: 700; color: var(--color-text-secondary); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; text-align: left;">
          ${TEXT_ALERTS.CONFLICT_DIFF.SECTION_TITLE}
        </div>
        ${itemsHtml}
      </div>
    </div>
  `;
}
```

Perbarui `showQueueConflictDialog`:
```typescript
export async function showQueueConflictDialog(options: {
  unitName?: string;
  isOnline?: boolean;
  diffs?: ConflictDiffItem[];
  onUseServer: () => void;
  onForceSave: () => void;
}) {
  const isOnline = options.isOnline ?? false;
  const alertTextDict = isOnline
    ? TEXT_ALERTS.CONFLICT_ONLINE
    : TEXT_ALERTS.CONFLICT;

  const introText = options.unitName
    ? alertTextDict.UNIT_TEXT(escapeHtml(options.unitName))
    : alertTextDict.GENERAL_TEXT;

  const htmlContent = buildConflictDiffHtml(options.diffs || [], introText);

  const result = await pdoSwal.fire({
    title: alertTextDict.TITLE,
    html: htmlContent,
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: alertTextDict.CONFIRM_BTN,
    denyButtonText: alertTextDict.DENY_BTN,
    cancelButtonText: alertTextDict.CANCEL_BTN,
    customClass: {
      container: "pdo-swal-container",
      popup: "pdo-swal-popup",
      confirmButton: "pdo-swal-confirm-btn pdo-swal-confirm-danger-btn",
      denyButton: "pdo-swal-confirm-btn",
      cancelButton: "pdo-swal-cancel-btn",
    },
  });

  if (result.isConfirmed) {
    options.onForceSave();
  } else if (result.isDenied) {
    options.onUseServer();
  }
}
```

- [ ] **Step 4: Jalankan tes unit untuk verifikasi kelulusan**

Run: `pnpm vitest run src/utils/alertUtils.test.ts`
Expected: PASS (semua pengujian `alertUtils` lulus).

- [ ] **Step 5: Commit Task 2**

```bash
git add src/utils/alertUtils.ts src/utils/alertUtils.test.ts
git commit -m "feat: add visual conflict diff comparison to conflict dialog"
```

---

### Task 3: Perbaikan Logika "Gunakan Data Server" & Pembersihan `conflictMerge.ts`

**Files:**
- Modify: `src/utils/conflictMerge.ts:1-29`
- Modify: `src/components/busCard/useBusCardSave.ts:126-144`
- Test: `src/utils/conflictMerge.test.ts`
- Test: `src/components/busCard/useBusCardSave.test.tsx`

**Interfaces:**
- Consumes:
  - `BUS_FIELD_LABELS` dari `src/constants/texts/text_alerts`
  - `ConflictDiffItem`, `showQueueConflictDialog` dari `src/utils/alertUtils`
- Logic behavior:
  - Pada `onUseServer`: BATALKAN pemanggilan simpan ke server. Perbarui state lokal (`formData`, `onUpdateBus`) menggunakan nilai dari `remoteData`. Munculkan toast informasi ramah.

- [ ] **Step 1: Tulis tes perilaku di `src/components/busCard/useBusCardSave.test.tsx`**

Perbarui/tambahkan unit test untuk membuktikan bahwa ketika `onUseServer` dipilih:
1. `updateBusData` **TIDAK** terpanggil (zero-write ke Google Sheets).
2. `onUpdateBus` terpanggil dengan `remoteData`.
3. Toast informasi berhasil ditampilkan.

```typescript
it("does NOT write to server and updates local UI with remoteData when user chooses onUseServer", async () => {
  // Setup collision scenario
  (googleSheets.getBusRowData as any).mockResolvedValue({
    kmAwal1: "300200", // remote changed from baseline 300000
  });

  // Render hook & trigger handleSaveUpdates({ kmAwal1: "300100" })
  ...
  // Simulate user clicking onUseServer in showQueueConflictDialog
  const conflictCall = (alertUtils.showQueueConflictDialog as any).mock.calls[0][0];
  conflictCall.onUseServer();

  // Assertions:
  expect(googleSheets.updateBusData).not.toHaveBeenCalled();
  expect(mockOnUpdateBus).toHaveBeenCalledWith(expect.objectContaining({ kmAwal1: "300200" }));
  expect(alertUtils.showInfoToast).toHaveBeenCalledWith(TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED);
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/components/busCard/useBusCardSave.test.tsx`
Expected: FAIL karena kode lama masih memanggil `handleSaveUpdates(mergedUpdates, true)`.

- [ ] **Step 3: Perbaiki `useBusCardSave.ts` dan susun `diffs` komparasi**

Di [`src/components/busCard/useBusCardSave.ts`](file:///d:/MINE/SS_PDO/src/components/busCard/useBusCardSave.ts):
1. Bangun daftar `diffs: ConflictDiffItem[]` dari `dirtyFields` yang berbenturan dengan `remoteData`.
2. Perbaiki handler `onUseServer`:
```typescript
        if (hasCollision) {
          setIsLoading(false);

          // Susun daftar rincian kolom yang berbenturan untuk ditampilkan ke user
          const diffs: ConflictDiffItem[] = [];
          for (const field of dirtyFields) {
            const remoteNorm = normalizeFieldValue(remoteData[field]);
            const updateNorm = normalizeFieldValue(updates[field]);
            if (remoteNorm !== updateNorm) {
              diffs.push({
                field,
                label: BUS_FIELD_LABELS[field] || String(field),
                serverValue: String(remoteData[field] ?? ""),
                userValue: String(updates[field] ?? ""),
              });
            }
          }

          showQueueConflictDialog({
            unitName: bus.unit,
            isOnline: true,
            diffs,
            onUseServer: () => {
              // PERBAIKAN: Gunakan data server = BATALKAN write lokal, sinkronkan UI lokal dengan server
              const newFormData = { ...formData, ...remoteData };
              setFormData(newFormData);
              if (onUpdateBus) {
                onUpdateBus(remoteData);
              }
              setIsLoading(false);
              setSaveStatus("idle");
              showInfoToast(TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED);
            },
            onForceSave: () => {
              // Paksa simpan: kirim deltaUpdates milik user dengan bypass OCC
              handleSaveUpdates(updates, true);
            },
          });
          return;
        }
```

3. Rapikan `src/utils/conflictMerge.ts`: Pastikan fungsi utilitas merge (jika masih digunakan di bagian lain) benar-benar memprioritaskan data remote saat remote diprioritaskan, atau berikan dokumentasi kontrak yang jelas.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `pnpm vitest run src/components/busCard/useBusCardSave.test.tsx src/utils/conflictMerge.test.ts`
Expected: PASS (semua skenario penanganan tabrakan lulus 100%).

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/busCard/useBusCardSave.ts src/components/busCard/useBusCardSave.test.tsx src/utils/conflictMerge.ts src/utils/conflictMerge.test.ts
git commit -m "fix: make Use Server Data zero-write and sync local state"
```

---

### Task 4: Delta / Dirty-Only Updates Extraction & Proteksi Rumus

**Files:**
- Modify: `src/components/busCard/useBusCardSave.ts:70-180`
- Test: `src/components/busCard/useBusCardSave.test.tsx`

**Interfaces:**
- Consumes:
  - `normalizeFieldValue` dari `src/utils/numberUtils`
  - `FORMULA_FIELDS` proteksi kolom berumus
- Produces:
  - `deltaUpdates: Partial<BusData>` yang hanya berisi kolom dengan nilai berbeda dari `bus` (baseline lokal).

- [ ] **Step 1: Tulis tes unit untuk ekstraksi delta di `useBusCardSave.test.tsx`**

```typescript
it("sends ONLY modified dirty fields (delta updates) to updateBusData, omitting untouched fields", async () => {
  const initialBus: BusData = {
    ...sampleBus,
    toaShift1: "100",
    manualShift1: "5",
    totalToa: "200",
  };

  // User hanya mengubah toaShift1 dari 100 menjadi 120 pada payload mode All
  const updatesAllMode = {
    toaShift1: "120",
    manualShift1: "5", // tidak berubah
    totalToa: "200", // tidak berubah
  };

  await latestSave?.handleSaveUpdates(updatesAllMode);

  // updateBusData hanya boleh dipanggil dengan { toaShift1: "120" }
  expect(googleSheets.updateBusData).toHaveBeenCalledWith(
    "sheet-1",
    "2",
    1,
    { toaShift1: "120" },
    sampleHeaderMap,
    initialBus,
  );
});

it("exits early without network request if no fields actually changed", async () => {
  const identicalUpdates = {
    toaShift1: "100", // sama persis dengan initial
  };

  await latestSave?.handleSaveUpdates(identicalUpdates);

  expect(googleSheets.updateBusData).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/components/busCard/useBusCardSave.test.tsx`
Expected: FAIL karena saat ini `updateBusData` masih menerima `updates` lengkap tanpa difilter ke delta.

- [ ] **Step 3: Implementasikan ekstraksi delta di `useBusCardSave.ts`**

Di dalam `handleSaveUpdates`:
1. Ekstraksi `deltaUpdates`:
```typescript
    // Ekstraksi delta murni: hanya kolom yang benar-benar berbeda dari baseline lokal
    const candidateFields = Object.keys(updates) as (keyof BusData)[];
    const deltaUpdates: Partial<BusData> = {};
    for (const field of candidateFields) {
      // Abaikan kolom rumus spreadsheet
      if (field === "toaShift2") continue;

      const updateNorm = normalizeFieldValue(updates[field]);
      const baseNorm = normalizeFieldValue(bus[field]);
      if (updateNorm !== baseNorm) {
        deltaUpdates[field] = updates[field];
      }
    }

    // Jika tidak ada perubahan riil dari baseline lokal, akhiri tanpa request jaringan
    if (!forceOverwrite && Object.keys(deltaUpdates).length === 0) {
      setIsLoading(false);
      setSaveStatus("success");
      return;
    }
```
2. Gunakan `deltaUpdates` pada pemanggilan `updateBusData` dan `addToQueue`:
```typescript
    await updateBusData(
      sheetId,
      tabName,
      bus.rowIndex,
      forceOverwrite ? updates : deltaUpdates,
      headerMap,
      bus,
    );
```
Dan pada blok offline fallback:
```typescript
    if (isNetworkError(err)) {
      const originalSnapshot: Partial<BusData> = {};
      const payloadToSend = forceOverwrite ? updates : deltaUpdates;
      for (const field of Object.keys(payloadToSend) as (keyof BusData)[]) {
        (originalSnapshot as any)[field] = bus[field];
      }
      addToQueue({
        sheetId,
        tabName,
        rowIndex: bus.rowIndex,
        updates: payloadToSend,
        headerMap,
        originalSnapshot,
      });
      ...
    }
```

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `pnpm vitest run src/components/busCard/useBusCardSave.test.tsx`
Expected: PASS (semua tes ekstraksi delta dan optimasi zero-change lulus).

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/busCard/useBusCardSave.ts src/components/busCard/useBusCardSave.test.tsx
git commit -m "feat: send only dirty delta updates to protect other fields"
```

---

### Task 5: Smart Offline Queue Merging dengan Preservasi Baseline Snapshot

**Files:**
- Modify: `src/hooks/useOfflineSync.ts:115-145, 275-290`
- Test: `src/hooks/__tests__/useOfflineSync.test.tsx`

**Interfaces:**
- Consumes:
  - `SyncItem`, `readQueueFromStorage`, `writeQueueToStorage`
- Logic behavior:
  - Pada `addToQueue`: Jika baris yang sama sudah ada di antrean, gabungkan `updates`, gabungkan `originalSnapshot` dengan memprioritaskan snapshot awal, reset status ke `'pending'`, dan pertahankan `id` awal.
  - Pada `resolveConflict`: Ketika konflik antrean offline diselesaikan dengan "Gunakan Data Server", ambil data remote, panggil `onSyncSuccess`, hapus item dari storage, dan munculkan toast.

- [ ] **Step 1: Tulis tes unit untuk smart queue merging di `useOfflineSync.test.tsx`**

```typescript
it("merges updates and preserves initial originalSnapshot when adding an item for the same row to the queue", () => {
  const { result } = renderHook(() => useOfflineSync());

  // Input 1 saat offline: TOA Shift 1
  act(() => {
    result.current.addToQueue({
      sheetId: "sheet-1",
      tabName: "2",
      rowIndex: 5,
      updates: { toaShift1: "150" },
      headerMap: mockHeaderMap,
      originalSnapshot: { toaShift1: "100" },
    });
  });

  // Input 2 saat offline pada baris yang sama: KM Akhir 1
  act(() => {
    result.current.addToQueue({
      sheetId: "sheet-1",
      tabName: "2",
      rowIndex: 5,
      updates: { kmAkhir1: "300500" },
      headerMap: mockHeaderMap,
      originalSnapshot: { kmAkhir1: "300200" },
    });
  });

  // Antrean harus memiliki tepat 1 item dengan updates gabungan dan snapshot gabungan
  const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
  expect(queue).toHaveLength(1);
  expect(queue[0].updates).toEqual({
    toaShift1: "150",
    kmAkhir1: "300500",
  });
  expect(queue[0].originalSnapshot).toEqual({
    toaShift1: "100",
    kmAkhir1: "300200",
  });
  expect(queue[0].status).toBe("pending");
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `pnpm vitest run src/hooks/__tests__/useOfflineSync.test.tsx`
Expected: FAIL karena `addToQueue` lama memfilter dan membuang `toaShift1`.

- [ ] **Step 3: Implementasikan smart merging di `src/hooks/useOfflineSync.ts`**

Perbarui fungsi `addToQueue`:
```typescript
  const addToQueue = useCallback((
    item: Omit<SyncItem, 'id' | 'status' | 'retryCount'>
  ) => {
    const currentQueue = readQueueFromStorage();
    const existingIndex = currentQueue.findIndex(
      q => q.sheetId === item.sheetId && q.tabName === item.tabName && q.rowIndex === item.rowIndex
    );

    let newQueue: SyncItem[];
    if (existingIndex >= 0) {
      const existingItem = currentQueue[existingIndex];
      // Gabungkan updates: properti baru menimpa properti lama jika ada overlap, properti lain dipertahankan
      const mergedUpdates = {
        ...existingItem.updates,
        ...item.updates,
      };

      // Preservasi originalSnapshot: pertahankan snapshot awal untuk field yang sudah ada sebelumnya
      const mergedSnapshot = {
        ...item.originalSnapshot,
        ...existingItem.originalSnapshot, // Baseline awal sebelum editan pertama tetap menjadi acuan utama
      };

      const updatedItem: SyncItem = {
        ...existingItem,
        updates: mergedUpdates,
        headerMap: item.headerMap || existingItem.headerMap,
        originalSnapshot: mergedSnapshot,
        status: 'pending',
        retryCount: 0,
      };

      newQueue = [...currentQueue];
      newQueue[existingIndex] = updatedItem;
    } else {
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).substring(2, 7);

      const newItem: SyncItem = {
        ...item,
        id: uniqueId,
        status: 'pending',
        retryCount: 0,
      };
      newQueue = [...currentQueue, newItem];
    }

    writeQueueToStorage(newQueue);
    setQueue(newQueue);

    // Backup ke Supabase
    const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'offline_user';
    backupSyncQueue({
      user_email: userEmail,
      spreadsheet_id: item.sheetId,
      tab_name: item.tabName,
      row_index: item.rowIndex,
      payload: item.updates,
      status: 'pending',
    }).catch(() => {});
  }, []);
```

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `pnpm vitest run src/hooks/__tests__/useOfflineSync.test.tsx`
Expected: PASS (seluruh tes `useOfflineSync` lulus 100%).

- [ ] **Step 5: Commit Task 5**

```bash
git add src/hooks/useOfflineSync.ts src/hooks/__tests__/useOfflineSync.test.tsx
git commit -m "fix: smart merge offline queue items preserving initial snapshot"
```

---

### Task 6: Dokumentasi Audit & Laporan Perbaikan (Refactor 194)

**Files:**
- Create: `refactor-ss-pdo/refact_194/AUDIT_BUGS.md`
- Create: `refactor-ss-pdo/refact_194/REPAIR_REPORT.md`

- [ ] **Step 1: Buat dokumen `refactor-ss-pdo/refact_194/AUDIT_BUGS.md`**

Dokumentasikan temuan `BUG-194-01` (Inverted Conflict Resolution), `BUG-194-02` (Offline Queue Item Loss on Overwrite), `BUG-194-03` (All-Column Overwrite Collision), dan `UX-194-01` (Lack of Visual Conflict Diff).

- [ ] **Step 2: Buat dokumen `refactor-ss-pdo/refact_194/REPAIR_REPORT.md`**

Dokumentasikan perbaikan Before vs After, diagram skenario lapangan, dan integrasi visual diff card.

- [ ] **Step 3: Commit Task 6**

```bash
git add refactor-ss-pdo/refact_194/
git commit -m "docs: add Refactor 194 audit & repair report"
```

---

### Task 7: Quality Gates Otomatis & Knowledge Graph Update

**Files:**
- Modify: `graphify-out/*` (via CLI)

- [ ] **Step 1: Jalankan pengujian kontrak warna**

Run: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
Expected: 116/116 PASS.

- [ ] **Step 2: Jalankan seluruh test suite unit**

Run: `pnpm vitest run src/`
Expected: Seluruh 139+ file tes lulus 100% tanpa kegagalan.

- [ ] **Step 3: Jalankan TypeScript Strict Mode & Production Build**

Run: `pnpm run build`
Expected: 0 error (`tsc -b && vite build` sukses).

- [ ] **Step 4: Perbarui Knowledge Graph**

Run: `graphify update .`
Expected: Knowledge graph AST terupdate dengan commit terbaru.

- [ ] **Step 5: Commit Final Quality Gates**

```bash
git add graphify-out/
git commit -m "chore: update graphify knowledge graph for Refactor 194"
```
