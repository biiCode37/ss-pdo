# REPAIR REPORT: SKIP UNIT BERKETERANGAN PADA FITUR SALIN SEMUA KM S1 (REFACTOR 16)

Dokumen ini mencatat implementasi perbaikan, perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `COPY-16-01`.

---

## 1. Implementasi & Detail Solusi

### A. Fungsi Filter Mandiri & Reusable (`src/utils/keteranganUtils.ts`)
- Dibuat fungsi utilitas teruji `filterBusesForKmCopy(buses)`:
  - Memeriksa ketersediaan `kmAkhir1` (tidak kosong/undefined).
  - Memeriksa kolom `keterangan`: jika terisi nilai (misal `OFF`, `BA.01`, `Bantex`, `Laka`, `Mogok`), unit tersebut **otomatis dilewati** (*skipped*).
  - Mengembalikan objek `{ eligibleBuses, skippedWithNotesCount }` dalam satu kali iterasi efisien O(N).

### B. Penyempurnaan Logika & UI Toolbar Salin KM (`src/components/BusList.tsx`)
- Menggantikan penyaringan ad-hoc sebelumnya dengan `filterBusesForKmCopy(data)`.
- Jumlah unit yang siap disalin di toolbar kontrol kini merefleksikan hanya unit yang valid:
  - Teks toolbar: `${availableKmS1Buses.length} unit siap disalin`.
  - Jika terdapat unit yang memiliki catatan keterangan: ditampilkan informasi peringatan halus `(${skippedWithNotesCount} berketerangan dilewati)`.
- Jika seluruh unit yang memiliki KM Akhir S1 memiliki keterangan (misal semua unit yang ada catatan kendala), tombol dinonaktifkan dan toast menampilkan penjelasan yang ramah.
- Pesan sukses `showSuccessToast` mengonfirmasi jumlah unit yang disalin serta jumlah unit berketerangan yang berhasil dilewati.

### C. Transparansi Modal Dialog SweetAlert2 (`src/utils/alertUtils.ts`)
- Menambahkan opsi `skippedWithNotesCount` pada `BulkCopyKmModalOptions`.
- Menampilkan kotak pemberitahuan peringatan ter-sanitasi anti-XSS (`escapeHtml`) di dalam modal:
  `⚠️ N unit bus dilewati secara otomatis karena memiliki nilai pada kolom keterangan.`

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Kriteria Unit Disalin** | Hanya mengecek apakah `kmAkhir1` terisi, tanpa memedulikan kolom keterangan. | Wajib memiliki `kmAkhir1` **DAN** kolom keterangan kosong (`!b.keterangan`). |
| **Armada Bermasalah / OFF** | Unit mogok / OFF yang sempat jalan di S1 tetap disalin KM-nya ke KM Awal S2. | Unit dengan keterangan apa pun otomatis **dilewati (di-skip)** tanpa merusak data S2. |
| **Transparansi UI Toolbar** | Hanya menampilkan `N unit punya KM Akhir S1`. | Menampilkan `N unit siap disalin (M berketerangan dilewati)`. |
| **Modal Konfirmasi** | Tidak ada informasi tentang unit yang berketerangan. | Menampilkan banner peringatan jumlah unit berketerangan yang otomatis dilewati. |
| **Pesan Sukses** | Menyebutkan seluruh unit tanpa rincian skip. | Mengonfirmasi jumlah unit tersalin dan jumlah unit yang dilewati. |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan: Salin KM Pergantian Shift Rute JAK.115
- **Kondisi:**
  - Pukul 13:00 pergantian Shift 1 ke Shift 2.
  - Terdapat 12 armada:
    - 10 armada jalan normal dan telah mengisi KM Akhir Shift 1.
    - 1 armada (`TS-05`) mogok mesin pukul 11:30 dan memiliki KM Akhir S1 `45.200`, dengan keterangan `BA.01 Mogok transmisi (OFF S2)`.
    - 1 armada (`TS-09`) diganti armada cadangan dengan keterangan `Bantex TS-99`.
- **Sebelum Perbaikan:**
  - Petugas menekan "Salin Semua KM S1".
  - Sistem menyalin nilai KM Akhir S1 untuk ke-12 unit termasuk `TS-05` dan `TS-09`.
  - Akibatnya, `TS-05` yang sedang diderek ke bengkel tercatat memiliki `KM Awal S2: 45.200`, menimbulkan kebingungan pengawas operasional malam seolah-olah bus tersebut jalan di Shift 2.
- **Sesudah Perbaikan:**
  - Toolbar menampilkan: `10 unit siap disalin (2 berketerangan dilewati)`.
  - Petugas menekan tombol, modal menegaskan: `⚠️ 2 unit bus dilewati secara otomatis karena memiliki nilai pada kolom keterangan.`
  - Hanya 10 armada sehat yang diperbarui KM Awal Shift 2-nya.
  - Data operasional `TS-05` dan `TS-09` tetap bersih dan terjaga integritasnya.
