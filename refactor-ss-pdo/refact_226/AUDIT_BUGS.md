# AUDIT TEMUAN EDIT TAB TANGGAL LAMA TERCATAT KE TANGGAL HARI INI: REFACTOR 226
**Modul:** `supabase/functions/sheet-sync-webhook` (penentuan tanggal target), Apps Script master (`CentralizedMasterRealtimeSync.js`, tidak diubah)
**Fokus Masalah:** Uji tanda "Berubah setelah dikonfirmasi" (8 Nov 2026, ±01.25 WIB): pemilik mengubah TOA di tab "7" sheet JAK.115 sebanyak 3 kali, tetapi status 7 Nov tidak berubah.

---

### ID Temuan: BUG-SYNC-226-01
- **Lokasi Kode:** `sheet-sync-webhook/index.ts` (blok "Tentukan tanggal target")
- **Keparahan:** High (data lapangan tercatat ke tanggal yang salah)
- **Deskripsi:** Apps Script mengirim `{ routeCode, spreadsheetId, tabName }`, tetapi webhook hanya membaca `body.date`. Bila tidak ada, webhook memakai **tanggal hari ini (WIB)** dan membaca tab hari ini. Bukti: setelah edit tab "7" pukul 01.25–01.29 WIB, laporan JAK.115 **8 Nov** tersinkron pukul 18:29:05 UTC (tab "8" kosong → 30 unit belum diisi), sedangkan laporan **7 Nov** tetap pada sinkron terakhir 18:17:45 UTC.
- **Dampak User:**
  - Koreksi data kemarin yang dilakukan lewat tengah malam (pengiriman sering sekitar pukul 22.00–00.30) tidak tercatat.
  - Perbaikan tunggakan beberapa hari lalu tidak pernah memperbarui kelengkapan maupun angka capaian tanggal itu.
  - Tanda "Berubah setelah dikonfirmasi" tidak muncul.
  - Tidak terdeteksi selama ini karena edit di tab hari ini tetap benar, dan tombol "Cek ulang" di aplikasi mengirim tanggal eksplisit.
- **Mitigasi:** Fungsi murni `resolveSyncTargetDate` (`_shared/syncDate.ts`) menentukan tanggal dengan urutan: tanggal eksplisit > tab yang diedit (tahun/bulan diambil dari `route_sheets` berdasarkan `spreadsheetId`, di-cache 1 jam di memori fungsi) > hari ini WIB. Tab tidak valid atau tanggal yang tidak ada di bulan itu kembali ke perilaku lama.

## Catatan dampak
Perbaikan ini juga memengaruhi **angka capaian**: edit di sheet tanggal lama kini memperbarui laporan tanggal itu (sebelumnya tidak). Ini perilaku yang benar.
