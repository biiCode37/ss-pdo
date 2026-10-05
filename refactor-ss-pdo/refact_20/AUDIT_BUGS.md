# AUDIT BUGS: MODERN MOBILE-FIRST UI/UX REFINEMENT (REFACTOR 20)

Dokumen ini mencatat audit UI/UX pada halaman-halaman inti SS_PDO, mengidentifikasi kelemahan ergonomi seluler, layout jitter, target sentuh tombol kecil, serta hierarki status visual sebelum pelaksanaan perbaikan **Fase 1**.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **UI-20-01** | `src/components/BottomNav.tsx`<br>`src/index.css`<br>`src/constants/texts/text_dashboard.ts` | 🟡 **MEDIUM** (Mobile Ergonomics & Navigation Clarity) | Terselesaikan |
| **UI-20-02** | `src/index.css`<br>`src/components/BusCard.tsx`<br>`src/components/AnalyticsDashboard.tsx` | 🟢 **LOW** (Micro-jitter & Visual Polishing) | Terselesaikan |
| **UI-20-03** | `src/components/BusCard.tsx`<br>`src/index.css` | 🟡 **MEDIUM** (Operational Status Glanceability) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🟡 UI-20-01: Navigasi Bawah Ikon-Only Membingungkan & Target Sentuh Kecil di Bawah 44px

- **ID Temuan:** `UI-20-01`
- **Lokasi Kode:**
  - `src/components/BottomNav.tsx`
  - `src/index.css` (`.bottom-nav`, `.bottom-nav-item`, `.bus-card-badge-trip`)
  - `src/constants/texts/text_dashboard.ts`
- **Keparahan:** **MEDIUM** (Ergonomi Penggunaan Mobile Lapangan)
- **Deskripsi Masalah:**
  1. Bottom navigation bar sebelumnya hanya menampilkan 4 ikon tanpa teks sama sekali dengan sliding box statis (`width: calc(25% - 2px)`). Bagi petugas operasional lapangan yang baru atau sedang bekerja cepat di bawah terik matahari, membedakan antara ikon Dashboard Ringkasan (`BarChart3`) dan Armada Unit (`Bus`) membutuhkan waktu jeda kognitif.
  2. Tombol badge trip pada kartu unit bus (`.bus-card-badge-trip`) memiliki padding visual yang sangat kecil (`padding: 3px 8px`). Pada layar sentuh ponsel petugas lapangan, area hit sentuh ini berada jauh di bawah pedoman Apple HIG / Google Material Design (minimal 44px × 44px), sehingga rawan salah sentuh (*mis-tap*).
- **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas di halte/pool bus sering salah membuka tab navigasi dan kesulitan men-tap tombol trip bus saat jari bergerak cepat atau tangan bergetar di dalam armada bus.
- **Mitigasi:**
  - Ubah BottomNav menjadi **Expanding Pill Dock** bergaya iOS modern: hanya tab yang sedang aktif yang mengekspansi label teks pendeknya (`Input`, `Ringkasan`, `Armada`, `Menu`), sedangkan tab lain tetap berupa ikon yang bersih dan hemat tempat.
  - Perluas area sentuh efektif `.bus-card-badge-trip` menggunakan pseudo-element `::before` expander dengan min-height 44px tanpa mengorbankan kerapatan tata letak visual.

---

### 🟢 UI-20-02: Angka Metrik Bergetar Horizontal (Numeric Jitter) Saat Perubahan Nilai

- **ID Temuan:** `UI-20-02`
- **Lokasi Kode:**
  - `src/index.css`
  - `src/components/BusCard.tsx`
  - Seluruh komponen penampil angka metrik (KM, TOA, Ritase, Target)
- **Keparahan:** **LOW** (Visual Polish & Kestabilan Layout)
- **Deskripsi Masalah:**
  Font default browser menggunakan *proportional figures* di mana digit '1' memiliki lebar horizontal yang jauh lebih sempit dibanding digit '8' atau '0'. Saat petugas mengetikkan angka KM atau saat data diperbarui, teks metrik mengalami pergeseran lebar (*horizontal jitter*) yang membuat UI tampak tidak stabil dan murah.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Angka kilometer dan ritase tampak bergoyang ketika diisi atau diperbarui secara real-time, mengganggu kenyamanan pandangan mata petugas.
- **Mitigasi:**
  - Tambahkan utility CSS global `.tabular-nums` dan terapkan aturan `font-variant-numeric: tabular-nums` serta `-webkit-font-feature-settings: "tnum"` ke seluruh elemen metrik angka, input number, sel tabel, dan badge kartu bus.

---

### 🟡 UI-20-03: Ketiadaan Hierarki Status Visual Cepat pada Kartu Bus (`BusCard`)

- **ID Temuan:** `UI-20-03`
- **Lokasi Kode:**
  - `src/components/BusCard.tsx`
  - `src/index.css` (`.bus-card`)
- **Keparahan:** **MEDIUM** (Glanceability Status Operasional)
- **Deskripsi Masalah:**
  Semua kartu unit bus tampil dengan batas visual seragam tanpa diferensiasi warna tepi status. Petugas pengawas harus membaca baris keterangan yang panjang satu per satu untuk mengetahui armada mana yang sedang mogok, mengalami trouble laka, berstatus cadangan, atau sudah berhasil mencapai target ritase harian.
- **Dampak ke Pengguna Lapangan (User Impact):**
  Memperlambat proses audit cepat pengawas lapangan dalam memilah unit yang butuh perhatian khusus vs unit yang sudah beroperasi normal.
- **Mitigasi:**
  - Berikan border tepi kiri tebal (3.5px) pada setiap kartu bus dengan kode warna status:
    - **Merah (`.status-kendala`):** Jika terdapat kendala operasional (mogok, laka, perbaikan, trouble).
    - **Kuning (`.status-warning`):** Jika berstatus cadangan, BKO, atau ritase belum memenuhi target.
    - **Hijau (`.status-achieved`):** Jika target ritase pergi dan pulang telah terpenuhi atau terlampaui.
