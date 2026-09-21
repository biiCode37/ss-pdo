# 📋 Audit Bugs: Refactor 69 — Daily Fleet Status Architecture & Decoupling from Google Sheets

Dokumen audit ini mendokumentasikan temuan arsitektural dan keterbatasan sistem lama pada penentuan status armada harian (`Tentukan Status Armada`) per shift.

---

## Daftar Temuan Masalah & Keterbatasan

### BUG-69-01: Keterikatan Status Armada Langsung ke Google Sheets (`keterangan`) Menimbulkan Konflik Data
- **Lokasi Kode:** `src/components/dashboard/FleetStatusModal.tsx` (lama) & `src/services/googleSheets/`.
- **Keparahan:** 🔴 Kritis (High / Data Integrity Risk & Concurrency Conflict).
- **Deskripsi:** Pada implementasi sebelumnya, penentuan status armada (seperti SGO, TO, OFF, SO) ditulis langsung ke kolom `keterangan` di Google Sheets bersamaan dengan entri ritase bus. Hal ini menyebabkan risiko penimpaan (overwrite) catatan teknis bus, perlambatan response time akibat API rate limit Google Sheets, serta tidak adanya struktur riwayat harian per shift yang terisolasi.
- **Dampak User:** Jika dua pengawas melakukan update atau jika sheet sedang dibuka/diedit di spreadsheet asli, terjadi race condition dan potensi hilangnya catatan operasional lapangan.
- **Mitigasi:** Pisahkan persistensi status armada sepenuhnya ke database Supabase (Zero-Touch Google Sheets). Google Sheets hanya fokus sebagai SSOT data ritase bus, sedangkan status armada harian per shift disimpan di tabel relasional Supabase (`fleet_statuses`, `daily_fleet_shifts`, `daily_fleet_non_sgo_units`).

---

### BUG-69-02: Tidak Adanya Skema Header Agregat Shift & Detail Unit Non-SGO (Inefisiensi Penyimpanan SGO)
- **Lokasi Kode:** Skema database lama & logic kalkulasi dashboard.
- **Keparahan:** 🟡 Sedang (Medium / Scalability & Redundancy).
- **Deskripsi:** Mayoritas armada (misal 20-25 unit) berstatus SGO (Siap Guna Operasi). Jika setiap unit SGO dicatat sebagai baris detail individu di database, tabel membengkak secara masif dengan ribuan baris redundan tanpa informasi tambahan.
- **Dampak User:** Kueri performa melambat seiring bertambahnya hari operasional.
- **Mitigasi:** Gunakan skema *Hybrid 2 Tingkat*. Unit SGO cukup dicatat sebagai angka agregat (`sgo_count` & `realops`) di tabel header `daily_fleet_shifts`. Hanya unit non-SGO (TO, OFF, SO, dll) yang membutuhkan pelacakan spesifik nomor body bus (`unit_body`) dan catatan teknis di tabel detail `daily_fleet_non_sgo_units`.

---

### BUG-69-03: Ketiadaan Status Kunci (Locking Mechanism) Berpotensi Mengubah Data Lampau
- **Lokasi Kode:** `src/components/dashboard/FleetStatusModal.tsx`.
- **Keparahan:** 🟡 Sedang (Medium / Audit Trail Risk).
- **Deskripsi:** Status armada dapat diubah kapan saja tanpa penanda apakah shift tersebut telah resmi dikonfirmasi/dikunci oleh pengawas piket. Hal ini berpotensi mengubah data status historis saat shift sudah selesai.
- **Dampak User:** Laporan PDO dan pemantauan 18 rute menjadi inkonsisten antara waktu operasional pagi/malam dengan rekap akhir.
- **Mitigasi:** Tambahkan flag `is_confirmed`, `user_id` (foreign key ke `user_profiles.id`), dan `confirmed_at` pada header shift. Setelah pengawas mengonfirmasi status armada di awal shift, modal terkunci (*read-only*) dengan badge gembok terkunci, dan hanya bisa dibuka jika ada hak supervisi khusus.
