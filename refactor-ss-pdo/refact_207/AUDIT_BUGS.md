# AUDIT TEMUAN SET TRIP UNIT TERPILIH: REFACTOR 207
**Modul:** Input SS (`BusList`, `BusListControlBar`, `BusCard`, `useBulkOperations`, `bulkModals`)
**Fokus Masalah:** Setelah Plotting dihapus (refact_206), Input SS hanya bisa menerapkan trip ke **semua unit** (Set Jumlah Trip) atau **satu per satu** (kartu unit). Fitur pilih-banyak-unit yang dulu ada di Plotting dibutuhkan di Input SS.

---

### ID Temuan: BUG-SEL-207-01
- **Lokasi Kode:** `src/components/busList/useBulkOperations.ts` (`handleOpenBulkTripModal`), `BusListControlBar.tsx`
- **Keparahan:** Medium (celah alur kerja harian, bukan kerusakan data)
- **Deskripsi:** Tidak ada cara menerapkan trip pergi/pulang ke sebagian unit sekaligus.
- **Dampak User:** Saat 4 dari 20 unit punya trip berbeda, PDO harus membuka 4 kartu satu per satu (4x modal, 4x simpan, 4 request).
- **Mitigasi:** Mode "Pilih" di bar kontrol + bar aksi "Set Trip Terpilih" yang memakai modal Set Jumlah Trip yang sama, 1 request batch untuk semua unit terpilih.

### ID Temuan: BUG-SEL-207-02
- **Lokasi Kode:** `src/components/busList/useBulkOperations.ts` (`handleApplyTripToSelected`)
- **Keparahan:** Medium (risiko salah isi unit OFF)
- **Deskripsi:** Unit berketerangan OFF/TO EVDAL bisa ikut terpilih karena salah ketuk.
- **Dampak User:** Unit OFF terisi trip → dianggap beroperasi dan merusak rekap.
- **Mitigasi:** Unit OFF/TO EVDAL dilewati (tidak diubah) dengan pemberitahuan jumlahnya; jika semua terpilih OFF, tidak ada yang dikirim.

### ID Temuan: BUG-SEL-207-03
- **Lokasi Kode:** `src/components/busList/useBulkOperations.ts` (`targetTrip`, `bulkPergi/bulkPulang`)
- **Keparahan:** Low (warna kartu)
- **Deskripsi:** Jika isian unit terpilih ikut mengganti target rute, unit lain yang sudah sesuai target lama akan tampil "di bawah target".
- **Dampak User:** 16 unit 8/8 tiba-tiba kuning setelah 4 unit diisi 7/8.
- **Mitigasi:** Set Trip Terpilih tidak mengubah `bulkPergi/bulkPulang` (target rute tetap dari Set Jumlah Trip).
