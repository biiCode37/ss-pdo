# 📋 Audit Bugs: Refactor 66 — False-Positive Conflict & Scoped Data Integrity

Dokumen audit ini mencatat temuan bug tabrakan data palsu (*false-positive conflict*), asimetri skema pembacaan spreadsheet, dan *over-broad payload* pada mode fokus tunggal (*single column focus*) di aplikasi SS_PDO.

---

## Daftar Temuan Bug

### BUG-66-01: Asimetri Kolom `toaShift2` Hilang pada `getBusRowData`
- **Lokasi Kode:** `src/services/googleSheets/core.ts` (baris ~439-451).
- **Keparahan:** 🔴 Kritis (High / Data Integrity Breakdown).
- **Deskripsi:** Fungsi `getBusRowData` yang digunakan untuk verifikasi integritas data sebelum menyimpan ke Google Sheets tidak memetakan/mengembalikan field `toaShift2`. Akibatnya, `remoteData['toaShift2']` selalu bernilai `undefined` (ternormalisasi jadi `""`), sementara data lokal awal yang dimuat aplikasi (`bus['toaShift2']`) memiliki nilai minimal default `'0'`.
- **Dampak User:** Perbandingan `"" !== "0"` selalu menghasilkan nilai `true` pada setiap kali simpan, memicu pop-up tabrakan data (conflict) secara terus-menerus pada seluruh armada bus.
- **Mitigasi:** Tambahkan pembacaan `toaShift2: getValue(headerMap.toaShift2)` pada `getBusRowData` dan pastikan fallback penanganannya identik dengan `fetchSheetData`. Pastikan juga penulisan `updateBulkBusData` di `mutations.ts` mendukung pembaruan `toaShift2` jika kolomnya ada di header spreadsheet.

---

### BUG-66-02: Pengecekan Konflik Membabi Buta Tanpa Memeriksa *Dirty Fields*
- **Lokasi Kode:** `src/components/busCard/useBusCardSave.ts` (baris ~102-112).
- **Keparahan:** 🔴 Kritis (High / False Conflict Blocker).
- **Deskripsi:** Kode `useBusCardSave` melakukan iterasi pada seluruh kunci di objek `updates` dan langsung menandai `hasCollision = true` jika ada selisih antara `remoteData[field]` dan `bus[field]`. Kode ini sama sekali tidak memeriksa apakah pengguna sebenarnya mengubah field tersebut atau tidak (`updates[field] !== bus[field]`).
- **Dampak User:** Jika ada formula otomatis di spreadsheet (seperti `totalToa`) atau ada rekan pengawas lain yang mengubah kolom `keterangan`, petugas lapangan yang sedang menginput `KM Awal S1` akan langsung terblokir oleh dialog tabrakan data palsu, padahal kolom KM tidak disentuh oleh siapapun di spreadsheet.
- **Mitigasi:** Terapkan prinsip Optimistic Concurrency Control (OCC) murni dengan mengecek hanya *dirty fields* (`normalizeFieldValue(updates[field]) !== normalizeFieldValue(bus[field])`), dan hanya memicu konflik jika server juga berubah dengan nilai yang berbeda (`Three-Way Collision Rule`).

---

### BUG-66-03: *Over-Broad Payload* pada Penginputan Mode Fokus Tunggal
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts` (baris ~688-707).
- **Keparahan:** 🟡 Sedang (Medium / Scope Leak).
- **Deskripsi:** Ketika modal berada dalam Mode Fokus (`isSingleMode === true`), misalnya hanya menginput `KM Awal S1`, fungsi `handleSubmit` tetap mengemas ke-12 kolom armada ke dalam objek `updates`.
- **Dampak User:** Field-field yang tidak dibuka atau tidak disentuh pengguna ikut terkirim ke handler simpan, memperluas cakupan pengecekan konflik dan meningkatkan risiko menimpa data di kolom lain secara tidak disengaja.
- **Mitigasi:** Bangun objek `updates` secara selektif (*scoped payload*): jika dalam mode fokus, masukkan hanya field utama yang menjadi target aktif (misal `kmAwal1`) dan sub-field yang dibuka pengguna secara eksplisit melalui chip.

---

### BUG-66-04: Redaksi Teks Peringatan Konflik Tidak Kontekstual Saat Online
- **Lokasi Kode:** `src/utils/alertUtils.ts` (`showQueueConflictDialog`) & `src/constants/texts/text_alerts.ts`.
- **Keparahan:** 🟢 Rendah (Low / UX Confusion).
- **Deskripsi:** Teks SweetAlert2 menampilkan pesan *"Data unit {unit} di Google Sheets telah berubah saat Anda offline"*, padahal pengguna sedang menyimpan data dalam kondisi online aktif.
- **Dampak User:** Pengguna di lapangan kebingungan dan merasa aplikasi bermasalah atau koneksi internet terputus.
- **Mitigasi:** Bedakan pesan dialog untuk kondisi online (`TEXT_ALERTS.CONFLICT_ONLINE`) dan offline (`TEXT_ALERTS.CONFLICT_OFFLINE`), serta sajikan bahasa non-teknis yang ramah dan menenangkan bagi pengguna.
