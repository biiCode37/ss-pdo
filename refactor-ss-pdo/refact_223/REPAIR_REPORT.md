# REPAIR REPORT: REFACTOR 223
**Modul:** Kelengkapan Data & Konfirmasi "Siap Kirim"
**Tanggal:** 07 November 2026
**Status:** Kode, migrasi, dan Edge Function sudah di produksi (frontend menunggu PA). Tersisa: uji ujung-ke-ujung konfirmasi oleh pemilik, PA, dan peluncuran bertahap lewat whitelist.

**Pembagian kerja:** Task 1–5 dan 9–10 dikerjakan Claude. Task 6–8 dikerjakan Antigravity lewat brief `docs/superpowers/briefs/ag-siap-kirim-pilot.md`, direview independen di `docs/superpowers/briefs/reports/ag-siap-kirim-pilot-review.md` (13/13 file identik dengan rencana, nilai 24/25).

---

## 1. Implementasi Perbaikan

### A. Aturan kelengkapan (`supabase/functions/_shared/completeness.ts`) — BUG-SUB-223-01
- Kolom wajib: Trip Pergi, Trip Pulang, TOA S1, Total TOA. Sel kosong atau `-` berarti belum diisi, dan `0` berarti terisi.
- Status per unit: LENGKAP / DIKECUALIKAN (kosong total + keterangan bukan NORMAL) / BELUM_DIISI / JANGGAL (ritase tanpa TOA, TOA tanpa ritase, Total TOA < TOA S1) / SEBAGIAN.
- Deteksi header adalah port parser frontend (`core.ts`, termasuk subheader dua baris). Klasifikasi keterangan setara `classifyUnitKeterangan`, dijaga uji paritas 19 fixture.
- Fingerprint FNV-1a atas kolom wajib + keterangan, tidak bergantung urutan dan tidak terpengaruh perubahan KM.

### B. Modul bersama server (`_shared/submissionRules.ts`, `pageAccess.ts`, `cors.ts`, `proxySession.ts`)
- `evaluatePageAccess` menjadi **satu sumber** aturan akses halaman, dipakai `PageAccessContext` (klien) dan Edge Function. Test lama `PageAccessContext` lulus tanpa diubah.
- Sesi proxy dan CORS dipindah dari `sheets-proxy` tanpa mengubah perilaku.

### C. Database (`supabase/migrations/20261107000001_submission_readiness.sql`) — BUG-SUB-223-02
- `daily_route_reports.completeness jsonb`.
- `route_submission_confirmations`: unik (route_id, date), CHECK alasan ≥ 5 huruf bila ada masalah, RLS SELECT untuk anon/authenticated, `REVOKE ALL` + `GRANT SELECT`, dan masuk publikasi Realtime.

### D. Webhook & Edge Function
- `sheet-sync-webhook`: menghitung kelengkapan dari baris yang sudah dibaca. Kegagalan perhitungan tidak menggagalkan penyimpanan capaian.
- `route-confirmation`: verifikasi sesi + `is_active` + akses halaman `regional_monitoring`, validasi tanggal (≤ 7 hari ke belakang, tidak di masa depan), alasan wajib, nilai audit diambil server, 1 baris `activity_logs` (`CONFIRM_SUBMISSION`).

### E. Klien
- `submissionReadinessService`, `readinessModel`, `useSubmissionReadiness`, dan komponen tab (Task 6–8, Antigravity).
- `AllRouteMonitoringPage` (Task 9):
  - nav Status Armada diganti Siap Kirim (segmen Kelengkapan | Armada; tab tersimpan lama dipetakan);
  - data capaian dimuat malas;
  - banner menggantikan muat ulang otomatis;
  - tanggal WIB;
  - perubahan periode tidak lagi memuat ganda.
- **Penyimpangan dari rencana:** pemilih tanggal untuk tab memakai `handleSelectDate` (`useCallback`), bukan arrow inline, agar efek tanggal default tidak terpicu ulang. Hasil verifikasi browser juga menambah perbaikan BUG-UI-223-05.

### F. Perlindungan `completeness` dari payload basi — BUG-SUB-223-04
- `upsertDailyRouteReport` membuang `completeness`. Penulis lain (ingestion regional, sinkron bulanan, cron `ingest-regional.mjs`) diperiksa satu per satu: semuanya memakai payload eksplisit.

---

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Info kelengkapan per unit | Tidak ada; korlap memeriksa 18 file manual | Status per unit & per rute, terurut dari yang paling butuh perhatian |
| Jejak konfirmasi pengiriman | Tidak ada | Siapa, kapan, jumlah masalah, alasan, fingerprint, + 1 baris `activity_logs` |
| Request saat membuka Monitoring | ±5 request (±77 KB) data capaian | **3 request** (diukur di browser), payload kelengkapan 18 rute **±17,8 KB** saat jam sibuk |
| Edit sheet saat Monitoring terbuka | Muat ulang otomatis ≤1×/menit (≤ ±300 request/jam per layar) | 0 request (payload Realtime diterapkan di tempat); tab capaian hanya banner |
| Modal armada menyimpan laporan lama | Akan menimpa `completeness` | `completeness` dibuang dari payload klien |
| Tombol header di tab default | Terkunci | Aktif |
| Tanggal default 00.00–07.00 WIB | Tanggal kemarin (UTC) | Tanggal WIB |

---

## 3. Case: Skenario Lapangan

### Case BUG-SUB-223-01: Korlap memeriksa sebelum pengiriman pukul 21.30
- **Situasi:** Korlap harus memastikan 18 file lengkap sebelum mengirim ke admin pusat.
- **Before:** Membuka 18 spreadsheet satu per satu dan menebak baris mana yang belum diisi.
- **After:** Tab Siap Kirim menampilkan, misalnya, JAK.58 "Janggal" dengan detail "KWK 1856: Ritase terisi, TOA kosong" dan "KWK 1727: Belum diisi sama sekali" (data nyata 7 Nov 2026, 20.42 WIB). Korlap langsung menghubungi petugas yang bersangkutan.

### Case BUG-SUB-223-02: Rute dikirim dengan kekurangan yang sah
- **Situasi:** TOA satu unit rusak, sehingga Total TOA tidak bisa diisi.
- **Before:** Tidak ada catatan; teguran datang belakangan tanpa bukti.
- **After:** Korlap mengonfirmasi dengan alasan wajib. Catatan tersimpan di server bersama jumlah masalah yang dihitung server.

### Case BUG-QUOTA-223-03: Monitoring terbuka sepanjang shift
- **Situasi:** PJ membiarkan Monitoring terbuka di ponsel selama 5 jam sementara petugas terus mengedit sheet.
- **Before:** Hingga ±300 request/jam per layar.
- **After:** 3 request saat dibuka, lalu pembaruan lewat pesan Realtime saja.

### Case BUG-SUB-223-04: Korlap menyimpan status armada setelah webhook memperbarui kelengkapan
- **Before:** Kelengkapan kembali ke nilai lama saat modal disimpan.
- **After:** Kelengkapan tetap nilai terbaru dari webhook.

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` | Lulus | bagian dari suite penuh (kontrak warna 180/180 di worktree AG) |
| 2. `pnpm vitest run src/` | Lulus | 149 file, **1.445/1.445** |
| 3. `pnpm run build` | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | dijalankan sebelum commit dokumentasi |
| `deno check` (`sheets-proxy`, `sheet-sync-webhook`, `route-confirmation`) | Lulus | tanpa `deno.lock` ter-commit |

**Produksi (07 Nov 2026):**
- Migrasi diterapkan via `supabase db query --linked -f` dan tercatat di `schema_migrations` (`20261107000001`).
- Skema terverifikasi: kolom jsonb, RLS aktif, ACL `anon=r`/`authenticated=r`, Realtime aktif.
- Probe REST: anon INSERT konfirmasi → **401** `42501`; anon SELECT → 200.
- Edge Function (deploy oleh pemilik): `sheet-sync-webhook` v3, `sheets-proxy` v4, `route-confirmation` v1.
  - `sheets-proxy` dengan header palsu → 401.
  - `route-confirmation` dengan sesi palsu atau tanpa sesi → 401; GET → 405.
- `completeness` terisi dari edit sheet nyata (JAK.77/88/90/58, pukul 20.41–20.42 WIB). Pola "Sebagian = Total TOA kosong" sesuai jam (shift 2 belum selesai).
- Browser (dev, superadmin): tab Siap Kirim default, 3 request saat muat ulang, detail unit + alasan wajib + tombol Konfirmasi terkunci tanpa alasan, mode gelap & terang terbaca di lebar 375 px.

**Belum diverifikasi:**
- Konfirmasi ujung-ke-ujung oleh pengguna (menyimpan konfirmasi, lalu edit sheet, lalu tanda "berubah").
- Pencocokan manual detail JAK.58 dengan isi sheet.
- Perilaku di produksi setelah PA.
- Peluncuran bertahap: buka `regional_monitoring` untuk 1–2 korlap/PJ, pantau Log Ingestion (< 0,2 GB/minggu) ±1 minggu, lalu buka untuk semua.
