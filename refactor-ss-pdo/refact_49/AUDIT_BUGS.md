# Audit Temuan Refact 49: Dekomposisi Kartu Armada Bus `BusCard.tsx` (~670 baris)

Dokumen audit ini mencatat analisis arsitektural dan dekomposisi terhadap komponen inti kartu armada `src/components/BusCard.tsx` yang menangani operasi kritis pengisian data bus, kalkulasi metriks ritase & capaian target, penguncian status shift, validasi unit non-SGO (OFF/TO), deteksi tabrakan sel spreadsheet (conflict resolution), dan sinkronisasi antrean offline.

---

## 1. Daftar Temuan Masalah & Risiko Arsitektur

### REF49-ARCH-001: God File `src/components/BusCard.tsx` (670 baris)

- **Lokasi Kode**: `src/components/BusCard.tsx` (670 baris)
- **Tingkat Keparahan**: **HIGH** (Complexity & Cognitive Overhead)
- **Deskripsi Masalah**:
  Satu komponen kartu bus memegang beragam tanggung jawab arsitektural yang saling bercampur:
  1. Pengelolaan state lokal formulir data operasional bus (`formData`), status pemuatan (`isLoading`), dan status penyimpanan (`saveStatus`).
  2. Logika pembaruan optimistik seketika (*0 ms UI latency*), navigasi mode satset (`onSaveAndNext`), deteksi tabrakan data sel dengan remote sheet (`getBusRowData`), pemanggilan dialog resolusi konflik (`showQueueConflictDialog`), penggabungan data konflik (`mergeRemoteBusDataWithLocalUpdates`), dan penyimpanan data ke Google Sheets (`updateBusData`).
  3. Penanganan kesalahan jaringan dan penyimpanan aman ke antrean offline IndexedDB (`addToQueue`, `isNetworkError`).
  4. Parsing keterangan shift (`splitShiftKeterangan`), kalkulasi status relevan shift 1 atau 2, penguncian kartu belum konfirmasi (`isShiftConfirmed === false`), dan proteksi pemblokiran input untuk unit non-SGO (`OFF`, `TO EVDAL`, `BA`).
  5. Kalkulasi rumus operasional bus: kalkulasi total TOA (TOA S1 / Total TOA), total PNP (+ Manual S1/S2), total jarak tempuh (KM S1 + S2), target ritase (Pergi/Pulang), evaluasi defisit ritase, dan ketidakseimbangan ritase (*imbalanced trip*).
  6. Presentasi visual: badge unit status (🔒 Belum Konfirmasi, OFF, T.O), status queued ("Menunggu Sinyal"), tombol shortcut modal trip interaktif, badge kolom spesifik aktif, indikator kendala (laka/mogok/rusak/batal), dan catatan rincian bus di footer (`FormattedNoteText`).
- **Dampak User & Pengembang**:
  - Berkas yang terlalu panjang membuat kode sulit dibaca dan dirawat.
  - Perubahan pada formula kalkulasi summary atau logika modal rawan merusak alur penyimpanan data atau deteksi konflik sel.
  - Terdapat beberapa string antarmuka yang masih ditulis langsung (*hardcoded*) pada nama kolom manual (`Manual S1`, `Manual S2`) dan badge belum konfirmasi (`🔒 Belum Konfirmasi`).
- **Mitigasi**:
  Dekomposisi menjadi submodul mandiri di folder `src/components/busCard/`:
  - `types.ts`: Interface tipe `BusCardProps`.
  - `busCardStyles.ts`: Helper fungsi `getBusCardStyles` untuk visual hierarchy status stripe (kendala, warning, achieved, locked).
  - `useBusCardSave.ts`: Hook untuk state `formData`, optimistik update, remote save, deteksi konflik, dan penanganan antrean offline.
  - `useBusCardModal.ts`: Hook untuk evaluasi shift aktif, guard status armada belum konfirmasi, proteksi non-SGO, dan pembuka modal input.
  - `BusCardSummary.tsx`: Subkomponen presentasi visual ringkasan metriks trip, KM, PNP, atau badge kolom aktif di header kartu.
  - `index.ts`: Barrel export terpusat.
  - `BusCard.tsx`: Dirampingkan menjadi komponen orchestrator bersih **~157 baris** (penurunan -513 baris kode / 76%) dengan kompatibilitas penuh 100% (*Zero Breaking Change*).
  - Pemindahan string antarmuka ke kamus sentral `src/constants/texts/text_dashboard.ts` dan penambahan unit test verifikasi pada `texts.test.ts`.
