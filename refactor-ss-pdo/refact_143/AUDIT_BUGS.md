# Audit & Bug Discovery Report — Refactor 143
## Fase 5: Modernisasi Antarmuka Modal Detail Armada (UnitDetailModal)

### Informasi Umum
- **ID Siklus Refactor:** `refact_143`
- **Fokus Utama:** Perombakan UI/UX antarmuka modal detail armada (`UnitDetailModal`), integrasi komponen kanonik `ModalShell`, pemadatan layout eksekutif ke 3-column glanceable strip, eliminasi redundansi manipulasi DOM swipe, dan penguatan kontras Light/Dark mode.
- **Branch:** `devmode`
- **Tanggal:** 2026-10-19

---

### Temuan Permasalahan & Inefisiensi Antarmuka (Clutter & Desain)

| ID | Lokasi Kode | Keparahan | Deskripsi Masalah | Dampak Pengguna | Rekomendasi Solusi |
|---|---|---|---|---|---|
| **F5-01** | `src/components/UnitDetailModal.tsx` | High | Menggunakan custom portal, event listener drag touch manual, dan manipulasi DOM `contentRef.current.style.transform` mentah alih-alih memanfaatkan `ModalShell` kanonik yang sudah ada di proyek. | Terjadi fragmentasi arsitektur modal, potensi tabrakan scroll-locking, dan inkonsistensi animasi back-navigation di perangkat mobile. | Migrasikan `UnitDetailModal` menggunakan `ModalShell` kanonik terpadu dengan transisi pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`. |
| **F5-02** | `src/components/UnitDetailModal.tsx` | Medium | Bagian akumulasi total (Row 2) menumpuk elemen baris secara vertikal (KM, Penumpang, Ritase, Tiket Manual) dengan font besar sehingga memakan ruang vertikal berlebih di layar ponsel (`min(88dvh, 760px)`). | Pengguna mobile harus menggulir (scroll) ke bawah hanya untuk melihat grafik tren harian dan catatan operasional. | Rampingkan akumulasi total ke dalam Glanceable 3-Column Metric Strip (`RITASE`, `TOTAL KM`, `PELANGGAN`) yang simetris dan terbaca seketika (*at-a-glance*). |
| **F5-03** | `src/components/UnitDetailModal.tsx` | Low | Tombol dismiss `X` dan container ikon unit menggunakan ukuran dan border yang tidak serasi dengan standar tombol modal Fase 4 (`BusInputModalHeader`). | UI terasa kurang refined dan tidak konsisten antarmodal di aplikasi. | Selaraskan tombol tutup dengan ukuran `34px`, border-radius `10px`, background adaptif `var(--input-bg)`, dan border `var(--card-border)`. |
| **F5-04** | `src/components/UnitDetailModal.tsx` | Low | Belum ada unit test otomatis yang menguji rendering metrik Shift 1, Shift 2, akumulasi total ritase PP, grafik tren, maupun dismissal pada `UnitDetailModal`. | Kurangnya perlindungan regresi pada fungsionalitas detail armada. | Buat file unit test `src/components/__tests__/UnitDetailModal.test.tsx` dengan cakupan skenario komprehensif. |
