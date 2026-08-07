# Daftar Masalah v4 — Proyek SS_PDO / SPUM

**Repo:** github.com/biiCode37/ss-pdo (commit "Refactor 3 Done", 2026-08-06)
**Jenis dokumen:** Audit lanjutan v4 — fokus verifikasi menyeluruh perbaikan v1-v3, plus audit fitur baru "Unit Summary Page" (kartu unit + modal detail iOS-style) yang belum pernah diperiksa.
**Penomoran:** Melanjutkan dari v3. BUG-01 s.d. BUG-44 sudah dipakai → temuan baru dimulai dari **BUG-45**.

---

## ✅ Verifikasi Perbaikan v1–v3 — Tingkat Perbaikan Sangat Tinggi

Hampir seluruh temuan yang sempat diverifikasi ulang di sesi ini **terbukti benar-benar diperbaiki**, banyak di antaranya dengan komentar kode eksplisit mereferensikan ID bug-nya:

| ID | Status | Bukti di kode |
|---|---|---|
| BUG-19 (race condition ganti tab/rute) | ✅ Diperbaiki | `Dashboard.tsx` — komentar eksplisit "BUG-19: AbortController and Request ID tracking", pola `requestIdRef` diimplementasikan dengan benar |
| BUG-21 (pembulatan `Math.round` di grafik TOA) | ✅ Diperbaiki | `Math.round` sudah tidak ada sama sekali di `googleSheets.ts` |
| BUG-26 (deteksi header `getMonthlyToaTrend` tak konsisten) | ✅ Diperbaiki | Komentar eksplisit "BUG-26: Use unified header detection", kini memakai `detectHeaderRowAndBuildComposite` yang dibagi (shared) |
| BUG-37 (allowlist Supabase *fail-open*) | ✅ Diperbaiki, menyeluruh | Kedua jalur (`!isSupabaseConfigured` & `catch`) kini eksplisit *fail-closed*, dengan pesan yang jelas & log "(fail-closed)". SQL migrasi juga sudah menyertakan RLS policy dengan komentar "Kunci verifikasi login BUG-37" |
| BUG-38 (auto re-auth tanpa gesture klik) | ✅ Diperbaiki | `withAuthRetry` kini hanya dispatch event `google-auth-expired`; `Dashboard.tsx` menampilkan banner dengan tombol "Login Ulang" yang memicu `reauthenticateSession()` langsung dari `onClick` |
| BUG-39, BUG-40 (swipe menabrak area scroll) | ✅ Diperbaiki | Class `no-swipe` ditambahkan ke `category-scroll-container` (BusList) & container grafik (DailyToaTrendCard); `SwipeableContainer` juga menambahkan pengecualian eksplisit |
| BUG-41 (rute+bulan+tahun digabung 1 dropdown) | ✅ Diperbaiki | Komentar eksplisit "3-Level Selector (Kode Rute, Bulan, Tahun) - BUG-41", kini 3 `<select>` terpisah dengan filter kaskade |
| BUG-42 (tidak ada penyimpanan rute/tanggal terakhir) | ✅ Diperbaiki | Komentar eksplisit "(BUG-42)" di dua tempat, `localStorage['PDO_LAST_VISITED']` menyimpan & memulihkan rute+bulan+tahun+tanggal |
| BUG-43 (skema Supabase tak ter-*version control*) | ✅ Diperbaiki | File `supabase/migrations/20260806000000_init_schema.sql` kini ada, lengkap dengan definisi tabel & RLS policy |
| BUG-44 (label `.env.example` menyesatkan) | ✅ Diperbaiki | Komentar kini eksplisit "PENTING — Mengontrol allowlist otorisasi... lihat BUG-37" |

Ini adalah tingkat penyelesaian bug tertinggi dari seluruh siklus audit v1–v4 sejauh ini — sinyal baik bahwa proses kerja agent (dipandu dokumen `03-aturan-ai-agent-*.md`) berjalan efektif.

---

## Ringkasan Temuan Baru

| ID | Judul Singkat | Severity | Lokasi |
|---|---|---|---|
| BUG-45 | `unitAnalytics.ts` mengulangi bug parsing angka Indonesia (regresi pola yang sama seperti BUG-20/26) | 🔴 Kritis | `utils/unitAnalytics.ts` |
| BUG-46 | `extractUnitList` bekerja O(n²) — perlambatan tak perlu di halaman Unit Summary | 🟠 Sedang | `utils/unitAnalytics.ts` |
| BUG-47 | Tidak ada cache/berbagi data grafik TOA antara tab Analytics dan Modal Detail Unit | 🟡 Minor | `components/DailyToaTrendCard.tsx`, `components/UnitDetailModal.tsx` |

---

## 🔴 KRITIS

### BUG-45 — `unitAnalytics.ts` mengulangi bug parsing angka Indonesia (pola regresi ke-3)
**Lokasi:** `utils/unitAnalytics.ts`, `calculateUnitMetrics` (± baris 108–126)
**Deskripsi:** Fungsi ini (bagian dari fitur BARU "Unit Summary Page") memakai `parseInt(String(item.toaShift1 || '0'), 10)` dan `parseFloat(String(item.kmAwal1 || '0'))` secara langsung — **BUKAN** `parseIndonesianNumber()` dari `utils/numberUtils.ts` yang sudah dibuat khusus (dan terbukti benar) untuk menangani format angka Indonesia (pemisah ribuan "." dan desimal ",").
**Root cause — ini pola yang SUDAH TERJADI 2 KALI SEBELUMNYA:** persis sama dengan BUG-20 (di `analytics.ts`, sudah diperbaiki) dan BUG-26 (di `getMonthlyToaTrend`, sudah diperbaiki) — setiap kali ada kode BARU yang perlu mem-parsing angka dari data sheet, developer/agent menulis ulang `parseInt`/`parseFloat` polos dari nol alih-alih mencari & memakai utilitas yang sudah ada dan sudah terbukti benar. Ini kali KETIGA pola yang sama persis muncul.
**Dampak ke user:** Modal Detail Unit (fitur baru, dibuka dengan tap kartu unit) akan menampilkan angka KM/TOA/Penumpang yang **salah drastis** untuk unit mana pun yang nilainya diformat dengan pemisah ribuan Indonesia (mis. "1.234" terbaca sebagai `1`, bukan `1234`) — persis kelas bug yang sama yang sudah dua kali diperbaiki di tempat lain, tapi baru saja "lahir kembali" di tempat baru ini.
**Catatan:** `extractUnitList` (dipakai untuk daftar kartu unit) juga memanggil `calculateUnitMetrics`, jadi bug ini berdampak ke SELURUH tampilan Unit Summary, bukan cuma modal detail.

---

## 🟠 SEDANG

### BUG-46 — `extractUnitList` bekerja O(n²), memperlambat halaman Unit Summary tanpa perlu
**Lokasi:** `utils/unitAnalytics.ts`, `extractUnitList` (± baris 64–80)
**Deskripsi:**
```js
return data.map((b) => {
  const metrics = calculateUnitMetrics(data, b.unit || '');
  ...
```
Untuk SETIAP baris `b` di `data`, fungsi ini memanggil `calculateUnitMetrics(data, b.unit)` — yang di dalamnya melakukan `data.find(item => item.unit === targetUnit)`, sebuah pencarian linear O(n) di dalam sebuah `.map()` yang sudah O(n). Padahal `b` **sudah** merupakan baris yang dicari — tidak perlu dicari ulang dari `data` sama sekali.
**Dampak ke user:** Untuk rute dengan banyak unit (contoh nyata dari laporan operasional yang pernah dibagikan: ada rute dengan 60 unit), ini berarti hingga 3600 iterasi alih-alih 60 — cukup kecil untuk tidak terasa saat ini, tapi merupakan pola boros yang tidak perlu dan berisiko terasa (jank/lag) di perangkat kelas bawah yang umum dipakai petugas lapangan, khususnya kalau daftar unit bertambah besar ke depannya.

---

## 🟡 MINOR

### BUG-47 — Tidak ada cache data grafik TOA antar tab Analytics & Modal Detail Unit
**Lokasi:** `components/DailyToaTrendCard.tsx` (± baris 78–91), dipakai independen oleh `AnalyticsDashboard` maupun `UnitDetailModal`
**Deskripsi:** Setiap kali `DailyToaTrendCard` dipasang (baik di tab Analytics untuk seluruh rute, maupun di dalam Modal Detail Unit untuk satu unit tertentu), ia melakukan `batchGet` penuh ke Google Sheets API dari awal — tidak ada cache/memoization yang dibagi antar instance. Membuka detail beberapa unit berturut-turut (atau membuka & menutup modal unit yang sama berulang kali) memicu request `batchGet` baru setiap kali, meski rentang tanggal (`sheetId` + `maxDay`) yang diminta sama.
**Dampak ke user:** Bukan bug fungsional (patut dicatat, `isMounted` guard di sini sudah benar mencegah race condition — pola yang justru lebih baik dari BUG-19 sebelum diperbaiki), tapi menambah request API yang sebetulnya bisa dihindari — relevan mengingat batasan rate-limit Google Sheets API yang sudah beberapa kali jadi akar masalah di audit-audit sebelumnya, dan konteks pengguna yang eksplisit disebut "sinyal lemah di lapangan".
