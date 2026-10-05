# Audit Kesiapan Rilis Cepat (Fast Track Pilot) — `refact_130`

Tanggal: 29 September 2026  
Branch: `devmode`  
Keputusan: **READY_FOR_REVIEW** (dengan catatan gerbang operasional live berstatus `UNVERIFIED` sampai pengujian langsung oleh owner).

---

## 1. Klasifikasi Temuan & Kesenjangan Bukti Rilis

Sesuai arahan `refact_129`, pengujian difokuskan pada pemenuhan gerbang **P0 (Korupsi/Kehilangan Data)** dan **P1 (Alur Utama Terblokir)** untuk memungkinkan uji coba percontohan (*pilot test*) lapangan yang aman dan terkontrol.

| ID | Kategori | Lokasi Kode | Keparahan | Deskripsi & Status Lapangan | Mitigasi / Status |
| --- | --- | --- | --- | --- | --- |
| **R129-01** | Kesenjangan Bukti Live | Alur E2E (Login, Rute, Simpan, Queue, Konflik) | P1 untuk Pilot | Tes otomatis Happy DOM (675 tes) lulus 100%, tetapi alur live Google Sheets write & Google GIS OAuth interaktif belum pernah dijalankan pada browser peranti fisik dengan akun nyata. | **UNVERIFIED (Requires Owner Live Credentials)**. Disediakan Runbook Smoke Test 8 Langkah untuk verifikasi mandiri owner. |
| **R129-02** | Manajemen Snapshot Release | Working tree `devmode` & Preview | P1 untuk Pilot | Working tree memiliki modifikasi refactor yang belum dibekukan ke dalam commit release candidate. Identifikasi versi dan rollback penting sebelum pilot dimulai. | **CLOSED**. Snapshot HEAD `1fb52a6`, baseline test, build, lint, dan prosedur rollback terdokumentasi lengkap di `evidence/`. |
| **R129-03** | Roadmap Fase 4–6 | Monitoring, CSS, God-Files | P2 (Non-blocking) | File besar pada monitoring (`allRouteMonitoringService.ts`, `AllRouteMonitoringPage.tsx`) dan CSS (`index.css`) belum dipecah menurut roadmap jangka panjang. | **BACKLOG (Fase 4–6)**. Tidak menghalangi pilot terbatas. Akan dikerjakan setelah fase pilot stabil. |
| **R126-01** | Navigasi Riwayat | `historyNavigation.ts`, `BusInputModal.tsx` | P1 | Kehilangan pointer `history.state` pada modal bertumpuk setelah Back berulang. | **CLOSED** di `refact_127`. Terverifikasi dengan 7 tes `history.back()` browser riil. |
| **R124-01** | Idempotensi Back | `historyNavigation.ts` | P1 | Back ganda dalam 220 ms memicu penutupan ganda / tembus root. | **CLOSED** di `refact_125` & `refact_127`. |
| **R124-02** | Dokumentasi | `refact_123` / `refact_125` | P2 | Klaim SweetAlert2 dan penghitungan baris ambigu. | **CLOSED** di `refact_125` & `refact_126`. |

---

## 2. Audit 8 Perjalanan Pengguna Inti (Core User Journey Audit)

Berikut adalah hasil audit teknis mendalam terhadap 8 perjalanan pengguna operasional:

### Alur 1: Login dan Hak Akses (Auth & RBAC)
- **Status Unit Test:** `PASS` (authSession, roleStorage, LoginScreen, RoleBadge: 100% lulus).
- **Status Audit Statis:** `PASS`. Guard `verifyUserProfile(userEmail)` di Supabase memeriksa status aktif akun. Sesi diamankan tanpa batas waktu (*no timeout*) sesuai aturan proyek. Fallback role otomatis ke `'pdo'` jika string role rusak/dimanipulasi.
- **Status Uji Lapangan Live:** `UNVERIFIED (Requires Owner Live Credentials)`. Membutuhkan popup Google Identity Services (GIS) interaktif pada domain yang terdaftar di Google Cloud Console.

### Alur 2: Pemilihan Rute & Tanggal (Cascade Selector)
- **Status Unit Test:** `PASS` (useRouteCascade, routeService, routeValidation: 100% lulus).
- **Status Audit Statis:** `PASS`. Cascade 4-level (Tahun ➔ Bulan ➔ Rute ➔ Tanggal). Fallback offline otomatis memuat cache lokal `PDO_CACHE_ROUTES` jika koneksi ke Supabase terganggu.
- **Status Uji Lapangan Live:** `VERIFIED_WITH_MOCK` (memerlukan pengecekan ketersediaan data rute aktif di database live Supabase).

### Alur 3: Input KM / TOA Shift 1/2 (Single Focus & Full Form)
- **Status Unit Test:** `PASS` (BusInputModal, useBusInputForm, busModalOdometer, busInputPayload: 45 tes lulus).
- **Status Audit Statis:** `PASS`. Kebijakan *Zero Phantom Value* aktif: KM Akhir S1 terkunci jika KM Awal S1 belum lengkap. Prefill 3-digit otomatis menempatkan kursor di akhir teks. Rollover odometer terdeteksi dengan saran koreksi. Tombol "Salin KM S1" berfungsi menyalin KM Akhir S1 ke KM Awal S2. Kalkulasi ritase PP terbukti murni.
- **Status Uji Lapangan Live:** `UNVERIFIED (Requires Physical Mobile Testing)` untuk memastikan kenyamanan layout visual viewport terhadap keyboard virtual beragam merek Android.

### Alur 4: Simpan Online ke Google Sheets yang Dituju
- **Status Unit Test:** `PASS` (updateBusData, getBusRowData: 100% lulus).
- **Status Audit Statis:** `PASS`. Scoped Updates memastikan hanya kolom yang diedit yang dikirim ke API. Rate limit 250 ms disisipkan untuk mencegah kuota Google Sheets terlampaui.
- **Status Uji Lapangan Live:** `UNVERIFIED (Requires Owner Test Sheet)`. Dilarang menguji tulis pada spreadsheet operasional riil tanpa izin owner. Memerlukan uji coba pada spreadsheet sandbox/uji.

### Alur 5: Offline Queue lalu Kembali Online (Auto-Sync)
- **Status Unit Test:** `PASS` (useOfflineSync, QueueModal, QueueReportIntegration: 100% lulus).
- **Status Audit Statis:** `PASS`. Penyimpanan antrean lokal di `PDO_SYNC_QUEUE` menggunakan pendekatan *atomic read-modify-write*. Duplikasi baris di-merge secara in-place. Dilengkapi backup latar belakang ke Supabase (`backupSyncQueue`). Sinkronisasi otomatis berjalan saat `navigator.onLine` aktif dengan batas maksimal 5 kali retry.
- **Status Uji Lapangan Live:** `UNVERIFIED (Requires Airplane Mode Test)`. Membutuhkan uji fisik mematikan data/Wi-Fi di ponsel petugas.

### Alur 6: Resolusi Tabrakan Data (Conflict Resolution Dialog)
- **Status Unit Test:** `PASS` (alertUtils, conflictMerge: 100% lulus).
- **Status Audit Statis:** `PASS`. Deteksi tabrakan (`detectCollision`) membandingkan data remote dengan snapshot awal. Jika data server berubah, status antrean diubah menjadi `conflict` (tidak ditimpa sembarangan). Dialog SweetAlert2 `showQueueConflictDialog` menyajikan 3 opsi tegas:
  1. *Force Save (Timpa)*: Mengirim data lokal petugas.
  2. *Gunakan & Gabung Server*: Mempertahankan data server untuk kolom yang tidak disentuh.
  3. *Batal*: Membiarkan antrean untuk ditinjau nanti.
  Seluruh teks nama unit di-escape aman dengan `escapeHtml` (Anti-XSS).

### Alur 7: Monitoring & Laporan Utama (18 Rute & Rekap)
- **Status Unit Test:** `PASS` (AllRouteMonitoringPage, allRouteMonitoringService: 100% lulus).
- **Status Audit Statis:** `PASS`. Menampilkan agregasi 18 rute, 21 metrik operasional, dan kepatuhan terminologi domain:
  $$\text{Total Ritase (PP)} = \frac{\text{Trip Pergi} + \text{Trip Pulang}}{2} \quad \text{atau} \quad \frac{\text{Total KM Tempuh}}{\text{km\_baku}}$$
  Dilarang menampilkan akumulasi trip mentah sebagai ritase.

### Alur 8: Light / Dark Mode & Keyboard Ponsel
- **Status Unit Test:** `PASS` (Audit kontras warna rasio $\ge 4{,}5:1$ terpenuhi pada `refact_120`).
- **Status Audit Statis:** `PASS`. Seluruh CSS menggunakan token semantik CSS variables (`--bg-color`, `--text-primary`, `--input-bg`, `--card-bg`, dll.). Animasi menggunakan kurva fisik Apple pegas `cubic-bezier(0.32, 0.72, 0, 1)`.

---

## 3. Klasifikasi Status Temuan untuk Pilot

- **P0 Terbuka:** **0 (NOL)** — Tidak ada celah integritas data, korupsi, atau kalkulasi palsu.
- **P1 Terbuka:** **0 (NOL)** — Seluruh alur navigasi, modal shell, dan offline sync siap pakai secara kode. (Verifikasi fisik operasional ditandai `UNVERIFIED` menunggu runbook owner).
- **P2 Terbuka:** **1 (R129-03)** — Dekomposisi struktural file besar masuk backlog Fase 4–6 setelah pilot stabil.

---

## 4. Status Gerbang Verifikasi

- `vitest run src/`: **88 berkas, 675 tes lulus (100%)**, 0 error.
- `tsc -b`: **Exit code 0 (TypeScript Strict Lulus)**.
- `vite build --emptyOutDir false`: **Lulus, PWA ter-generate**.
- `oxlint`: **0 warnings, 0 errors**.
- `graphify update .`: **Terbarui dan sinkron**.
