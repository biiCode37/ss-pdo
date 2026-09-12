# Laporan Perbaikan (Refactor 37)

Dokumen ini mendokumentasikan implementasi penyederhanaan status armada `[SGO, T.O, OFF]`, perbaikan sinkronisasi SGO pada Google Sheets & UI, serta penambahan tabel riwayat audit append-only `fleet_status_logs` di Supabase.

---

## 1. Implementasi Perbaikan

### 1.1 Penyederhanaan Opsi Status Armada (`[SGO, T.O, OFF]`)
- **Tindakan:**
  1. Mengubah tipe `BrushMode` pada `src/components/fleetStatus/FleetStatusModal.tsx` menjadi `'SGO' | 'OFF' | 'TO'`.
  2. Menghapus tombol kuas `BA` dari toolbar pemilihan status armada.
  3. Menghapus counter `BA` dari footer modal ringkasan, sehingga ringkasan murni menampilkan:
     - `SGO: {summaryCounts.sgo}`
     - `OFF: {summaryCounts.off}`
     - `T.O: {summaryCounts.to}`
  4. Menghapus kode `BA` dari `STATUS_CODES` di `src/constants/texts/text_fleet_status.ts`.

---

### 1.2 Perbaikan Format Keterangan Shift (`combineShiftKeterangan`)
- **Tindakan:**
  Memperbaiki fungsi `combineShiftKeterangan` pada `src/utils/keteranganUtils.ts` agar tidak menimpa status SGO dengan catatan shift lainnya:
  - Jika Shift 1 berketerangan dan Shift 2 SGO: kembalikan `"${note1} | SGO"`
  - Jika Shift 1 SGO dan Shift 2 berketerangan: kembalikan `"SGO | ${note2}"`
  - Jika kedua shift SGO: kembalikan `""`
  - Jika kedua shift identik: kembalikan `${note1}`
  - Jika kedua shift beda keterangan: kembalikan `"${note1} | ${note2}"`
  
  Dengan format ini, saat `splitShiftKeterangan` membaca `"SGO | TO EVDAL"` atau `"OFF | SGO"`, fungsi `cleanShiftNote("SGO")` menghasilkan `""` (SGO murni), sehingga izin input data operasional di halaman SS langsung terbuka.

---

### 1.3 Pembuatan Tabel Audit Append-Only `fleet_status_logs` di Supabase
- **Tindakan:**
  1. Membuat migrasi `supabase/migrations/20260912000001_create_fleet_status_logs.sql`:
     - Kolom: `id`, `route_id`, `route_code`, `date`, `shift`, `sgo_count`, `to_count`, `off_count`, `total_units`, `fleet_status` (JSONB), `confirmed_by`, `created_at`.
     - Mengaktifkan Row Level Security (RLS).
  2. Menjalankan DDL ke database Supabase remote (`sejttnsanzogsykmtwym`) dan me-reload cache PostgREST.
  3. Menambahkan fungsi `recordFleetStatusAuditLog` dan `fetchFleetStatusAuditLogs` pada `src/services/dailyRouteReportService.ts`.
  4. Memanggil `recordFleetStatusAuditLog` di `handleConfirmFleetStatus` (`src/components/Dashboard.tsx`) setiap kali status dikonfirmasi, sehingga setiap perubahan tersimpan sebagai baris baru permanen.

---

## 2. Before vs After

### 2.1 `combineShiftKeterangan` di `src/utils/keteranganUtils.ts`

#### Before:
```ts
export function combineShiftKeterangan(s1?: string | null, s2?: string | null): string {
  const note1 = cleanShiftNote(s1);
  const note2 = cleanShiftNote(s2);

  if (!note1 && !note2) return '';
  if (note1 && !note2) return note1;  // <-- Masalah: jika s2 SGO, s2 hilang
  if (!note1 && note2) return note2;  // <-- Masalah: jika s1 SGO, s1 hilang
  if (note1 === note2) return note1;

  return `${note1} | ${note2}`;
}
```

#### After:
```ts
export function combineShiftKeterangan(s1?: string | null, s2?: string | null): string {
  const note1 = cleanShiftNote(s1);
  const note2 = cleanShiftNote(s2);

  if (!note1 && !note2) return '';
  if (note1 && !note2) return `${note1} | SGO`;
  if (!note1 && note2) return `SGO | ${note2}`;
  if (note1 === note2) return note1;

  return `${note1} | ${note2}`;
}
```

### 1.4 Penghapusan Redudansi Badge Biru BA pada Kartu Bus (`BusCard.tsx`)
- **Tindakan:**
  Pada header kartu bus di `BusCard.tsx`, sebelumnya unit non-SGO yang bukan OFF dan bukan TO dirender dengan badge pil biru `.unit-status-badge-ba` yang menampilkan teks `activeShiftStatus` (misal: `[BA.02 Pramudi Meriang]`). Teks tersebut 100% redundan karena baris di bawahnya telah menampilkan detail catatan lengkap dengan `AlertTriangle` dan `FormattedNoteText`.
  Badge di header kini hanya dirender khusus untuk status kesiapan armada operasional (`OFF` dan `T.O`). Untuk catatan kendala/BA lainnya, badge di header tidak ditampilkan sehingga tampilan kartu bersih tanpa duplikasi.

---

## 2. Before vs After

### 2.1 `combineShiftKeterangan` di `src/utils/keteranganUtils.ts`

#### Before:
```ts
export function combineShiftKeterangan(s1?: string | null, s2?: string | null): string {
  const note1 = cleanShiftNote(s1);
  const note2 = cleanShiftNote(s2);

  if (!note1 && !note2) return '';
  if (note1 && !note2) return note1;  // <-- Masalah: jika s2 SGO, s2 hilang
  if (!note1 && note2) return note2;  // <-- Masalah: jika s1 SGO, s1 hilang
  if (note1 === note2) return note1;

  return `${note1} | ${note2}`;
}
```

#### After:
```ts
export function combineShiftKeterangan(s1?: string | null, s2?: string | null): string {
  const note1 = cleanShiftNote(s1);
  const note2 = cleanShiftNote(s2);

  if (!note1 && !note2) return '';
  if (note1 && !note2) return `${note1} | SGO`;
  if (!note1 && note2) return `SGO | ${note2}`;
  if (note1 === note2) return note1;

  return `${note1} | ${note2}`;
}
```

---

### 2.2 Pilihan Kuas pada `FleetStatusModal.tsx`

#### Before:
Toolbar memiliki 4 pilihan: `[SGO, OFF, T.O, BA]`.
Footer memiliki 4 counter: `SGO, OFF, T.O, BA`.

#### After:
Toolbar memiliki 3 pilihan: `[SGO, OFF, T.O]`.
Footer memiliki 3 counter: `SGO, OFF, T.O`.

---

### 2.3 Header Kartu Bus (`BusCard.tsx`)

#### Before:
Menampilkan badge biru `[BA.02 Pramudi Meriang]` di sebelah nomor body unit, dan di baris bawahnya menampilkan lagi `⚠️ [BA.02] PRAMUDI MERIANG`.

#### After:
Badge di samping nomor body hanya menampilkan `OFF` atau `T.O`. Keterangan kendala/BA ditampilkan satu kali secara elegan pada baris catatan `⚠️ [BA.02] PRAMUDI MERIANG`.


## 3. Case: Skenario Lapangan

### Skenario: Bus Cadangan / Perpal Beroperasi Kembali di Siang Hari
1. **Pagi hari (Shift 1, pk 05:00):**
   Pengawas menetapkan unit `JAK.15-02` berstatus `T.O` (Cadangan).
   Data tersimpan di Google Sheets dan Supabase `fleet_status_logs` mencatat event 1: Shift 1, TO: 1, SGO: 59.
2. **Siang hari (Shift 1, pk 10:30):**
   Unit `JAK.15-02` siap beroperasi di lapangan menggantikan unit lain.
   Pengawas membuka modal Status Armada, memilih kuas `SGO`, dan men-tap unit `JAK.15-02`.
   Pengawas menekan **Konfirmasi & Terapkan Status Shift 1**.
3. **Hasil Setelah Perbaikan:**
   - Keterangan di Google Sheets terupdate menjadi `""` (atau `"SGO | ..."` jika shift 2 berbeda).
   - Kartu bus di halaman input SS seketika terbuka kuncinya dan siap diisi ritase / KM.
   - Database Supabase **menambahkan baris baru** di tabel `fleet_status_logs` mencatat event 2: Shift 1, TO: 0, SGO: 60, timestamp 10:30.
   - Riwayat audit event 1 (pk 05:00) tetap tersimpan utuh dan tidak terhapus.

---

## 4. Checklist Verifikasi & Quality Gates

- [x] Pilihan status armada disederhanakan menjadi `[SGO, T.O, OFF]` tanpa opsi BA.
- [x] Unit yang diubah kembali ke SGO tersimpan dengan benar di Google Sheets dan membuka kunci input UI.
- [x] Tabel `fleet_status_logs` aktif di Supabase dan mencatat baris baru setiap konfirmasi status.
- [x] `pnpm vitest run src/` ➔ 41 test files lulus 100% (329 passed, 0 failed).
- [x] `pnpm run build` ➔ TypeScript Strict Mode & Vite build lulus 0 error.
- [x] `graphify update .` ➔ Graf pengetahuan kode diperbarui.
