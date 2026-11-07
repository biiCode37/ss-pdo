# REPAIR REPORT: REFACTOR 227
**Modul:** Tombol refresh header di tab Siap Kirim → "Cek ulang semua rute"
**Tanggal:** 08 November 2026
**Status:** Selesai di `devmode` (belum di-push). Tidak ada perubahan Edge Function atau database.

---

## 1. Implementasi Perbaikan

### A. `src/services/realtimeSyncService.ts` — BUG-RECHECK-227-01
- `postSheetSync(routeCode, date)` dipisah dari `executeSync` dan mengembalikan `true/false` (`res.ok`). Perilaku `triggerRealtimeSheetSync` tidak berubah.
- `recheckRoutesCompleteness(routeCodes, date, onProgress)` baru:
  - membuang kode rute ganda;
  - menjalankan paling banyak `RECHECK_ALL_CONCURRENCY = 3` request sekaligus;
  - melaporkan progres mulai dari 0;
  - mengembalikan `done` (total, gagal), `cooldown` (sisa ms), `busy`, atau `offline`.
- Jeda `RECHECK_ALL_COOLDOWN_MS = 2 menit` disimpan di memori modul (komentar `ponytail`: hilang saat halaman dimuat ulang; server tetap punya cooldown 3 detik per rute).

### B. `readiness/SubmissionReadinessTab.tsx`
- Prop `onRegisterReload` diganti `onRegisterRecheckAll(fn: () => Promise<void>)`.
- `recheckAll` memakai rute yang sedang terlihat menurut filter Semua/Pantauan. Ringkasan bar kontrol menjadi "Mengecek n/total…" (`aria-live="polite"`) selama berjalan. Setelah selesai, status dimuat ulang sekali dan toast hasil ditampilkan; saat dalam jeda atau offline hanya muncul pesan.

### C. `AllRouteMonitoringPage.tsx` dan `MonitoringHeader.tsx`
- Di segmen Kelengkapan, `onRefresh` menjalankan cek ulang semua. `refreshing` mengikuti status cek ulang, sehingga ikon berputar dan tombol refresh serta "Tarik data" terkunci.
- Header mendapat prop opsional `refreshTitle`. Di tab ini label dan tooltip menjadi "Cek ulang semua rute".
- Tab capaian dan segmen Armada tidak berubah (`loadData(true)`).

### D. `src/constants/texts/text_monitoring.ts`
- Teks baru `SUBMISSION.RECHECK_ALL_TITLE/PROGRESS/DONE/PARTIAL/COOLDOWN/OFFLINE`, diuji di `texts.test.ts`.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Tap refresh di Kelengkapan | Memuat ulang database diam-diam, tanpa tanda | Membaca ulang sheet semua rute yang terlihat |
| Umpan balik | Tidak ada | Ikon berputar, "Mengecek 7/18…", lalu toast hasil |
| Cek 18 rute | 18× buka dialog lalu "Cek ulang" | 1 tap, sekitar 15 detik (diukur di browser) |
| Rute gagal dibaca | Tidak terlihat | Toast "n dari 18 rute gagal dicek ulang" |
| Tap beruntun | Tiap tap memicu request | Ditolak 2 menit dengan sisa waktu; tap saat berjalan diabaikan |
| Filter Pantauan aktif | — | Hanya rute pantauan yang dicek (request seperlunya) |

---

## 3. Case: Skenario Lapangan

### Case BUG-RECHECK-227-01: Korlap memastikan semua file sebelum kirim pukul 22.00
- **Situasi:** Pukul 21.45 korlap ingin memastikan status 18 rute benar-benar terbaru. Beberapa petugas mengisi sheet dari laptop, dan trigger Apps Script kadang terlambat.
- **Before:** Tap refresh tidak menunjukkan apa pun. Korlap tidak tahu apakah status sudah terbaru, lalu membuka satu per satu rute untuk menekan "Cek ulang".
- **After:** Satu tap pada ikon refresh memunculkan "Mengecek 0/18…" hingga "18/18". Kartu rute diperbarui ("Diperbarui 21.45"), lalu muncul toast "18 rute selesai dicek ulang". Bila korlap hanya memantau 4 rute dengan filter Pantauan, hanya 4 rute itu yang dibaca.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. Kontrak warna | Lulus | 180/180 |
| 2. `pnpm vitest run src/` | Lulus | 152 file, 1.481/1.481 (+11 test: 6 service, 4 tab, 1 halaman; plus perluasan test teks) |
| 3. `pnpm run build` | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | dijalankan sebelum commit |

**Browser (localhost, data produksi, 375px):**
- Tap refresh → "Mengecek 0/18…" langsung muncul, tombol terkunci.
- 18 rute selesai sekitar 15 detik, dan kartu berubah ke "Diperbarui 01.55/01.56".
- Tap ulang → toast "Cek ulang semua bisa diulang 99 detik lagi" tanpa request.

**Belum diverifikasi:**
- Tampilan tema terang. Tidak ada warna atau kelas CSS baru; hanya memakai kelas yang sudah ada.
