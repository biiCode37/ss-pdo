# AUDIT BUGS: Perombakan Konsep UI Minimalis & Dashboard KPI Eksekutif (Fase 2)

## Informasi Refactor
- **ID Refactor:** `refact_140`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Domain:** Dashboard KPI Analytics, Executive Metric Card, Shift Comparison Visuals, Mobile-First UI/UX

---

## Daftar Temuan Masalah

### 1. BUG-140-01: Layout Kotak Bertingkat Kuno dan Hierarki Visual Rendah pada `KPICard`
- **Lokasi Kode:**
  - `src/components/KPICard.tsx` (baris 53–152)
  - `src/index.css` (baris 829–874)
- **Keparahan:** Medium (Kerapian Visual & Desain UI Eksekutif)
- **Deskripsi:**
  Kartu KPI analitik saat ini menampilkan 2 metrik atas dalam kotak terpisah (`.analytics-stat-box`) dan 2 metrik bawah dalam format daftar teks baris tipis berpemisah border (`.analytics-card > div`). Hierarki visual terpecah menjadi 2 pola berbeda tanpa kohesi, ukuran font metrik tidak seimbang, dan tidak memanfaatkan ruang kartu secara efisien pada layar mobile.
- **Dampak User:**
  Ringkasan data penting (Total KM, Penumpang, KM/Bus, Penumpang/KM) terasa seperti dashboard kuno/jadul, sulit dibaca dalam sekali pandang (*low glanceability*), dan membuang banyak ruang vertikal.
- **Mitigasi:**
  1. Merombak `KPICard` menjadi format *Executive 4-Grid Card* modern dengan layout simetris 2x2.
  2. Menggunakan label mikro elegan (9.5px, uppercase, letter-spacing tegas), angka berpresisi tinggi (`font-variant-numeric: tabular-nums`), dan badge aksen warna semantik (Emerald untuk KM, Teal untuk Penumpang, Sky untuk KM/Bus, Indigo untuk Penumpang/KM).
  3. Mempertahankan nilai angka desimal murni dari SSOT tanpa pembulatan sepihak (aturan emas SSOT).

---

### 2. BUG-140-02: Kurangnya Visualisasi Komparasi Relatif pada `ShiftComparisonCard`
- **Lokasi Kode:**
  - `src/components/ShiftComparisonCard.tsx` (baris 51–113)
  - `src/index.css` (baris 875–915)
- **Keparahan:** Medium (UX Analytics & Visual Insight)
- **Deskripsi:**
  Kartu komparasi shift saat ini hanya menyajikan dua kotak statis berdampingan berisi angka teks mentah (TOA, Manual, Total) tanpa indikasi visual proporsi beban kerja antar-shift. Pengguna harus menghitung secara manual perbandingan volume penumpang antara Shift 1 dan Shift 2.
- **Dampak User:**
  Petugas operasional dan pimpinan tidak mendapatkan *insight* seketika mengenai distribusi volume penumpang antara shift pagi/siang vs shift malam.
- **Mitigasi:**
  1. Menambahkan bar distribusi rasio penumpang visual yang elegan (proporsi Shift 1 vs Shift 2) di bagian atas kartu.
  2. Merapikan format data tabular dengan tipografi modern, pill indikator Sun (Surya/Siang) & Moon (Bulan/Malam), serta status kontras tinggi yang ramah Light Mode dan Dark Mode.

---

### 3. BUG-140-03: Kerapian dan Konsistensi Visual pada `CompletionStatusCard`
- **Lokasi Kode:**
  - `src/components/CompletionStatusCard.tsx` (baris 74–155)
- **Keparahan:** Low (Kerapian Visual & Polish)
- **Deskripsi:**
  Daftar catatan armada dengan kendala operasional pada `CompletionStatusCard` memiliki padding dan border radius yang kaku, serta badge unit hijau kontras tinggi yang kurang berpadu dengan tema gelap/terang modern.
- **Dampak User:**
  Tampilan kartu terasa kurang modern dibandingkan bahasa desain kartu bus minimalis yang baru saja diperbarui pada Fase 1.
- **Mitigasi:**
  1. Memodernisasi container list catatan dengan transisi halus, badge unit semi-transparan ber-border tipis, dan efek visual tap spring iOS.
  2. Memastikan seluruh teks merujuk ke kamus sentral `TEXT_DASHBOARD`.
