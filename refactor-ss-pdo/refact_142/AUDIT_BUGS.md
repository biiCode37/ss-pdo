# Audit & Bug Discovery Report — Refactor 142
## Fase 4: Modernisasi Antarmuka Modal Input Bus & Single Focus Mode

### Informasi Umum
- **ID Siklus Refactor:** `refact_142`
- **Fokus Utama:** Perombakan UI/UX antarmuka modal input armada (`BusInputModal`), navigasi tab segmented iOS, penyederhanaan text clutter & helper berlebih, penguatan kontras Light/Dark mode, dan Single Focus Mode.
- **Branch:** `devmode`
- **Tanggal:** 2026-10-18

---

### Temuan Permasalahan & Inefisiensi Antarmuka (Clutter & Ergonomi)

| ID | Lokasi Kode | Keparahan | Deskripsi Masalah | Dampak Pengguna | Rekomendasi Solusi |
|---|---|---|---|---|---|
| **F4-01** | `src/components/busCard/modal/BusInputModalTabs.tsx` | Medium | Tab selector saat ini menggunakan tombol grid datar tanpa container terpadu, menimbulkan visual disconnected dan teks "Shift 1" & "Shift 2" di-hardcode langsung di JSX (melanggar aturan SS_PDO). | Tampilan terlihat kuno/kaku di ponsel dan berpotensi inkonsistensi teks multibahasa. | Ubah menjadi iOS-style segmented pill container terpadu dengan border radius modern, dan pindahkan string tab ke kamus `TEXT_ALERTS.BUS_INPUT_MODAL`. |
| **F4-02** | `src/components/busCard/modal/singleFocus/singleFocusStyles.ts` | High | Fallback warna teks di `singleFocusStyles.ts` menggunakan nilai hardcoded gelap (`#171717`) untuk `--text-primary` di dalam modal yang berlatar gelap (`#171717`). | Di tema gelap/dark mode, teks label atau input single focus berisiko tidak terbaca (hitam di atas gelap). | Gunakan CSS variables adaptif (`var(--text-primary, #ededed)`) yang aman di kedua tema. |
| **F4-03** | `src/components/busCard/modal/BusInputModalHeader.tsx` | Low | Tombol switch (Semua Kolom / Mode Fokus) dan tombol Satset memiliki radius dan padding inkonsisten serta kontras tombol di Light Mode kurang tajam. | UI terasa kurang refined dan tombol aksi di header kurang ergonomis saat di-tap. | Selaraskan tombol dengan standar micro-capsule pill (`borderRadius: 10px` / `34px` round), gunakan border semantik, dan tingkatkan kontras. |
| **F4-04** | `src/components/busCard/modal/BusInputModalTrip.tsx` | Low | Menggunakan elemen `<input>` mentah dengan styling manual alih-alih memanfaatkan `BusFormField` yang sudah terstandarisasi. | Inkonsistensi visual, radius, padding, dan penanganan focus antarkomponen modal. | Migrasikan input trip pergi & pulang ke `BusFormField` terpadu dengan visualisasi kartu ritase PP yang elegan. |
| **F4-05** | `src/components/busCard/modal/BusInputModalShift1.tsx` & `BusInputModalShift2.tsx` | Medium | Card indikator selisih odometer dan banner acuan KM masih memiliki teks helper bertumpuk dan tombol aksi acuan KM yang kurang compact pada layar sempit. | Form terasa penuh/berjejal (cluttered) di mobile, mendorong tombol simpan terlalu jauh ke bawah. | Padatkan layout baris acuan KM dan live selisih KM dengan visual badge tajam dan pangkas teks bertele-tele. |
