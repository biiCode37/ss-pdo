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

## ⚡ Proteksi Kuota Supabase & Pencegahan Infinite Loop (Strict Anti-Egress & Quota Protection)

1. **Aturan Emas Anti-Looping Network Queries (Prioritas Tinggi):**
   - Dilarang keras memasukkan *state variable* yang nilainya dimutasi oleh fungsi pemanggil ke dalam `dependency array` milik `useCallback` atau `useEffect` (antipattern: `useCallback(async () => { setData(...) }, [data])`). Kesalahan ini memicu perulangan tak terbatas (*infinite re-render loop*) yang melenyapkan kuota API Gateway dan Egress seketika.
   - Wajib menggunakan `dataRef` (`useRef(data)`) jika fungsi asinkronus memerlukan pembacaan status eksistensi data tanpa memperbarui referensi fungsi.
2. **In-Flight Request Guard & Concurrency Control:**
   - Setiap fungsi pemanggilan data asinkronus (terutama di dashboard, monitoring 18 rute, atau sinkronisasi latar belakang) **WAJIB** dilengkapi *in-flight guard* (seperti `isFetchingRef.current = true/false` atau `AbortController`) untuk mencegah request ganda yang tumpang tindih (*overlapping/bursting*).
   - Abaikan (*early return*) request baru berstatus *silent update* jika request sebelumnya masih berjalan di jaringan.
3. **Wajib Debounce Realtime Subscriptions (Minimal 3.000 ms):**
   - Setiap listener Supabase Realtime (`postgres_changes`) yang bertugas memicu pembaruan data atau rekap laporan **WAJIB dibungkus dengan debounce timer minimal 3.000 ms (3 detik)**.
   - Dilarang langsung memicu kueri database untuk setiap event individual yang masuk. Ketika puluhan baris diedit secara berurutan di spreadsheet oleh petugas lapangan, antrean event realtime wajib diredam sehingga hanya memicu **1 kali refresh hening (*silent in-place update*)** setelah jeda selesai.
   - Wajib menyertakan *cleanup* pembersihan timer (`clearTimeout`) dan pelepasan channel (`supabase.removeChannel`) pada return fungsi `useEffect` saat komponen di-unmount untuk mencegah *memory leak* dan *ghost network fetchers*.
4. **Agregasi Pencatatan Log Database (`activity_logs`):**
   - Dilarang melakukan penulisan log per-sel / per-baris secara massal ke tabel database `activity_logs` pada operasi bulk atau loop otomatis.
   - Pencatatan aktivitas wajib diagregasikan menjadi 1 baris ringkasan per aksi batch (misal: "Update massal 30 bus rute JAK.60") untuk melindungi kuota *Log Ingestion* Supabase (limit 1 GB).
5. **Verifikasi Pengujian Beban Jaringan (Network Call-Count Assertion):**
   - Setiap komponen atau modul baru yang mengonsumsi Supabase REST API atau Realtime wajib dilengkapi pengujian unit otomatis yang memvalidasi bahwa fungsi pemanggilan data hanya terpanggil tepat 1 kali pada mount awal (`toHaveBeenCalledTimes(1)`) dan membuktikan timer debounce realtime bekerja meredam event beruntun.

## Standar Ketelitian & Optimalisasi Multi-Dimensi Skala Industri Global (Zero-Mistake Quality Gates)

1. **Prinsip Kerja Ekstra Teliti & Hati-Hati:** Agent wajib bekerja dengan ketelitian tinggi, cermat, penuh kehati-hatian, dan pantang terburu-buru dalam setiap analisis, penulisan kode, refactoring, maupun migrasi.
2. **Optimalisasi Lintas Bidang (360° Industrial Grade):**
   - **Keamanan (Security):** Terapkan sanitasi input ketat, anti-XSS (escape HTML pada SweetAlert2/modal), validasi hak akses & RLS database, cegah privilege escalation, zero credential leak, dan lindungi boundary API/Edge Function.
   - **Performa & Kuota (Performance & Quota Protection):** Minimalkan re-render dengan memoization reaktif (`useMemo`/`useCallback`), isolasi dependency tanpa loop state, pasang in-flight guard, terapkan debounce minimal 3 detik pada realtime listener, eliminasi query berulang/N+1, agregasikan log audit, efisiensi payload, dan pastikan animasi berjalan mulus di 60fps mobile.
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

## Golden Rule Efisiensi Token & Anti Over-Engineering

**Prioritas:** seluruh aturan AGENTS.md di atas > aturan bagian ini > preferensi gaya lain. Efisiensi tidak boleh menurunkan kualitas atau melewati quality gate.

### A. Urutan Navigasi Kode (paling murah lebih dulu)
1. **Lokasi sudah diketahui** (dari skill proyek, konteks sesi, atau langkah sebelumnya) ➔ baca bagian yang relevan saja (offset/limit), bukan seluruh file.
2. **Lokasi atau relasi belum diketahui** (siapa memanggil X, dampak mengubah Y, alur A ➔ B) ➔ graphify CLI langsung: `graphify query "<pertanyaan>"`, `graphify path "<A>" "<B>"`, `graphify explain "<konsep>"`. Jangan memuat skill graphify penuh hanya untuk query.
3. **Mencari literal persis** (nama kolom, kunci teks, simbol) ➔ grep tertarget dengan mode `files_with_matches`/`count` terlebih dahulu.
4. **Baca file utuh / grep luas** ➔ opsi terakhir.
5. Hasil graphify adalah petunjuk, bukan bukti: wajib dicocokkan ke kode asli sebelum disimpulkan atau diedit. Graf bisa tertinggal dari perubahan sesi berjalan; jalankan `graphify update .` setelah mengubah kode.

### B. Anti Over-Engineering (prinsip ponytail, level `full`)
1. Ambil opsi terkecil yang menyelesaikan tugas secara utuh: (a) apakah perlu ada? (b) sudah ada helper/komponen/pola di codebase? (c) standard library/fitur platform? (d) dependency terpasang? (e) baru tulis kode minimal. Dilarang menambah dependency untuk beberapa baris kode.
2. Tanpa abstraksi, wrapper, opsi, config, atau kode "untuk nanti" yang tidak diminta. Penghapusan lebih baik daripada penambahan. Pertahankan struktur, lapisan, dan konvensi yang sudah ada.
3. Malas pada solusi, tidak pada kelengkapan: tuntaskan semua pemanggil, test, dan fixture yang terdampak. Perbaikan bug ➔ cari semua pemanggil, perbaiki akar masalah sekali di kode bersama.
4. Penyederhanaan atau shortcut dengan batasan yang disadari wajib diberi komentar satu baris mengikuti konvensi codebase: `// ponytail: <alasan/batasan>, <kapan perlu ditingkatkan>`.
5. **Bukan over-engineering (tetap wajib):** kamus teks `src/constants/texts/`, token warna semantik, test call-count/debounce, dokumentasi `refact_N`, 4 quality gate, RLS/`SECURITY DEFINER`, in-flight guard, debounce realtime, validasi di trust boundary, penanganan error pencegah kehilangan data, aksesibilitas.
6. Akhiri setiap laporan kerja dengan 1–2 baris: apa yang dilewati atau belum diverifikasi, dan risiko yang perlu diketahui pengguna.

### C. Pola Pikir Kritis (Bukan "Yes-Man")
Pengguna secara eksplisit meminta agent yang berani tidak setuju. Menyetujui instruksi yang keliru dianggap kegagalan kerja.
1. **Uji dulu, baru sepakati.** Sebelum menjalankan aturan/rencana/klaim pengguna, cek terhadap bukti nyata (ukur, uji kecil, baca kode). Contoh: klaim "selalu graphify dulu" diuji dengan membandingkan biaya query graphify vs grep sebelum dijadikan aturan.
2. **Jika keliru, katakan terus terang** — tunjukkan buktinya, jelaskan dampaknya (data, keamanan, kuota, UX, biaya), dan tawarkan versi yang lebih baik. Jangan melunakkan menjadi persetujuan.
3. **Koreksi miskonsepsi dan informasi keliru/hoaks** walau tidak ditanya, termasuk soal tool, library, dan praktik industri. Bedakan tegas antara fakta terverifikasi, asumsi, dan opini.
4. **Jujur soal ketidakpastian.** Jangan mengarang nama API, flag, versi, atau hasil. Jika belum diverifikasi, sebut "belum diverifikasi"; cek dokumentasi terkini (Context7/dokumen resmi) untuk hal yang bergantung versi.
5. **Saat pengguna meminta pendapat, berikan pendapat dan tunggu keputusan** — jangan langsung mengeksekusi. Saat instruksi ambigu dan salah tafsir berisiko, tanyakan satu pertanyaan yang paling menentukan.
6. **Laporkan hasil apa adanya:** test gagal disebut gagal beserta output-nya; langkah yang dilewati disebut dilewati. Dilarang mengklaim selesai tanpa bukti.
7. **Membimbing, bukan menggurui:** jelaskan alasan di balik rekomendasi secara singkat dengan bahasa yang mudah dipahami agar pengguna ikut memahami, bukan sekadar menerima.
