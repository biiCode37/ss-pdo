# 🛠️ Repair Report: Refactor 66 — False-Positive Conflict & Scoped Data Integrity

Dokumen ini adalah laporan perbaikan formal siklus **Refactor 66** untuk mengatasi bug tabrakan data palsu (*false-positive conflict*), asimetri skema pembacaan spreadsheet, dan *over-broad payload* pada aplikasi SS_PDO berdasarkan dokumen acuan [`docs/DATA_INTEGRITY_AND_CONFLICT_RESOLUTION.md`](../../docs/DATA_INTEGRITY_AND_CONFLICT_RESOLUTION.md).

---

## 1. Ringkasan Implementasi

| No | ID Temuan | Komponen / File | Solusi & Implementasi | Status |
|:--:|---|---|---|:--:|
| 1 | **BUG-66-01** | `src/services/googleSheets/core.ts` & `mutations.ts` | Menambahkan pembacaan `toaShift2` dan kalkulasi fallback simetris di `getBusRowData`, serta dukungan penulisan `toaShift2` di `updateBulkBusData`. | ✅ Selesai |
| 2 | **BUG-66-02** | `src/components/busCard/useBusCardSave.ts` | Menerapkan Optimistic Concurrency Control (OCC) murni dengan Three-Way Collision Rule pada *dirty fields* saja (`Mine !== Base && Theirs !== Base && Theirs !== Mine`). | ✅ Selesai |
| 3 | **BUG-66-03** | `src/components/busCard/modal/useBusInputForm.ts` | Mengimplementasikan Scoped Updates pada Mode Fokus tunggal (hanya mengirim kolom aktif dan chip yang dibuka user). | ✅ Selesai |
| 4 | **BUG-66-04** | `src/constants/texts/text_alerts.ts` & `src/utils/alertUtils.ts` | Menambahkan kamus `CONFLICT_ONLINE` untuk dialog online tanpa kata "saat Anda offline", serta sanitasi `escapeHtml`. | ✅ Selesai |

---

## 2. Before vs After Perbaikan

### A. Pembacaan Baris Spreadsheet (`getBusRowData`)
- **Before:** Kolom `toaShift2` tidak dipetakan dalam objek pengembalian sehingga selalu `undefined`. Di sisi lain, aplikasi menginisialisasi `bus.toaShift2` dengan `'0'`. Normalisasi menghasilkan `"" !== "0"`, sehingga setiap kali simpan memicu tabrakan data palsu.
- **After:** `getBusRowData` membaca `headerMap.toaShift2`, melakukan kalkulasi fallback `totalToa - toaShift1` jika diperlukan, dan memberikan fallback default `'0'`, sehingga simetris 100% dengan `fetchSheetData`.

### B. Evaluasi Tabrakan Data (`useBusCardSave.ts`)
- **Before:** Mengiterasi seluruh kunci di `updates` dan langsung menyatakan `hasCollision = true` jika `remoteData[field] !== bus[field]`, tanpa peduli apakah user mengubah kolom tersebut atau tidak.
- **After:** Mengekstraksi *dirty fields* (`normalizeFieldValue(updates[field]) !== normalizeFieldValue(bus[field])`). Evaluasi tabrakan data hanya dijalankan pada kolom yang diubah user dan hanya berstatus konflik jika nilai di server juga berubah DARI baseline lokal DAN berbeda dengan nilai baru user (Three-Way Collision Rule).

### C. Payload Penginputan Mode Fokus (`useBusInputForm.ts`)
- **Before:** Menekan Simpan di Mode Fokus selalu mengirim ke-12 kolom armada.
- **After:** Objek `updates` dibangun secara selektif (*scoped payload*): hanya menyertakan kolom yang sedang difokuskan (misal `kmAwal1`) dan sub-field yang dibuka secara eksplisit melalui chip (`kmAkhir1` atau `keterangan`).

### D. Redaksional Dialog SweetAlert2 (`TEXT_ALERTS.CONFLICT_ONLINE`)
- **Before:** Teks modal bertuliskan *"Data unit {unit} di Google Sheets telah berubah saat Anda offline"*, membuat petugas yang online kebingungan.
- **After:** Teks modal dipisahkan: untuk penyimpanan online menggunakan judul *"Data Spreadsheet Telah Berubah"* dan teks *"Data unit {unit} di Google Sheets baru saja diperbarui oleh pihak lain. Apakah Anda ingin menimpa perubahan tersebut atau menggabungkannya dengan data server?"*.

---

## 3. Case: Skenario Lapangan (Field Test Verification)

### Skenario 1: Petugas Menginput KM Awal S1 di Pagi Hari (Kondisi Lapangan Nyata)
- **Kasus:** Pukul 05.15 WIB di halte, petugas membuka unit `KWK 222171` pada mode fokus untuk menginput `KM Awal Shift 1`. Di Google Sheets asli baris tersebut masih kosong murni.
- **Sebelum Perbaikan:** Saat menekan **Simpan**, mendadak muncul modal SweetAlert2 merah/hijau *"Tabrakan Data (Conflict) - Data telah berubah saat Anda offline"*.
- **Setelah Perbaikan:** Payload hanya mengirim `{ kmAwal1: "300100" }`. Tidak ada deteksi tabrakan data palsu. Data langsung tersimpan mulus ke Google Sheets dalam hitungan milidetik.

### Skenario 2: Rekan Pengawas di Kantor Mengisi Catatan / Formula Lain di Spreadsheet
- **Kasus:** Saat petugas di lapangan sedang membuka form KM, pengawas di kantor mengisi catatan `"BA.01"` di kolom Keterangan atau rumus `totalToa` terhitung di spreadsheet.
- **Sebelum Perbaikan:** Petugas di lapangan terblokir oleh dialog tabrakan data palsu karena kolom Keterangan/totalToa berbeda.
- **Setelah Perbaikan:** Sistem mengenali petugas hanya mengubah `kmAwal1`. Kolom Keterangan dan totalToa tidak dianggap *dirty field*. Penyimpanan KM berhasil tanpa menimpa catatan pengawas dan tanpa alert palsu.

### Skenario 3: Tabrakan Data Riil (Dua Petugas Menginput Kolom yang Sama Bersamaan)
- **Kasus:** Petugas A dan Petugas B bersamaan menginput KM Awal unit yang sama dengan angka berbeda (`300100` vs `300200`).
- **Hasil:** Sistem mendeteksi `300200 !== ""` dan `300200 !== 300100`. Dialog konflik muncul dengan teks kontekstual online yang ramah, memberikan pilihan apakah ingin menimpa atau menggunakan data server terbaru.

### Skenario 4: Idempotent Match (Input Angka yang Identik)
- **Kasus:** Petugas A dan Petugas B sama-sama menginput `300100`. Petugas B menyimpan 1 detik lebih awal.
- **Hasil:** Sistem mengenali nilai server (`300100`) sudah identik dengan input Petugas A (`300100`). Penyimpanan dinyatakan sukses tanpa menampilkan dialog konflik yang mengganggu.

---

## 4. Hasil Verifikasi & Quality Gates

1. **Vitest Unit Test:**
   - Command: `pnpm vitest run src/`
   - Hasil: **62 file tes lolos 100% (457 passed, 0 failed)**.
2. **TypeScript Strict & Vite Build:**
   - Command: `pnpm run build`
   - Hasil: **Lolos 0 error (Built in 2.75s)**.
3. **Graphify Knowledge Graph:**
   - Command: `graphify update .`
   - Hasil: **317 file terindeks, graf pengetahuan terbarukan**.
