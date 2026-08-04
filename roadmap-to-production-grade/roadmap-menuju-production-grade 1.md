# Roadmap Menuju Aplikasi Production-Grade — Proyek SS_PDO

**Jenis dokumen:** Peta jalan (roadmap) lintas-aspek — bukan katalog bug, melainkan gap analysis arsitektural/proses untuk membawa aplikasi dari "berfungsi" menjadi "profesional & memenuhi standar industri".
**Konteks:** Disusun setelah dua babak audit bug (`01-daftar-masalah.md` v1 dan `01-daftar-masalah-v2.md` v2) selesai/dalam pengerjaan. Dokumen ini melihat lebih jauh dari bug individual — ke arsitektur, proses rekayasa, dan kelengkapan fitur.
**Cara pakai:** Setiap item punya status "Kondisi Saat Ini" (fakta terverifikasi dari kode, bukan asumsi) dan "Rekomendasi". Bagian akhir dokumen menyusun semuanya menjadi peta jalan bertahap.

---

## Ringkasan Eksekutif

Aplikasi ini saat ini adalah **SPA (Single Page Application) murni sisi-klien** yang berbicara langsung ke Google Sheets API lewat OAuth browser — tanpa backend, tanpa database sungguhan, tanpa lapisan otorisasi tambahan. Ini adalah pola yang wajar untuk MVP/alat internal skala kecil, dan sejauh ini terbukti bisa dipakai di lapangan. Tapi untuk disebut "profesional & memenuhi standar industri", ada enam area besar yang perlu dibenahi: **Keamanan**, **Arsitektur & Backend**, **Kualitas Kode & Proses Rekayasa**, **Frontend & UX**, **Observability & Operasional**, dan **Kelengkapan Fitur Produk**.

Kabar baiknya: tim sudah menyadari akar masalah terbesar (commit "Sebelum integrasi Supabase" menunjukkan migrasi backend sudah direncanakan) — dokumen ini menyusun langkah-langkah di sekitarnya secara lebih lengkap dan berurutan.

---

## 1. Keamanan

| Kondisi Saat Ini | Mengapa Penting | Rekomendasi |
|---|---|---|
| Tidak ada backend/server-side layer sama sekali. Semua validasi bisnis (mis. KM Akhir ≥ KM Awal) hanya berjalan di client. | Siapa pun yang punya akses edit langsung ke Google Sheet (di luar app) bisa melewati SEMUA aturan bisnis — app tidak benar-benar menjaga integritas data, hanya "menyarankan" cara pakai yang benar. | Pindahkan validasi kritis ke lapisan server/database (lihat Bagian 2 — RLS di Supabase/Postgres bisa menegakkan aturan di level baris data, bukan cuma di UI). |
| Tidak ditemukan sistem role/permission (role-based access control) di kode manapun — dikonfirmasi lewat pencarian menyeluruh. | Siapa pun yang berhasil login Google bisa mengedit rute/data APAPUN — tidak ada pembatasan "petugas A hanya boleh isi rute A", atau "hanya admin yang boleh hapus rute". | Rancang model peran minimal: **Admin** (kelola rute & user), **Pengawas** (lihat semua + analytics), **Petugas** (isi data rute yang ditugaskan saja). |
| Tidak ada audit trail di level aplikasi — siapa mengubah field apa dan kapan tidak tercatat sebagai fitur app. | Untuk alat pencatatan operasional, akuntabilitas ("siapa yang mengubah angka ini") adalah kebutuhan dasar, bukan nice-to-have. Google Sheets punya version history bawaan, tapi tidak diekspos sebagai audit log yang bisa dipertanggungjawabkan lewat app. | Simpan `changed_by`, `changed_at` di setiap baris/perubahan saat migrasi ke database sungguhan; tampilkan riwayat perubahan per baris di UI. |
| Tidak ada rate limiting/abuse protection di sisi aplikasi. | Bergantung 100% pada limit bawaan Google API — tidak ada kontrol jika ada penyalahgunaan/bug yang memicu request berlebihan dari app sendiri. | Tambahkan throttling di level aplikasi/backend untuk operasi tulis. |
| Tidak ada Content Security Policy header eksplisit; tidak ada strategi rotasi credential terdokumentasi. | Lapisan pertahanan tambahan terhadap XSS/injeksi skrip pihak ketiga. | Tambahkan header CSP dasar di konfigurasi Vercel; dokumentasikan siapa yang memegang & kapan credential (`VITE_GAPI_*`) terakhir dirotasi. |

## 2. Arsitektur & Backend

| Kondisi Saat Ini | Mengapa Penting | Rekomendasi |
|---|---|---|
| **Google Sheets berfungsi sebagai "database".** Bukan dirancang untuk concurrent write skala besar, tidak ada transaksi/rollback asli, rentan rate limit (100 request/100 detik/user). | Ini akar penyebab sebagian besar bug kelas "race condition"/"konflik data" yang ditemukan di audit v1 & v2 (antrean offline, konflik edit bersamaan, dsb.) — bukan sekadar bug kode, tapi keterbatasan fondasi. | Lanjutkan rencana migrasi ke **Supabase (PostgreSQL)** yang sudah dirintis tim: transaksi asli, **Row-Level Security (RLS)** untuk kontrol akses per-role di level database, dan **real-time subscription** bawaan (menggantikan pola polling/manual-refresh saat ini). |
| Tidak ada API/backend layer untuk menegakkan business rules. | Semua validasi gampang di-bypass dari luar app (lihat Bagian 1). | Bagian dari migrasi Supabase — pindahkan aturan bisnis inti ke Postgres functions/RLS policies, bukan hanya di React. |
| Tidak ada environment terpisah (dev/staging/prod) yang terlihat — hanya satu deployment Vercel. | Perubahan besar (seperti migrasi Supabase) berisiko tinggi diuji langsung di production. | Siapkan minimal 1 environment staging (Vercel preview deployment + database Supabase terpisah) sebelum migrasi besar dimulai. |

## 3. Kualitas Kode & Proses Rekayasa

| Kondisi Saat Ini | Mengapa Penting | Rekomendasi |
|---|---|---|
| **TypeScript belum strict mode** — dikonfirmasi langsung: `"strict": true` tidak ada di `tsconfig.app.json` maupun `tsconfig.node.json`. | Sejalan dengan pola `catch (err: any)` yang tersebar di banyak file — kode kehilangan proteksi compile-time yang bisa saja menangkap sebagian bug yang kita temukan lebih dini (null/undefined, tipe salah). | Aktifkan `"strict": true` bertahap (bisa mulai dari `strictNullChecks` saja jika langsung penuh terlalu banyak error), perbaiki error yang muncul sedikit demi sedikit. |
| **Tidak ada CI/CD** — dikonfirmasi, tidak ada folder `.github/workflows` sama sekali. | Tidak ada gate otomatis (lint, build, test) sebelum kode masuk production — setiap regresi (seperti BUG-29, pencegahan rute duplikat yang hilang saat refactor) hanya bisa ketahuan lewat audit manual seperti yang kita lakukan, bukan otomatis. | Tambahkan GitHub Actions minimal: jalankan `pnpm run build` (mencakup `tsc -b`) + `pnpm run lint` di setiap PR sebelum boleh merge. |
| Tidak ada test runner sungguhan (dua file `.test.ts` yang ada memakai `console.assert` self-invoke, bukan framework testing — sudah tercatat sebagai BUG-32 di audit v2). | Tidak ada jaring pengaman otomatis terhadap regresi logika (parsing angka, kalkulasi analytics, dsb.). | Pasang `vitest`, migrasikan test yang ada, integrasikan ke langkah CI di atas. |
| Konfigurasi `oxlint` sangat minim — hanya 2 rule aktif (`react/rules-of-hooks`, `react/only-export-components`). | Ruleset yang lebih ketat bisa menangkap kelas bug umum secara otomatis (variabel tak terpakai, hooks dependency array yang salah, dsb. — beberapa di antaranya justru berkontribusi ke bug yang kita temukan manual). | Perluas ruleset oxlint bertahap; aktifkan rule `react-hooks/exhaustive-deps` setara jika didukung. |
| Tidak ada dependency vulnerability scanning terjadwal. | Dependency pihak ketiga (`gapi-script`, `xlsx`, dll.) bisa punya kerentanan yang baru diketahui belakangan. | Aktifkan Dependabot/Renovate bawaan GitHub (gratis, cukup buat file konfigurasi). |

## 4. Frontend & UX

| Kondisi Saat Ini | Mengapa Penting | Rekomendasi |
|---|---|---|
| Tidak ada audit aksesibilitas (a11y) — tidak ditemukan atribut ARIA, tidak ada linting a11y, kontras warna belum diverifikasi WCAG. | Standar industri modern (termasuk untuk aplikasi internal) umumnya mensyaratkan minimal WCAG AA untuk kenyamanan semua pengguna, termasuk yang memakai pembaca layar atau kondisi pencahayaan lapangan yang menyilaukan. | Tambahkan `eslint-plugin-jsx-a11y` (atau setara oxlint jika tersedia), audit kontras warna tema gelap/terang yang sudah ada. |
| String UI hardcoded Bahasa Indonesia langsung di komponen, bukan lewat framework i18n. | Cukup untuk kebutuhan saat ini (single-language), tapi bukan pola yang scalable jika suatu saat perlu multi-bahasa atau white-label untuk operator bus lain. | Tidak mendesak — cukup dicatat sebagai keputusan sadar, bukan diubah sekarang. |
| Belum terlihat strategi code-splitting/lazy-loading untuk komponen besar (Analytics Dashboard, Daily TOA Trend Card, dll.). | Berpengaruh ke waktu muat awal di koneksi lambat — padahal target pengguna eksplisit disebut "sinyal lemah di lapangan" di `.agents/AGENTS.md`. | Terapkan `React.lazy()` + `Suspense` untuk tab Analytics (dimuat hanya saat tab itu dibuka), bukan ikut ter-bundle di initial load bersama tab Input. |
| Belum ada design system/komponen terdokumentasi (Storybook atau setara); styling tersebar di `index.css` (849 baris) tanpa dokumentasi token desain formal. | Menyulitkan konsistensi visual saat tim/agent baru menambah komponen baru. | Tidak mendesak untuk skala tim saat ini — pertimbangkan jika tim berkembang. |

## 5. Observability & Operasional

| Kondisi Saat Ini | Mengapa Penting | Rekomendasi |
|---|---|---|
| **Tidak ada error tracking** (Sentry atau setara) — error production hanya masuk `console.error`, tidak terlihat oleh siapa pun kecuali user membuka DevTools. | Tim tidak punya visibilitas terhadap error yang benar-benar dialami petugas di lapangan — audit manual seperti yang kita lakukan tidak bisa menangkap bug yang hanya muncul di kondisi jaringan/perangkat tertentu. | Pasang Sentry (free tier cukup untuk skala ini) — dampak besar, biaya implementasi rendah. |
| Tidak ada analytics kesehatan aplikasi (berapa % sync gagal, rata-rata waktu loading, dsb.). | Tim tidak bisa mengukur kesehatan aplikasi secara kuantitatif dari waktu ke waktu, hanya bisa menunggu laporan manual dari petugas. | Bisa jadi bagian dari Sentry (performance monitoring) atau tool ringan terpisah. |
| Tidak ada uptime/health monitoring atau strategi alerting; tidak ada dokumentasi rencana rollback saat insiden. | Jika Google Sheets API berubah kebijakan atau Vercel mengalami gangguan, tim tidak punya prosedur baku untuk merespons. | Dokumentasikan langkah dasar: siapa dihubungi, cara rollback ke deployment Vercel sebelumnya, kontak darurat. |

## 6. Kelengkapan Fitur Produk

Fitur yang umum ada di aplikasi operasional level industri, belum ada di sini:

1. **Manajemen pengguna & peran** (admin/pengawas/petugas per-rute) — terkait langsung dengan Bagian 1 & 2.
2. **Riwayat perubahan yang terlihat di UI** (bukan hanya tersembunyi di balik layar Google Sheets).
3. **Notifikasi/pengingat** — mis. push notification "Shift 2 belum diisi jam 18:00" untuk rute tertentu.
4. **Laporan/ekspor terjadwal otomatis** (PDF/Excel bulanan), bukan hanya melihat langsung di Google Sheets.
5. **Sinkronisasi real-time antar pengguna** — saat ini murni manual refresh; dua petugas yang melihat baris yang sama tidak saling melihat update secara live (akan didapat "gratis" setelah migrasi ke Supabase, lewat fitur real-time subscription-nya).
6. **Onboarding/bantuan dalam-app** untuk petugas baru.

---

## Peta Jalan Bertahap

| Fase | Fokus | Item |
|---|---|---|
| **Fase 1 — Cepat & Berdampak Tinggi** (biaya rendah, bisa mulai segera, tidak perlu menunggu migrasi backend) | Menutup gap paling murah tapi berdampak besar | Aktifkan `strict: true` TypeScript bertahap · Pasang Sentry (error tracking) · CI/CD minimal (lint+build+test di GitHub Actions) · Pasang `vitest` & migrasikan test yang ada · Aktifkan Dependabot |
| **Fase 2 — Fondasi Backend** (perlu perencanaan matang, risiko lebih tinggi) | Menutup keterbatasan struktural terbesar | Migrasi ke Supabase/Postgres dengan RLS · Rancang & implementasi RBAC (Admin/Pengawas/Petugas) · Audit trail di level database · Environment staging terpisah |
| **Fase 3 — Kematangan Produk** (setelah fondasi backend siap) | Melengkapi fitur & pengalaman level industri | Real-time sync antar pengguna (bawaan Supabase) · Riwayat perubahan di UI · Notifikasi/pengingat · Laporan/ekspor terjadwal · Audit aksesibilitas · Code-splitting halaman Analytics |

### Jika hanya bisa mulai dari 3 hal
1. **Migrasi ke backend nyata (Supabase) dengan RLS** — paling berdampak, membuka pintu untuk RBAC & audit trail sekaligus, dan sudah direncanakan tim.
2. **Aktifkan TypeScript strict mode + pasang Sentry** — biaya rendah, mencegah kelas bug yang sudah ditemukan di audit v1/v2 muncul kembali, dan memberi visibilitas nyata ke masalah di lapangan.
3. **CI/CD minimal** — mencegah regresi seperti BUG-29 (pencegahan rute duplikat yang hilang saat refactor) lolos tanpa terdeteksi di masa depan.
