# AI Agent Rules

## Dokumentasi Audit dan Refactor

Setiap audit kode atau refactor SS_PDO wajib didokumentasikan di `refactor-ss-pdo`.

1. Buat folder urutan baru: `refactor-ss-pdo/refact_N`.
2. Simpan `AUDIT_BUGS.md` berisi ID temuan, lokasi kode, keparahan, deskripsi, dampak user, dan mitigasi.
3. Simpan `REPAIR_REPORT.md` berisi implementasi, **Before vs After**, serta **Case: Skenario Lapangan** relevan untuk setiap perbaikan.
4. Jangan mengubah atau menghapus dokumentasi `refact_N` yang telah selesai. Revisi lanjutan wajib memakai folder urutan baru.
5. Dokumentasi wajib selesai sebelum audit/refactor dianggap selesai.

## Kebijakan Branch (Wajib `devmode`)

1. Seluruh pengerjaan fitur, debugging, audit, dan refactor **WAJIB** berada di branch `devmode`.
2. Jika branch `devmode` belum ada pada repositori/proyek, agent wajib membuatnya terlebih dahulu sebelum melakukan modifikasi file (`git checkout -b devmode`).
3. Agent dilarang keras menyentuh, mengakses, atau mengubah branch `main` / `master` / `production` kecuali ada instruksi eksplisit langsung dari pengguna.
4. **Perintah Cepat "PA" (Push All):**
   - Ketika pengguna mengatakan/memberikan perintah `"PA"` (Push All), agent wajib menjalankan rangkaian tugas berurutan ini:
     `commit > push devmode > switch branch main > merge devmode ke main > push main` (lalu kembali checkout ke `devmode`).
   - **Klausul Keselamatan Wajib:** Jika ditemukan permasalahan dalam proses tugas-tugas itu, agent **DILARANG KERAS mengambil keputusan sendiri**. Agent **WAJIB memberi konfirmasi kepada pengguna mengenai permasalahan yang ditemukan dilengkapi dengan rekomendasi solusi**, lalu menunggu keputusan pengguna sebelum melanjutkan atau mengulangi tugas yang belum selesai/terganggu/terhenti.
5. **Perintah Cepat "PD" (Push Devmode Saja):**
   - Ketika pengguna mengatakan/memberikan perintah `"PD"`, itu artinya **Push Devmode Saja**.
   - Agent **WAJIB** hanya menjalankan perintah: `git push origin devmode` langsung dari branch `devmode`.
   - Agent **DILARANG KERAS menyentuh, merge, switch, atau melakukan push ke branch `main` sama sekali**. Branch lokal dan seluruh pekerjaan tetap terisolasi di `devmode`.

## Standar Kamus Teks Sentral (`src/constants/texts/`)

1. Dilarang keras menulis teks antarmuka pengguna (*hardcoded UI strings*) langsung di dalam komponen UI (`.tsx`) atau utilitas modal (`.ts`).
2. Setiap pembuatan komponen baru atau modifikasi komponen eksisting **WAJIB** menempatkan seluruh teks antarmuka (label, placeholder, judul, pesan kesalahan ramah pengguna, konfirmasi SweetAlert2, toast notifikasi) di dalam modul domain terkait pada folder `src/constants/texts/`.
3. Teks dinamis dengan variabel wajib dibuat dalam bentuk fungsi template murni (misal: `(unit: string) => \`...\``).
4. Setiap penambahan teks kamus baru wajib disertai uji integritas pada `src/constants/texts/texts.test.ts`.

## Standar Terminologi Domain (Ritase vs Trip & `km_baku`)

1. **1 Ritase / Rit** = 1 Putaran Penuh (PP / Pulang-Pergi) = **2 Trip**.
2. **Trip** = 1 Arah (Pergi saja ATAU Pulang saja).
3. **`km_baku`** = Total jarak tempuh untuk **1 ritase (PP)**.
4. Setiap penyebutan kata *"ritase"* atau *"rit"* dalam instruksi dan tampilan UI selalu berarti **PP**.
5. Kalkulasi total ritase dari data trip bus adalah $\frac{\text{tripPergi} + \text{tripPulang}}{2}$ atau $\frac{\text{Total KM Tempuh}}{\text{km\_baku}}$. Dilarang menyimpan atau menampilkan akumulasi trip satu arah mentah sebagai "ritase" tanpa dinormalisasi ke ritase PP.

## Proteksi Kolom Berumus Spreadsheet (Strict No-Overwrite Formula Columns)

1. **Aturan Emas:** Dilarang keras menyentuh, mengubah, atau mengirim nilai/mutasi ke kolom-kolom yang sudah memiliki rumus bawaan dari file spreadsheet asli (SSOT).
2. **Identifikasi Kolom Berumus:** Kolom-kolom yang dihitung otomatis oleh formula spreadsheet (misalnya: kolom `"TOA SHIFT 2"` yang merupakan rumus `=TOTAL_TOA - TOA_SHIFT_1`, total ritase bus, total KM tempuh, dsb.) **TIDAK BOLEH** disertakan dalam payload penyimpanan/mutasi ke Google Sheets, baik pada mode form penuh ([Semua Kolom]), mode fokus tunggal, maupun batch/bulk update.
3. **Analisis Dampak Wajib:** Setiap kali membuat atau memodifikasi fungsi/fitur baru maupun eksisting (termasuk form UI, state management, adapter API, dan payload builder), Agent **WAJIB menganalisis batas dampak mutasi** untuk menjamin tidak ada kolom berumus yang tertimpa nilai statis.
4. **Pemisahan Input vs Kolom Rumus:** Nilai input dari pengguna yang merepresentasikan angka kumulatif atau bacaan fisik (seperti form "Total TOA" pada shift 2) harus secara ketat diarahkan ke kolom input murni miliknya (kolom "Total TOA"), bukan ke kolom turunan yang dihitung rumus ("TOA SHIFT 2").

## Standar Sistem Warna & Aksesibilitas Desain UI/UX (Strict Semantic Color Tokens & WCAG Contrast)

1. **Aturan Emas Anti-Hardcoded Color Hex/RGB di Komponen UI:**
   - Dilarang keras menuliskan kode warna mentah (*raw hex, rgb, rgba, hsl*) seperti `#3ecf8e`, `#10b981`, `#0284c7`, `#171717`, `rgba(0,0,0,...)` secara langsung pada inline style JSX/TSX atau aturan CSS baru.
   - Seluruh pewarnaan wajib merujuk ke CSS Variables semantik adaptif dari `src/styles/tokens/semantic.css`:
     - Latar kanvas/shell: `var(--color-surface-canvas)`
     - Latar kartu/modal: `var(--color-surface-raised)` atau `var(--color-surface-default)`
     - Teks utama: `var(--color-text-primary)` (rasio kontras 17.85:1 Light / 13.9:1 Dark)
     - Teks sekunder: `var(--color-text-secondary)`
     - Teks petunjuk placeholder: `var(--color-text-muted)` dengan `opacity: 1`
     - Tombol aksi utama: `var(--color-action-primary-bg)` dan `var(--color-action-primary-fg)`
     - Status/Feedback: `var(--color-success-*)`, `var(--color-warning-*)`, `var(--color-error-*)`, `var(--color-info-*)`
2. **Standar Rasio Kontras Aksesibilitas WCAG (Light & Dark Mode):**
   - Setiap komponen atau modul baru **WAJIB lolos uji keterbacaan di 2 Tema (Light Mode & Dark Mode)**.
   - Teks normal (< 18px / < 14px bold): Wajib **WCAG AA (rasio kontras ≥ 4.5:1)**, diutamakan **WCAG AAA (≥ 7.0:1)**.
   - Komponen UI/Ikon/Tombol grafis: Wajib **rasio kontras ≥ 3.0:1**.
   - Dilarang menempatkan teks putih di atas latar hijau muda, cyan, atau kuning (misal: `#fff` di atas `#24b47e` atau `#0ea5e9`).
   - Dilarang menempatkan teks hitam di atas latar abu-abu gelap atau hitam.
   - Dilarang memudarkan batang grafik atau indikator data penting dengan `opacity` transparan rendah (< 80%) di area dasar grafik.
3. **Pemisahan Tegas Domain UI vs Domain Google Sheets (SSOT API):**
   - Dilarang menyamakan fungsi pewarnaan UI aplikasi dengan pewarnaan sel Google Sheets.
   - File `src/utils/sheetColorUtils.ts` adalah **Single Source of Truth (SSOT) Google Sheets API murni**.
   - Dilarang mengubah nilai desimal RGB pada `sheetColorUtils.ts` untuk keperluan styling UI frontend, dan dilarang mengubah payload mutasi spreadsheet yang dapat merusak formula lembar kerja.
4. **Standarisasi Warna Peran Hierarki (Role RBAC):**
   - Dilarang menggunakan warna merah (`error`/`danger`) untuk menandai peran Superadmin.
   - Pewarnaan badge dan indikator identitas peran wajib menggunakan token khusus:
     - **Superadmin:** `var(--color-role-superadmin-bg)` / `fg` / `border` (Amber hangat/wibawa, kontras 8.35:1)
     - **Admin:** `var(--color-role-admin-bg)` / `fg` / `border` (Sky biru korporat)
     - **Korwil:** `var(--color-role-korwil-bg)` / `fg` / `border` (Indigo)
     - **Korlap:** `var(--color-role-korlap-bg)` / `fg` / `border` (Orange)
     - **PDO:** `var(--color-role-pdo-bg)` / `fg` / `border` (Emerald)
5. **Sinkronisasi Status Bar Peramban Ponsel (Theme-Color):**
   - Saat menambah atau memodifikasi pengaturan tampilan, pastikan utilitas `syncThemeChrome()` di `src/utils/themeUtils.ts` terpanggil untuk menjaga keselarasan warna status bar peramban Android/iOS dengan tema aktif.
6. **Verifikasi Mutlak Pengujian Kontrak Warna:**
   - Setiap penambahan pasangan token warna atau elemen baru wajib diuji dengan:
     `pnpm vitest run src/styles/tokens/color-contract.test.ts`
     dan dipastikan lulus 100% sebelum pekerjaan diserahkan.

## Standar Keamanan Basis Data & Row-Level Security (Strict RLS & Anti-Privilege Escalation)

1. **Aturan Emas Anti-Privilege Escalation:** Dilarang keras membuat policy RLS `FOR ALL TO anon USING (true)` atau memberikan `GRANT UPDATE/DELETE TO anon` pada tabel sensitif dan kolom identitas peran/status (`user_profiles.role_id`, `user_profiles.is_active`, `app_page_settings`, `daily_route_reports`, `daily_fleet_shifts`, `route_sheets`).
2. **Mutasi Administratif via SECURITY DEFINER:** Seluruh operasi administratif yang mengubah peran pengguna, status keaktifan akun, atau ketersediaan halaman aplikasi **WAJIB** dijalankan melalui fungsi PostgreSQL `SECURITY DEFINER` (RPC) yang memvalidasi hak peran pemanggil (`superadmin`/`admin`) secara ketat di sisi server database.
3. **Proteksi Boundary Edge Function:** Setiap Supabase Edge Function yang mengeksekusi mutasi atau mengakses kredensial Google Service Account WAJIB memvalidasi header otorisasi pemanggil dan memvalidasi `spreadsheetId` terhadap daftar rute terdaftar (whitelist). Dilarang membocorkan potongan kredensial atau informasi diagnostik internal server pada respons endpoint publik.

## Standar Ketelitian & Optimalisasi Multi-Dimensi Skala Industri Global (Zero-Mistake Quality Gates)

1. **Prinsip Kerja Ekstra Teliti & Hati-Hati:** Agent wajib bekerja dengan ketelitian tinggi, cermat, penuh kehati-hatian, dan pantang terburu-buru dalam setiap analisis, penulisan kode, refactoring, maupun migrasi.
2. **Optimalisasi Lintas Bidang (360° Industrial Grade):**
   - **Keamanan (Security):** Terapkan sanitasi input ketat, anti-XSS (escape HTML pada SweetAlert2/modal), validasi hak akses & RLS database, cegah privilege escalation, zero credential leak, dan lindungi boundary API/Edge Function.
   - **Performa (Performance):** Minimalkan re-render dengan memoization reaktif (`useMemo`/`useCallback`), eliminasi query berulang/N+1, efisiensi payload, lazy-loading komponen berat, dan pastikan animasi berjalan mulus di 60fps mobile.
   - **UI/UX & Mobile-First Excellence:** Tampilan mobile-first yang proporsional, ergonomis, interaksi sentuh alami (kurva pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`), kontras sempurna di 2 tema (Light & Dark Mode), serta status UX lengkap (loading skeleton, empty state informatif, error ramah non-teknis, success feedback).
   - **Integritas Data (Data Integrity):** Pertahankan Single Source of Truth (SSOT), lindungi rumus spreadsheet dari penimpaan nilai statis, gunakan parser desimal/ribuan lokal yang presisi (`parseIndonesianNumber`), dan pastikan normalisasi terminologi domain (ritase PP = 2 trip, `km_baku`).
   - **Kamus Teks Sentral:** Dilarang hardcode string antarmuka; seluruh teks wajib melalui `src/constants/texts/`.
   - **Sistem Token Warna:** Dilarang hardcode hex/rgb; wajib memakai `src/styles/tokens/semantic.css` dan lolos rasio kontras WCAG AA/AAA.
3. **Klausul Zero-Mistake & Verifikasi Wajib Sebelum Selesai:**
   - Wajib menjalankan dan memastikan lulus 100%:
     1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ Seluruh kontrak kontras warna lulus 100%.
     2. `pnpm vitest run src/` ➔ Seluruh unit test lulus 100% tanpa kegagalan.
     3. `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite build lulus 0 error.
     4. `graphify update .` ➔ Graf pengetahuan kode terbarukan.
   - Dilarang membuat asumsi tanpa pembuktian nyata (*evidence before assertions*).
