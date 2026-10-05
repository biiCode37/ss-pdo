# Laporan Perbaikan (Refactor 36)

Dokumen ini mendokumentasikan implementasi perbaikan masalah DDL skema database PostgREST dan sanitasi pesan kesalahan pengguna pada aplikasi SS_PDO.

---

## 1. Implementasi Perbaikan

### 1.1 Penerapan DDL Skema Database Supabase & Sinkronisasi Migrasi

- **Tindakan:**
  Mengeksekusi pernyataan SQL DDL dari:
  1. `supabase/migrations/20260910000003_add_fleet_status_snapshot.sql`:
     - Menambahkan kolom `fleet_status_shift1` (`jsonb`)
     - Menambahkan kolom `fleet_status_shift2` (`jsonb`)
     - Menambahkan kolom `is_fleet_confirmed_s1` (`boolean`)
     - Menambahkan kolom `is_fleet_confirmed_s2` (`boolean`)
     - Menambahkan kolom `fleet_confirmed_s1_at` (`timestamptz`)
     - Menambahkan kolom `fleet_confirmed_s2_at` (`timestamptz`)
     - Menambahkan metadata komentar kolom.
  2. `supabase/migrations/20260909000001_dynamic_renops.sql`:
     - Menambahkan kolom `renops_weekday`, `renops_saturday`, `renops_sunday`, `renops_holiday` ke tabel `routes`.
     - Melakukan backfill nilai renops awal dari `default_renops`.
  3. Memuat ulang schema cache PostgREST:
     `NOTIFY pgrst, 'reload schema';`
  4. Mencatat versi migrasi ke tabel `supabase_migrations.schema_migrations`:
     - `20260909000001` (`dynamic_renops`)
     - `20260910000003` (`add_fleet_status_snapshot`)

---

### 1.2 Sanitasi Error Database di Frontend (Anti-Leak Technical DB Error)

- **Tindakan:**
  1. Memperbarui `src/utils/errorFormatter.ts` agar mendeteksi kata kunci error skema database / PostgREST (`schema cache`, `pgrst`, `column of`, `relation`, `violates`, `syntax error`, `gagal menyimpan laporan operasional rute`) dan mengembalikannya sebagai pesan ramah non-teknis (`TEXT_ERRORS.SAVE_REPORT_FAILED` atau `fallbackMessage`).
  2. Memperbarui blok `catch` pada `handleConfirmFleetStatus` di `src/components/Dashboard.tsx` agar menggunakan `formatUserError(err, TEXT_FLEET_STATUS.TOAST.APPLY_ERROR)` sebelum memanggil `showErrorToast`.
  3. Menambahkan unit test di `src/utils/errorFormatter.test.ts` untuk memastikan pesan error database tidak lagi bocor ke UI.

---

## 2. Before vs After

### 2.1 Error Handling di `src/components/Dashboard.tsx`

#### Before:
```tsx
    } catch (err: any) {
      console.warn('[Dashboard] Gagal menerapkan status armada:', err);
      showErrorToast(err?.message || TEXT_FLEET_STATUS.TOAST.APPLY_ERROR);
      throw err;
    }
```

#### After:
```tsx
    } catch (err: any) {
      console.warn('[Dashboard] Gagal menerapkan status armada:', err);
      const friendlyErr = formatUserError(err, TEXT_FLEET_STATUS.TOAST.APPLY_ERROR);
      if (friendlyErr) {
        showErrorToast(friendlyErr);
      }
      throw err;
    }
```

---

### 2.2 Error Formatter Sanitasi Database di `src/utils/errorFormatter.ts`

#### Before:
```ts
  // 7. Access / Permission Denied
  if (
    lowerMsg.includes("403") ||
    lowerMsg.includes("permissions_denied") ||
    lowerMsg.includes("hak akses")
  ) {
    return TEXT_ERRORS.PERMISSION_DENIED_GENERAL;
  }

  // Fallback to custom message or default friendly Indonesian message
  return (
    fallbackMessage ||
    TEXT_ERRORS.GENERIC_ISSUE
  );
```

#### After:
```ts
  // 7. Access / Permission Denied
  if (
    lowerMsg.includes("403") ||
    lowerMsg.includes("permissions_denied") ||
    lowerMsg.includes("hak akses")
  ) {
    return TEXT_ERRORS.PERMISSION_DENIED_GENERAL;
  }

  // 8. Database / Schema / PostgREST Internal Errors (Anti-leak technical DB errors to UI)
  if (
    lowerMsg.includes("schema cache") ||
    lowerMsg.includes("pgrst") ||
    lowerMsg.includes("column of") ||
    lowerMsg.includes("relation") ||
    lowerMsg.includes("violates") ||
    lowerMsg.includes("syntax error") ||
    lowerMsg.includes("gagal menyimpan laporan operasional rute")
  ) {
    return fallbackMessage || TEXT_ERRORS.SAVE_REPORT_FAILED;
  }

  // Fallback to custom message or default friendly Indonesian message
  return (
    fallbackMessage ||
    TEXT_ERRORS.GENERIC_ISSUE
  );
```

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Mengonfirmasi Status Armada Shift 2
- **Kondisi Sebelum Perbaikan:**
  Saat tombol "Konfirmasi & Terapkan Status Shift 2" ditekan, server Supabase merespons dengan HTTP 400 Bad Request karena kolom `fleet_confirmed_s2_at` tidak ada di tabel `daily_route_reports`. Muncul pop-up error teknis berbahasa Inggris `Could not find the 'fleet_confirmed_s2_at' column of 'daily_route_reports' in the schema cache` yang membingungkan pengawas operasional.
- **Kondisi Setelah Perbaikan:**
  Kolom `fleet_confirmed_s2_at` (beserta `is_fleet_confirmed_s2`, snapshot `fleet_status_shift2`, dan shift 1) telah aktif di database Supabase dan dikenali PostgREST. Konfirmasi shift 2 berhasil tersimpan tanpa error.

### Skenario 2: Terjadi Gangguan Database Eksternal Tak Terduga
- **Kondisi Sebelum Perbaikan:**
  Jika terjadi kegagalan DDL atau skema pada database Supabase di masa depan, pesan internal database mentah akan langsung ditampilkan di UI.
- **Kondisi Setelah Perbaikan:**
  `formatUserError` menangkap seluruh terminologi internal database/PostgREST dan menampilkan toast ramah berbahasa Indonesia (`Gagal menerapkan status armada`), sementara detail teknis tetap tercatat aman di `console.error` untuk penelusuran tim pengembang.

---

## 4. Checklist Verifikasi & Quality Gates

- [x] DDL migrasi `fleet_status_snapshot` dan `dynamic_renops` berhasil dieksekusi di Supabase.
- [x] Cache PostgREST berhasil dimuat ulang (`NOTIFY pgrst, 'reload schema'`).
- [x] Tabel `supabase_migrations.schema_migrations` sinkron dengan versi migrasi lokal.
- [x] `pnpm vitest run src/` ➔ 41 test files lulus 100% (326 passed, 0 failed).
- [x] `pnpm run build` ➔ TypeScript Strict Mode & Vite build lulus 0 error.
