# Audit & Bug Discovery Report — Refactor 144
## Optimasi Fitur & Sheet Rekap Akumulasi Lintas Periode (AccumulationSheet & Banner)

### Informasi Umum
- **ID Siklus Refactor:** `refact_144`
- **Fokus Utama:** Modernisasi antarmuka modal pemilihan rentang akumulasi lintas periode (`AccumulationSheet`), migrasi ke `ModalShell` kanonik, penyelarasan layout dropdown periode, perapian preview badge, dan modernisasi banner mode akumulasi aktif (`BusListAccumulationBanner`).
- **Branch:** `devmode`
- **Tanggal:** 2026-10-19

---

### Temuan Permasalahan & Inefisiensi Antarmuka

| ID | Lokasi Kode | Keparahan | Deskripsi Masalah | Dampak Pengguna | Rekomendasi Solusi |
|---|---|---|---|---|---|
| **F6-01** | `src/components/accumulation/AccumulationSheet.tsx` | High | Menggunakan `createPortal` langsung ke `document.body` dengan touch swipe listener manual (`useAccumulationGesture`) yang memanipulasi DOM inline `style.transform` mentah alih-alih memanfaatkan `ModalShell` kanonik. | Fragmentasi arsitektur modal, potensi tabrakan scroll-locking, dan inkonsistensi animasi back-navigation mobile. | Migrasikan `AccumulationSheet` ke `ModalShell` kanonik terpadu dengan transisi pegas Apple `cubic-bezier(0.32, 0.72, 0, 1)`. |
| **F6-02** | `src/components/accumulation/AccumulationHeader.tsx` | Low | Tombol dismiss `X` menggunakan tombol tanpa styling outline/radius (`background: "none"`, `padding: "4px"`), tidak seragam dengan tombol modal Fase 4 (`BusInputModalHeader`) dan Fase 5 (`UnitDetailModal`). | Tampilan header terasa kurang refined dan target tap pada mobile terlalu kecil. | Selaraskan tombol tutup dengan ukuran `34px`, border-radius `10px`, background `var(--input-bg)`, dan border `var(--card-border)`. |
| **F6-03** | `src/components/accumulation/AccumulationPeriodSelector.tsx` | Medium | Pemilih periode "DARI" dan "SAMPAI" disusun dengan styling datar tanpa pemisah kartu visual yang jelas, sehingga pada layar ponsel sempit angka tanggal, bulan, dan tahun terasa berjejal. | Pengguna kesulitan membedakan batas tanggal awal dan tanggal akhir saat memilih rentang multi-bulan. | Bungkus periode "DARI" dan "SAMPAI" dalam kartu terpisah ber-radius `12px` dengan micro-badge aksen warna yang kontras. |
| **F6-04** | `src/components/accumulation/AccumulationFooter.tsx` | Low | Tombol "Terapkan Akumulasi Lintas Periode" dan "Kembali ke Mode Harian" masih menggunakan padding dan radius generik tanpa transisi modern. | Umpan balik visual saat tombol ditekan terasa kaku. | Modernisasi tombol dengan border-radius `12px`, feedback visual dinamis, dan teks preview rentang dalam pill badge yang elegan. |
| **F6-05** | `src/components/busList/BusListAccumulationBanner.tsx` | Low | Tombol "Kembali ke Harian ➔" menggunakan styling inline dengan kontras statis yang kurang adaptif di tema terang. | Tombol keluar dari mode akumulasi kurang ergonomis saat disentuh di lapangan. | Selaraskan banner dengan styling kapsul modern, border-radius `10px`, dan kontras tajam di Light/Dark mode. |
