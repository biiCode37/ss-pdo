# Spesifikasi Desain: Penanganan Unit Tidak Beroperasi (Ritase 0/Kosong) pada Input SS & Plotting
**Tanggal:** 03 November 2026  
**Status:** Approved by User  
**Terkait:** `src/components/busCard/`, `src/components/busList/`, `src/components/plotting/`

---

## 1. Latar Belakang & Prinsip Utama (*Golden Rule*)

Unit armada yang tidak beroperasi pada hari operasional memiliki karakteristik khusus:
1. **Penentu Mutlak (*Single Source of Truth*):** Nilai/angka pada kolom ritase.
   - Jika ritase **= 0 atau kosong**, unit tersebut mutlak berstatus **tidak beroperasi**.
   - Kolom keterangan bukan penentu utama, melainkan informasi pendukung.
2. **Kriteria Keterangan Pendukung:**
   - Keterangan non-operasi: murni `"OFF"`, `"LIBUR"`, `"NP"`, `"NP1"`.
   - **Pengecualian Mutlak (*Strict Whitelist*):** `"TO"`, `"T.O"`, `"TO EVDAL"`, `"T.O EVDAL"` **BUKAN** unit tidak beroperasi (karena unit bisa jadi pagi hari TO namun siang hari jalan kembali / OKB / RENOP, atau sebaliknya). Jika ritasenya > 0, unit tetap beroperasi normal.

---

## 2. Fitur & Perilaku Sistem yang Disepakati

### A. Kunci Proteksi Input Angka & Banner Ramah Non-Teknis (Modal Input SS)
Jika petugas secara sengaja membuka modal kartu bus yang ritasenya = 0 / kosong / berstatus non-operasi:
1. **Proteksi Kolom Angka:**
   - Seluruh input angka (Trip Pergi/Pulang, KM Awal/Akhir S1 & S2, TOA S1 & S2 / Total TOA) dikunci sementara (*read-only / disabled*).
   - Kolom **Keterangan** tetap aktif dan dapat diedit secara normal.
2. **Banner Ramah Non-Teknis (2 Skenario):**
   - **Skenario 1 (Ritase 0/Kosong & Keterangan Kosong/Bukan OFF-Libur):**
     > *"Unit tidak memiliki target Ritase (Tidak Beroperasi) - Hanya kolom Keterangan yang dapat diedit/diisi."*
   - **Skenario 2 (Ritase 0/Kosong & Keterangan murni = "OFF" atau "LIBUR"):**
     > *"Unit tidak memiliki target Ritase dan berstatus "OFF (Libur)" - Hanya kolom Keterangan yang dapat diedit/diisi."*
3. **Tombol Pembuka Kunci `[ 🔓 Aktifkan Input ]` & Pembersihan Keterangan:**
   - Menekan tombol ini menampilkan prompt/dialog pengisian ritase.
   - Setelah ritase diisi (> 0):
     - Seluruh kolom angka terbuka normal kembali (*unlocked*).
     - **Pembersihan Keterangan Otomatis:** Jika kolom keterangan unit tersebut **hanya bernilai murni `"OFF"` atau `"LIBUR"`**, maka nilai tersebut **wajib dihapus/dibersihkan** menjadi kosong di aplikasi dan pada spreadsheet SSOT. Selain nilai `"OFF"` atau `"LIBUR"` (seperti `"BA.02"`, `"BOCOR"`, dll), catatan tetap dipertahankan.

### B. Auto-Skip pada Mode Satset (Input SS)
- Saat **Mode Satset = ON**:
  - Modal form **tidak akan pernah membuka unit yang ritasenya = 0 / kosong / berstatus non-operasi**, melainkan langsung meluncur ke unit operasi berikutnya yang masih perlu diisi.
  - Berlaku pada mode input "Semua Kolom" maupun mode input "Fokus per kolom".

### C. Pengelompokan Otomatis ke Bawah (*Auto-Park to Bottom*)
- **Di Halaman Input SS (`BusList.tsx`):** Unit operasi berada di atas, unit dengan ritase = 0 / kosong otomatis berkumpul di kelompok paling bawah.
- **Di Halaman Plotting (`DailyPlottingPage.tsx`):** Unit yang siap jalan berada di atas, unit dengan target ritase = 0 / status OFF otomatis berada di urutan terbawah pangkalan.

### D. Eksklusi Nomor Urutan (*Zero Sequence for Non-Operational Units*)
- Nomor urutan (1, 2, 3... N) **HANYA** diberikan kepada unit yang beroperasi.
- Unit dengan ritase = 0 / kosong / OFF **TIDAK MENDAPATKAN NOMOR URUT** (badge nomor urut disembunyikan atau menampilkan status non-operasi `-` / `OFF`, tanpa memakan angka antrean jalan).
