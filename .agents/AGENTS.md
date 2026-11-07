# 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO

Dokumen ini berisi aturan emas (_Golden Rules_) dan batasan teknis yang **WAJIB dipatuhi oleh AntiGravity AI tanpa pengecualian** dalam setiap sesi pengembangan proyek **SS_PDO**.

---

## 📱 1. Layout & Tampilan (Mobile-First Priority)

- **Aturan Emas:** Prioritas utama tata letak dan UX aplikasi ini adalah **Mobile-First**.
- Selalu uji dan pastikan bahwa setiap komponen UI (kartu, form, tombol, tabel) terlihat sangat indah, proporsional, dan nyaman digunakan di layar ponsel pengguna operasional di lapangan.
- Selalu sesuaikan warna dan kontras untuk **2 Tema: Light Mode & Dark Mode**.
- **Larangan Keras Pewarnaan:** Dilarang menggunakan nilai warna mentah (*hardcoded hex/rgb*). Wajib menggunakan sistem token semantik dari `src/styles/tokens/semantic.css` yang telah teruji rasio kontras WCAG.
- **Konsistensi Tampilan (Anti-Slop):** WAJIB mematuhi [`rules/ui-consistency.md`](./rules/ui-consistency.md) untuk setiap kode UI baru/diubah: pakai ulang komponen yang ada, tanpa inline style statis baru, satu cincin fokus, tanpa gradasi/glow, skala font/ikon/jarak/radius, teks bantuan minimal, dan mockup light & dark sebelum implementasi.

---

## 📊 2. Integritas Data (Single Source of Truth - SSOT)

- **Aturan Emas:** File asli Google Sheets adalah **Single Source of Truth (SSOT)**.
- Nilai rangkuman dan statistik yang ditampilkan pada dashboard **HARUS MURNI** sesuai dengan nilai hasil rumus dari file sumbernya.
- **Dilarang memotong atau membulatkan angka desimal** secara sepihak (tampilkan presisi murni hingga 10 desimal jika ada).
- **Parsing Angka Spreadsheet:** Semua parsing angka dari data `BusData` / spreadsheet **WAJIB** menggunakan `parseIndonesianNumber()` dari `utils/numberUtils.ts`. Dilarang menggunakan `parseInt` atau `parseFloat` langsung pada field data spreadsheet untuk mencegah kesalahan parsing format desimal/ribuan Indonesia (`"."` dan `","`).
- **Terminologi Domain Operasional (Ritase vs Trip & `km_baku`):**
  - **1 Ritase / Rit** = 1 Putaran Penuh (PP / Pulang-Pergi) = **2 Trip**.
  - **Trip** = 1 Arah (Pergi saja ATAU Pulang saja).
  - **`km_baku`** = Total jarak tempuh untuk **1 ritase (PP)**.
  - Setiap penyebutan kata *"ritase"* atau *"rit"* dalam instruksi selalu berarti **PP**.
  - Kalkulasi total ritase dari data trip bus adalah $\frac{\text{tripPergi} + \text{tripPulang}}{2}$ atau $\frac{\text{Total KM Tempuh}}{\text{km\_baku}}$. Dilarang menyimpan atau menampilkan akumulasi trip satu arah mentah sebagai "ritase" tanpa dinormalisasi ke ritase PP.
- **Proteksi Kolom Berumus Spreadsheet (Strict No-Overwrite Formula Columns):**
  - **Dilarang keras menyentuh, mengubah, atau mengirim nilai/mutasi ke kolom-kolom yang sudah memiliki rumus bawaan dari file spreadsheet asli (SSOT).**
  - Kolom-kolom yang dihitung otomatis oleh formula spreadsheet (misalnya: `"TOA SHIFT 2"` yang merupakan rumus `=TOTAL_TOA - TOA_SHIFT_1`, total ritase bus, total KM tempuh, dsb.) **TIDAK BOLEH** disertakan dalam payload penyimpanan/mutasi ke Google Sheets, baik pada mode form penuh ([Semua Kolom]), mode fokus tunggal, maupun batch/bulk update.
  - Setiap kali membuat atau memodifikasi fungsi/fitur baru maupun eksisting (termasuk form UI, state management, adapter API, dan payload builder), Agent **WAJIB menganalisis batas dampak mutasi** untuk menjamin tidak ada kolom berumus yang tertimpa nilai statis.
  - Nilai input dari pengguna yang merepresentasikan angka kumulatif atau bacaan fisik (seperti form "Total TOA" pada shift 2) harus secara ketat diarahkan ke kolom input murni miliknya (kolom "Total TOA"), bukan ke kolom turunan yang dihitung rumus ("TOA SHIFT 2").

---

## 🔐 3. Autentikasi & Sesi Login

- **Aturan Emas:** Sesi login pengguna dibuat **permanen tanpa batas waktu (no timeout)**.
- Sekali pengguna login, biarkan tetap dalam kondisi login selama pengguna tidak menghapus aplikasi atau mengganti peranti.
- Lakukan pembaruan token (_silent token refresh_) di latar belakang tanpa memaksa pengguna logout secara tiba-tiba.

---

## 🛠️ 4. Tooling & Paket Manager (Wajib PNPM)

- Selalu gunakan **`pnpm`** untuk semua instruksi install, add, remove, dan execution script (`pnpm install`, `pnpm add`, `pnpm run build`).
- Gunakan **`pnpm dlx`** sebagai pengganti `npx`.
- Selalu gunakan perintah Git Bash / zsh yang aman dan dapat dicopy-paste.

---

## 🎨 5. Standar UI/UX & Animasi Fluid (iOS Style)

- Terapkan animasi morphing dan transisi dengan kurva fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Form Selector Rute & Tanggal:**
  - Menciut (_morph_) secara otomatis menjadi kapsul ringkas setelah data dimuat.
  - Pemicu (_trigger_) pembuka & penutup form bersifat dua arah (_bidirectional tap_) pada area header/kapsul tanpa tombol `[Ubah]` atau `[Tutup]` eksplisit yang mengganggu.
- **Highlight Card Target:**
  - Memberikan efek _glowing pulse_ berdenyut selama **6 detik** saat unit bus di-tap dari daftar Keterangan.
- Sembunyikan scrollbar fisik pada container internal (`.no-scrollbar`).

---

## 💬 6. Komunikasi & Workflow Kerja

- Selalu gunakan **Bahasa Indonesia** yang sopan, profesional, dan mudah dimengerti.
- Sajikan ringkasan perubahan dalam format:
  1. Ringkasan Perubahan
  2. Daftar File yang Diubah
  3. Status Verifikasi & Build (hasil nyata 4 quality gate, lihat bagian 12)
  4. Apa yang dilewati/belum diverifikasi dan risiko yang perlu diketahui User (1–2 baris)
- Selalu perhatikan apa yang boleh dilihat oleh user (tampil pada frontend) dan apa yang tidak boleh (termasuk database), peringatan sistem, dan hal-hal lainnya yang hanya dimengerti oleh developer.
- Selalu sajikan pesan error/kesalahan (frontend) pada sisi user yang mudah untuk user fahami (bahasa non teknis).

### 🧠 6A. Pola Pikir Kritis (Bukan "Yes-Man") — WAJIB
User secara eksplisit meminta agent yang berani tidak setuju. Menyetujui keputusan/pendapat User yang keliru dianggap kegagalan kerja.
1. **Uji dulu, baru sepakati.** Sebelum menjalankan aturan/rencana/klaim User, cek terhadap bukti nyata (ukur, uji kecil, baca kode). Contoh: klaim "selalu graphify dulu" diuji dengan membandingkan biaya query graphify (~2.000 token, terpotong, tidak menjawab) vs grep tertarget (~200 token, langsung tepat) sebelum dijadikan aturan.
2. **Jika keliru/kurang tepat/berdampak buruk, katakan terus terang** — tunjukkan buktinya, jelaskan dampaknya (data, keamanan, kuota, UX, biaya), dan tawarkan alternatif solusi terbaik. Jangan melunakkan menjadi persetujuan.
3. **Koreksi miskonsepsi dan informasi keliru/hoaks** walau tidak ditanya, termasuk soal tool, library, dan praktik industri. Bedakan tegas antara fakta terverifikasi, asumsi, dan opini.
4. **Jujur soal ketidakpastian.** Jangan mengarang nama API, flag, versi, atau hasil. Jika belum diverifikasi, sebut "belum diverifikasi"; cek dokumentasi terkini untuk hal yang bergantung versi.
5. **Saat User meminta pendapat, berikan pendapat dan tunggu keputusan** — jangan langsung mengeksekusi. Saat instruksi ambigu dan salah tafsir berisiko, tanyakan satu pertanyaan yang paling menentukan.
6. **Laporkan hasil apa adanya:** test gagal disebut gagal beserta output-nya; langkah yang dilewati disebut dilewati. Dilarang mengklaim selesai tanpa bukti.
7. **Membimbing, bukan menggurui:** jelaskan alasan di balik rekomendasi secara singkat dan mudah dipahami agar User ikut memahami, bukan sekadar menerima.

---

## ⚡ 7. Golden Rule Efisiensi Token & Anti Over-Engineering (Ponytail & Graphify)

**Prioritas:** seluruh aturan lain di dokumen ini > bagian 7 > preferensi gaya lain. Efisiensi tidak boleh menurunkan kualitas atau melewati quality gate. Selaras dengan bagian bernama sama di [`AGENTS.md`](../AGENTS.md).

### 7A. Urutan Navigasi Kode (paling murah lebih dulu)
1. **Lokasi sudah diketahui** (dari konteks sesi atau langkah sebelumnya) ➔ baca bagian yang relevan saja, bukan seluruh file.
2. **Lokasi atau relasi belum diketahui** (siapa memanggil X, dampak mengubah Y, alur A ➔ B) ➔ graphify CLI: `graphify query "<pertanyaan>"`, `graphify path "<A>" "<B>"`, `graphify explain "<konsep>"`.
3. **Mencari literal persis** (nama kolom, kunci teks, simbol) ➔ grep tertarget (daftar file/jumlah dulu).
4. **Baca file utuh / grep luas** ➔ opsi terakhir.
5. Hasil graphify adalah petunjuk, bukan bukti: wajib dicocokkan ke kode asli sebelum disimpulkan atau diedit. Jalankan `graphify update .` setelah setiap perubahan kode.

### 7B. Mode Ponytail — Anti Over-Engineering (Wajib Aktif, level `full`)
1. Ambil opsi terkecil yang menyelesaikan tugas secara utuh: (a) apakah perlu ada? (b) sudah ada helper/komponen/pola di codebase? (c) standard library/fitur platform? (d) dependency terpasang? (e) baru tulis kode minimal. Dilarang menambah dependency untuk beberapa baris kode.
2. Tanpa abstraksi, wrapper, opsi, config, atau kode "untuk nanti" yang tidak diminta. Penghapusan lebih baik daripada penambahan. Pertahankan struktur dan konvensi yang sudah ada.
3. Malas pada solusi, tidak pada kelengkapan: tuntaskan semua pemanggil, test, dan fixture yang terdampak. Perbaikan bug ➔ cari semua pemanggil, perbaiki akar masalah sekali di kode bersama.
4. Penyederhanaan/shortcut dengan batasan yang disadari wajib diberi komentar satu baris: `// ponytail: <alasan/batasan>, <kapan perlu ditingkatkan>`.
5. **Bukan over-engineering (tetap wajib):** kamus teks `src/constants/texts/`, token warna semantik, test call-count/debounce, dokumentasi `refact_N`, 4 quality gate, RLS/`SECURITY DEFINER`, in-flight guard, debounce realtime, validasi di trust boundary, penanganan error pencegah kehilangan data, aksesibilitas.

---

## 📌 8. Kebijakan Branch & Commit Git (Wajib `devmode`)

- **Aturan Emas Branch `devmode` & Isolasi Branch:**
  - Seluruh pengerjaan kode, debugging, penambahan fitur, dan perbaikan bug **WAJIB dan HARUS dilakukan pada branch `devmode`**.
  - **Inisialisasi Otomatis:** Jika branch `devmode` belum ada pada proyek yang sedang dikerjakan, buat branch tersebut terlebih dahulu (`git checkout -b devmode`) sebelum melakukan perubahan kode apa pun.
  - **Larangan Akses Branch Utama:** Agent **HANYA** boleh menyentuh dan bekerja pada branch `devmode`. Dilarang keras menyentuh, mengakses, checkout, merge, atau melakukan modifikasi apa pun ke branch `main`, `master`, atau `production` kecuali jika pengguna sendiri yang memberikan instruksi eksplisit.
- **Workflow Deploy & Pengujian (Vercel Preview):**
  - Deployment untuk branch `devmode` berstatus **Preview Deployment** (bukan Production).
  - Push ke remote branch `devmode` hanya dilakukan ketika pengguna memberikan instruksi eksplisit: *"push devmode"*.
- **Format Judul Commit (Ringkas & Padat):**
  - Judul commit wajib seringkas mungkin (maksimal **≤ 50 karakter**) dan jelas menggunakan format Conventional Commits (contoh: `fix: input TOA S1`, `feat: dropdown BA.02`). Dilarang membuat judul panjang bertele-tele.
- **Hindari Over-Commit:**
  - Dilarang melakukan `git commit` untuk perubahan-perubahan mikro (seperti tweaking spacing kecil, padding, dll). Kumpulkan beberapa perubahan kecil dalam satu sesi fitur sebelum commit.
- **Perintah Cepat "PA" (Push All):**
  - Ketika pengguna mengatakan/memberikan perintah `"PA"`, itu artinya **Push All**.
  - Agent **WAJIB** secara otomatis menjalankan rangkaian tugas berurutan berikut:
    1. **Commit:** Buat commit ringkas (≤ 50 karakter) di branch `devmode`.
    2. **Push Devmode:** `git push origin devmode`.
    3. **Switch Branch Main:** `git checkout main`.
    4. **Merge Devmode ke Main:** `git merge devmode -m "merge: devmode to main"`.
    5. **Push Main:** `git push origin main`.
    6. **Kembali ke Devmode:** `git checkout devmode` (agar pekerjaan selanjutnya tetap terisolasi di `devmode`).
  - **Klausul Keselamatan Wajib (Larangan Keputusan Mandiri):**
    - Jika ditemukan kendala/permasalahan dalam proses tugas-tugas itu (seperti merge conflict, test gagal, build gagal, git rejection, atau anomali jaringan), agent **DILARANG KERAS mengambil keputusan sendiri**.
    - Agent **WAJIB memberi konfirmasi kepada pengguna mengenai permasalahan yang ditemukan secara transparan dilengkapi dengan rekomendasi solusi**, lalu menunggu keputusan/arahan pengguna sebelum melanjutkan atau mengulangi tugas yang belum selesai/terganggu/terhenti.
- **Perintah Cepat "PD" (Push Devmode Saja):**
  - Ketika pengguna mengatakan/memberikan perintah `"PD"`, itu artinya **Push Devmode Saja**.
  - Agent **WAJIB** hanya menjalankan perintah `git push origin devmode` langsung dari branch `devmode`.
  - Agent **DILARANG KERAS menyentuh, checkout, merge, atau push ke branch `main` sama sekali**. Pekerjaan dan branch lokal tetap berada di `devmode`.

---

## 🛡️ 9. Standar Keamanan, Kualitas Kode, & Pencegahan Regresi

Aturan di bawah ini dirumuskan berdasarkan evaluasi menyeluruh dari siklus **Refactor 6** untuk memastikan tidak ada celah keamanan atau penurunan kualitas di masa depan:

1. **Aturan Global Grep (*Zero Call-Site Left Behind*):**
   - Setiap kali membuat fungsi baru pengganti (misalnya: utilitas parsing angka, ekstraksi ID spreadsheet `extractSpreadsheetId`, modal dialog, atau classifier error), AI **WAJIB melakukan pencarian teks global (`grep_search`) ke seluruh folder `src/`** untuk memigrasikan SEMUA pemanggilan lama tanpa sisa sebelum menandai pekerjaan selesai. Dilarang meninggalkan fungsi lama setengah terpakai.

2. **Sanitasi Wajib untuk SweetAlert2 & Template Literal HTML (Anti-XSS):**
   - Dilarang keras memasukkan data/variabel dinamis ke dalam template string HTML (`` `...${value}...` ``) tanpa membungkusnya dengan `escapeHtml(value)` dari `src/utils/modals/busInputModal.ts` atau `src/utils/alertUtils.ts`.
   - Proteksi otomatis JSX React tidak berlaku di HTML mentah SweetAlert2. Seluruh input angka, teks, label, dan placeholder wajib di-escape.

3. **Transparansi Error & Dilarang `.catch(() => {})` Kosong:**
   - **Sisi Pengguna (Frontend):** Dilarang menyamarkan kegagalan jaringan menjadi angka 0 (misal pada grafik tren penumpang atau kartu ringkasan bus). Selalu tampilkan pesan ramah non-teknis dan tombol coba lagi (*retry*).
   - **Sisi Pengembang (Log):** Dilarang membuat blok `.catch(() => {})` kosong tanpa jejak. Minimal sertakan `console.warn('[NamaModul] Gagal melakukan aksi:', err)` agar kegagalan jaringan atau database terdeteksi di log.

4. **Batas Ukuran File & Modularitas (*Anti God-File*):**
   - Jika suatu file servis atau komponen mendekati 400–500 baris atau mulai menangani lebih dari 1 domain tanggung jawab, wajib dipecah menjadi modul-modul mandiri yang rapi (seperti struktur `src/services/googleSheets/` atau `src/utils/modals/`).

5. **Quality Gates Otomatis Sebelum Menyatakan Selesai:**
   - AI dilarang menyatakan suatu pekerjaan selesai sebelum menjalankan dan memastikan:
     1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ Seluruh kontrak kontras warna lulus 100%.
     2. `pnpm vitest run src/` ➔ Seluruh unit test lulus 100% tanpa kegagalan.
     3. `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite build lulus 0 error.
     4. `graphify update .` ➔ Graf pengetahuan kode terbarukan.

---

## 📖 10. Standar Kamus Teks Sentral (`src/constants/texts/`)

- **Aturan Emas Anti Hardcoded UI String:** Dilarang keras menuliskan teks antarmuka (*hardcoded UI strings*) secara langsung pada kode komponen (`.tsx`), modal (`.ts`), notifikasi, atau utilitas.
- **Kamus Sesuai Domain/Modul:** Seluruh teks antarmuka pengguna (judul, label, placeholder, tooltip, badge, status, pesan error ramah pengguna, konfirmasi SweetAlert2, toast notifikasi) **WAJIB** didefinisikan di modul kamus domain terkait dalam `src/constants/texts/`:
  - `text_common.ts`: Tombol umum (Simpan, Batal, Tutup, Coba Lagi), status offline, dan label global.
  - `text_auth.ts`: Layanan autentikasi, halaman login, sesi, legal/privasi.
  - `text_dashboard.ts`: Header, tab utama, KPI, grafik tren TOA, perbandingan shift, daftar unit, kartu bus, rekap akumulasi.
  - `text_fleet_status.ts`: Modal status armada (SGO/AP/dll), segmented tabs, bar konfirmasi shift, toast.
  - `text_unit_detail.ts`: Header ringkasan armada, shift 1/2, total ritase, KM, pelanggan, catatan operasional.
  - `text_user_management.ts`: Manajemen user RBAC, modal tambah user, ubah peran, toggle status akun, card metadata, filter tabs.
  - `text_alerts.ts`: Pesan SweetAlert2, form input bus modal, bulk trip, bulk copy KM, dialog logout, antrean offline.
  - `text_errors.ts`: Pesan error ramah pengguna (non-teknis), validasi kode rute & URL sheet.
  - `text_pdo_form.ts`: Form laporan operasional pengawas/petugas.
  - `text_monitoring.ts`: Monitoring wilayah 18 rute & rekap laporan.
  - `text_wa_report.ts`: Generator laporan format WhatsApp.
- **Interpolasi Dinamis:** Gunakan fungsi template murni jika teks membutuhkan parameter dinamis (contoh: `(count: number) => `...``).
- **Verifikasi Unit Test:** Setiap penambahan teks kamus baru wajib disertakan uji pada `src/constants/texts/texts.test.ts`.

---

## 🛡️ 11. Standar Keamanan Basis Data & Row-Level Security (Strict RLS & Anti-Privilege Escalation)

- **Aturan Emas Anti-Privilege Escalation:** Dilarang keras membuat policy RLS `FOR ALL TO anon USING (true)` atau memberikan `GRANT UPDATE/DELETE TO anon` pada tabel sensitif dan kolom identitas peran/status (`user_profiles.role_id`, `user_profiles.is_active`, `app_page_settings`, `daily_route_reports`, `daily_fleet_shifts`, `route_sheets`).
- **Mutasi Administratif via SECURITY DEFINER:** Seluruh operasi administratif yang mengubah peran pengguna, status keaktifan akun, atau ketersediaan halaman aplikasi **WAJIB** dijalankan melalui fungsi PostgreSQL `SECURITY DEFINER` (RPC) yang memvalidasi hak peran pemanggil (`superadmin`/`admin`) secara ketat di sisi server database.
- **Proteksi Boundary Edge Function:** Setiap Supabase Edge Function yang mengeksekusi mutasi atau mengakses kredensial Google Service Account WAJIB memvalidasi header otorisasi pemanggil dan memvalidasi `spreadsheetId` terhadap daftar rute terdaftar (whitelist). Dilarang membocorkan potongan kredensial atau informasi diagnostik internal server pada respons endpoint publik.

---

## 🎯 12. Standar Ketelitian & Optimalisasi Multi-Dimensi Skala Industri Global (Zero-Mistake Quality Gates)

- **Prinsip Kerja Ekstra Teliti & Hati-Hati:** Agent wajib bekerja dengan ketelitian tinggi, cermat, penuh kehati-hatian, dan pantang terburu-buru dalam setiap analisis, penulisan kode, refactoring, maupun migrasi arsitektur.
- **Optimalisasi Lintas Bidang (360° Industrial Grade):**
  - **Keamanan (Security):** Terapkan sanitasi input ketat, anti-XSS (escape HTML pada SweetAlert2/modal), validasi hak akses & RLS database, cegah privilege escalation, zero credential leak, dan lindungi boundary API/Edge Function.
  - **Performa & Kuota (Performance & Quota Protection):** Minimalkan re-render dengan memoization reaktif (`useMemo`/`useCallback`), isolasi dependency tanpa loop state, pasang in-flight guard, terapkan debounce minimal 3 detik pada realtime listener, eliminasi query berulang/N+1, agregasikan log audit, efisiensi payload, dan pastikan animasi berjalan mulus di 60fps mobile.
  - **UI/UX & Mobile-First Excellence:** Tampilan mobile-first yang proporsional, ergonomis, interaksi sentuh alami (kurva pegas iOS `cubic-bezier(0.32, 0.72, 0, 1)`), kontras sempurna di 2 tema (Light & Dark Mode), serta status UX lengkap (loading skeleton, empty state informatif, error ramah non-teknis, success feedback).
  - **Integritas Data (Data Integrity):** Pertahankan Single Source of Truth (SSOT), lindungi rumus spreadsheet dari penimpaan nilai statis, gunakan parser desimal/ribuan lokal yang presisi (`parseIndonesianNumber`), dan pastikan normalisasi terminologi domain (ritase PP = 2 trip, `km_baku`).
  - **Kamus Teks Sentral:** Dilarang keras hardcode string antarmuka; seluruh teks wajib melalui `src/constants/texts/`.
  - **Sistem Token Warna:** Dilarang hardcode hex/rgb; wajib memakai `src/styles/tokens/semantic.css` dan lolos rasio kontras WCAG AA/AAA.
- **Klausul Zero-Mistake & Verifikasi Wajib Sebelum Selesai:**
  - Wajib menjalankan dan memastikan lulus 100%:
    1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` ➔ Seluruh kontrak kontras warna lulus 100%.
    2. `pnpm vitest run src/` ➔ Seluruh unit test lulus 100% tanpa kegagalan.
    3. `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite build lulus 0 error.
    4. `graphify update .` ➔ Graf pengetahuan kode terbarukan.
  - Dilarang membuat asumsi tanpa pembuktian nyata (*evidence before assertions*).

---

## 🎨 13. Standar Sistem Warna & Aksesibilitas Desain UI/UX (Strict Semantic Color Tokens & WCAG Contrast)

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

---

## ⚡ 14. Proteksi Kuota Supabase & Pencegahan Infinite Loop (Strict Anti-Egress & Quota Protection)

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
