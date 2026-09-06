# AUDIT BUGS: SALIN SEMUA KM S1 MENYALIN UNIT DENGAN KETERANGAN (REFACTOR 16)

Dokumen ini mendokumentasikan temuan audit fungsionalitas dan integritas data terkait fitur "Salin Semua KM S1" di aplikasi SS_PDO.

---

## 1. COPY-16-01: Fitur Salin Semua KM S1 Tidak Mengecualikan Unit dengan Catatan/Keterangan

- **ID Temuan:** `COPY-16-01`
- **Lokasi Kode:**
  - `src/components/BusList.tsx` (baris 159–205)
  - `src/utils/alertUtils.ts` (baris 403–440)
- **Keparahan:** **HIGH** (Integritas Operasional & Risiko Penulisan Data Salah)
- **Deskripsi Masalah:**
  1. **Kurangnya Filter Kolom Keterangan pada `availableKmS1Buses`:**
     Sebelumnya, `availableKmS1Buses` hanya mengecek apakah suatu unit memiliki `kmAkhir1`:
     ```ts
     const availableKmS1Buses = useMemo(() => {
       return data.filter(
         (b) =>
           b.kmAkhir1 !== undefined &&
           b.kmAkhir1 !== null &&
           String(b.kmAkhir1).trim() !== "",
       );
     }, [data]);
     ```
  2. **Dampak terhadap Operasional:**
     Unit armada yang memiliki nilai pada kolom `keterangan` (seperti `OFF`, `Bantex`, `Laka`, `Mogok`, `Perbaikan Bengkel`, `Tukar Unit`) adalah armada yang mengalami kendala operasional, beroperasi sebagian, atau bahkan tidak beroperasi di Shift 2.
     Ketika tombol "Salin Semua KM S1" dijalankan, KM Akhir Shift 1 dari unit bermasalah tersebut tetap disalin secara masal ke KM Awal Shift 2. Hal ini mengakibatkan data Shift 2 unit yang mogok/OFF terisi angka KM seolah-olah armada siap beroperasi normal di Shift 2, merusak konsistensi Berita Acara (BA) dan pelaporan harian.
- **Mitigasi Terencana:**
  1. Di `src/components/BusList.tsx`:
     - Filter `availableKmS1Buses` agar secara tegas mengecualikan unit yang kolom keterangannya memiliki nilai (`!b.keterangan || String(b.keterangan).trim() === ""`).
     - Hitung `skippedWithNotesCount` (jumlah unit yang memiliki KM S1 tetapi memiliki catatan keterangan sehingga otomatis dilewati).
     - Teruskan `skippedWithNotesCount` ke modal dialog `showBulkCopyKmModal`.
     - Tampilkan pesan sukses yang informatif bahwa unit berketerangan otomatis dilewati.
  2. Di `src/utils/alertUtils.ts`:
     - Tambahkan `skippedWithNotesCount?: number` pada `BulkCopyKmModalOptions`.
     - Tampilkan catatan informasi transparan pada modal: `*(Unit yang memiliki catatan/keterangan sebanyak N unit otomatis dilewati).*`
