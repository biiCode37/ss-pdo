# 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO

Dokumen ini berisi aturan emas (_Golden Rules_) dan batasan teknis yang **WAJIB dipatuhi oleh AntiGravity AI tanpa pengecualian** dalam setiap sesi pengembangan proyek **SS_PDO**.

---

## 📱 1. Layout & Tampilan (Mobile-First Priority)

- **Aturan Emas:** Prioritas utama tata letak dan UX aplikasi ini adalah **Mobile-First**.
- Selalu uji dan pastikan bahwa setiap komponen UI (kartu, form, tombol, tabel) terlihat sangat indah, proporsional, dan nyaman digunakan di layar ponsel pengguna operasional di lapangan.
- Selalu sesuaikan warna dan kontras untuk **2 Tema: Light Mode & Dark Mode**.

---

## 📊 2. Integritas Data (Single Source of Truth - SSOT)

- **Aturan Emas:** File asli Google Sheets adalah **Single Source of Truth (SSOT)**.
- Nilai rangkuman dan statistik yang ditampilkan pada dashboard **HARUS MURNI** sesuai dengan nilai hasil rumus dari file sumbernya.
- **Dilarang memotong atau membulatkan angka desimal** secara sepihak (tampilkan presisi murni hingga 10 desimal jika ada).
- **Parsing Angka Spreadsheet:** Semua parsing angka dari data `BusData` / spreadsheet **WAJIB** menggunakan `parseIndonesianNumber()` dari `utils/numberUtils.ts`. Dilarang menggunakan `parseInt` atau `parseFloat` langsung pada field data spreadsheet untuk mencegah kesalahan parsing format desimal/ribuan Indonesia (`"."` dan `","`).

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
  3. Status Verifikasi & Build (`pnpm run build`)
  4. Wajib keritis dan jangan selalu setuju terhadap keputusan User, kaji resiko terlebih dahulu dan selalu berikan masukan yang terbaik untuk kelangsungan project ini.
  5. Jika keputusan/pendapat saya keliru/kurang tepat atau bahkan berdampak buruk kedepannya dalam berbagai aspek, anda wajib keritis dan memberikan masukan alternatif solusi terbaik untuk kelangsungan project ini.
  6. Selalu perhatikan apa yang boleh dilihat oleh user (tampil pada frontend) dan apa yang tidak boleh (termasuk database), peringatan sistem, dan hal-hal lainnya yang hanya dimengerti oleh developer.
  7. Selalu sajikan pesan error/kesalahan (frontend) pada sisi user yang mudah untuk user fahami (bahasa non teknis).

---

## ⚡ 7. Penggunaan Skill Wajib (Ponytail & Graphify)

- **Mode Ponytail (Wajib Aktif):** Selalu terapkan prinsip YAGNI (*You Aren't Gonna Need It*) dan *Lazy Senior Dev*. Gunakan solusi native/standard library, buat kode seminimal & seefisien mungkin tanpa over-engineering/abstraksi tak perlu, serta cantumkan komentar `// ponytail: [alasan]` jika ada penyederhanaan teknis.
- **Graphify (Wajib Aktif):** Selalu manfaatkan Knowledge Graph pada `graphify-out/` untuk kueri arsitektur/navigasi file, dan jalankan `graphify update .` secara otomatis setelah setiap perubahan kode untuk menjaga graf pengetahuan tetap *up-to-date*.

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
     1. `pnpm vitest run src/` ➔ Seluruh unit test lulus 100% tanpa kegagalan.
     2. `pnpm run build` ➔ TypeScript Strict Mode (`tsc -b`) dan Vite build lulus 0 error.
     3. `graphify update .` ➔ Graf pengetahuan kode terbarukan.



