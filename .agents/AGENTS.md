# 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO

Dokumen ini berisi aturan emas (*Golden Rules*) dan batasan teknis yang **WAJIB dipatuhi oleh AntiGravity AI tanpa pengecualian** dalam setiap sesi pengembangan proyek **SS_PDO**.

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
- Lakukan pembaruan token (*silent token refresh*) di latar belakang tanpa memaksa pengguna logout secara tiba-tiba.

---

## 🛠️ 4. Tooling & Paket Manager (Wajib PNPM)
- Selalu gunakan **`pnpm`** untuk semua instruksi install, add, remove, dan execution script (`pnpm install`, `pnpm add`, `pnpm run build`).
- Gunakan **`pnpm dlx`** sebagai pengganti `npx`.
- Selalu gunakan perintah Git Bash / zsh yang aman dan dapat dicopy-paste.

---

## 🎨 5. Standar UI/UX & Animasi Fluid (iOS Style)
- Terapkan animasi morphing dan transisi dengan kurva fisik pegas Apple: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Form Selector Rute & Tanggal:**
  - Menciut (*morph*) secara otomatis menjadi kapsul ringkas setelah data dimuat.
  - Pemicu (*trigger*) pembuka & penutup form bersifat dua arah (*bidirectional tap*) pada area header/kapsul tanpa tombol `[Ubah]` atau `[Tutup]` eksplisit yang mengganggu.
- **Highlight Card Target:**
  - Memberikan efek *glowing pulse* berdenyut selama **6 detik** saat unit bus di-tap dari daftar Keterangan.
- Sembunyikan scrollbar fisik pada container internal (`.no-scrollbar`).

---

## 💬 6. Komunikasi & Workflow Kerja
- Selalu gunakan **Bahasa Indonesia** yang sopan, profesional, dan mudah dimengerti.
- Sajikan ringkasan perubahan dalam format:
  1. Ringkasan Perubahan
  2. Daftar File yang Diubah
  3. Status Verifikasi & Build (`pnpm run build`)
