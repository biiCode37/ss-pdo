# Audit Temuan Refact 52: Dekomposisi Modal Informasi Login & Akses Google `LoginInfoModal.tsx` (~525 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen modal informasi aplikasi dan transparansi izin akses Google Spreadsheet `src/components/login/LoginInfoModal.tsx`.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF52-ARCH-001: God File `src/components/login/LoginInfoModal.tsx` (525 baris)

- **Lokasi Kode**: `src/components/login/LoginInfoModal.tsx` (525 baris)
- **Tingkat Keparahan**: **MEDIUM** (Maintainability & Clean Architecture)
- **Deskripsi Masalah**:
  Komponen modal informasi login memuat beragam bagian statis dan interaktif yang digabungkan dalam satu berkas monolitik:
  1. Handle bar sentuh atas dan header modal informasi dengan tombol penutup.
  2. Blok pengenalan aplikasi PUSM (PDO Utara Spreadsheet Mobile) beserta 3 highlight fitur operasional mikrotrans.
  3. Blok komparasi 3 pilar: perbandingan kenyamanan antarmuka satu tangan pada HP, keamanan rumus/sel data, serta rekapitulasi akumulasi otomatis lintas periode dibandingkan spreadsheet biasa.
  4. Blok transparansi izin akses Google Spreadsheet dengan mekanisme toggle interaktif untuk melihat rincian cakupan izin OAuth dan enkripsi Google.
  5. Tombol aksi penutup di bagian bawah.
  6. Terdapat beberapa teks antarmuka yang belum tercatat pada kamus sentral `src/constants/texts/text_auth.ts`.
- **Dampak User & Pengembang**:
  - Ukuran berkas 525 baris membuat pemeliharaan informasi bantuan dan penyelarasan teks legal/keamanan Google menjadi rumit.
  - Belum tersedianya suite pengujian unit mandiri untuk modal informasi login ini.
- **Mitigasi**:
  Dekomposisi menjadi subkomponen mandiri di folder `src/components/login/`:
  - `LoginInfoHeader.tsx`: Komponen pull handle bar, ikon info, judul modal, dan tombol close.
  - `LoginInfoAboutSection.tsx`: Komponen pengenalan aplikasi dan kartu highlight fitur operasional.
  - `LoginInfoComparisonSection.tsx`: Komponen kartu komparasi 3 aspek PUSM vs spreadsheet biasa di HP.
  - `LoginInfoPermissionsSection.tsx`: Komponen transparansi izin OAuth Google dan toggle rincian cakupan izin.
  - `LoginInfoModal.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~86 baris** (penurunan -439 baris kode / 84%) dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
  - Pendaftaran entri teks baru `INFO_MODAL_TITLE`, `INFO_MODAL_CLOSE`, `VIEW_PERMISSIONS_DETAIL`, dan `HIDE_PERMISSIONS_DETAIL` ke dalam `src/constants/texts/text_auth.ts`.
  - Pembuatan unit test komprehensif `src/components/login/LoginInfoModal.test.tsx` (4 tests).
