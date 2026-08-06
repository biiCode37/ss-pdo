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

## 📌 8. Kebijakan Commit Git (Hindari Over-Commit)

- **Aturan Emas:** Dilarang melakukan `git commit` untuk perubahan-perubahan kecil / mikro (seperti tweaking spacing, penyesuaian teks kecil, ganti warna/padding, dll).
- Kumpulkan beberapa perubahan kecil dalam satu sesi/fitur sebelum melakukan commit agar riwayat commit Git tetap rapi, bersih, dan tidak terlalu banyak.
- Lakukan `git commit` hanya jika fitur utama telah selesai, ada milestone penting, atau diminta langsung oleh User.


