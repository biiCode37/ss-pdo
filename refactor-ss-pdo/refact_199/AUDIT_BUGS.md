# AUDIT TEMUAN INTERAKSI & ERGONOMI: REFACTOR 199
**Modul:** Penanganan Unit Non-Operasional (Ritase = 0 / Kosong / OFF) pada Halaman Input SS & Halaman Plotting  
**Fokus Masalah:** Mode Satset Terbuka pada Bus Non-Operasi, Ketiadaan Proteksi Input Angka & Banner Informatif, Pengacakan Urutan & Pencemaran Nomor Antrean

---

### ID Temuan: BUG-NONOP-199-01
- **Lokasi Kode:** `src/components/bus/BusList.tsx` (`handleSaveAndNext`)
- **Keparahan:** High (Kelelahan Interaksi & Disrupsi Alur Satset)
- **Deskripsi:** Pada mode Satset aktif (alur otomatis meluncur ke unit berikutnya setelah simpan), aplikasi sebelumnya tetap membuka form modal untuk unit yang tidak beroperasi (ritase = 0, kosong, atau berstatus OFF). Padahal unit yang tidak beroperasi tidak memerlukan input ritase, KM, ataupun TOA.
- **Dampak User:** Petugas pengawas terpaksa menutup form atau mengklik batal berulang kali saat alur Satset berhenti di bus-bus yang libur/rusak, merusak esensi kecepatan alur kerja Satset.
- **Mitigasi:** Mengintegrasikan fungsi penentu status operasional `isUnitNonOperational` pada loop pencarian unit berikutnya di `handleSaveAndNext`. Unit non-operasional dilewati secara hening (*auto-skip*) sehingga alur Satset hanya meluncur ke armada operasional yang belum lengkap datanya.

---

### ID Temuan: BUG-NONOP-199-02
- **Lokasi Kode:** `src/components/bus/BusInputModal.tsx`, `src/hooks/useBusInputForm.ts`
- **Keparahan:** High (Risiko Integritas Data & Salah Input)
- **Deskripsi:** Jika petugas secara manual membuka kartu armada yang ritasenya 0 atau berstatus OFF (misal untuk mencatat memo di kolom keterangan), seluruh field input angka (Ritase Pergi/Pulang, KM Awal/Akhir Shift 1 & 2, TOA Shift 1 & 2 / Total TOA) tetap terbuka dan dapat diedit. Tidak ada banner penjelas yang memberi peringatan kontekstual bahwa bus tersebut sedang tidak beroperasi.
- **Dampak User:** Rawan terjadi ketidaksengajaan pengisian angka pada bus yang libur/rusak yang dapat merusak perhitungan rekapitulasi, akumulasi KM, dan target capaian rute harian.
- **Mitigasi:**
  1. Menerapkan proteksi input angka otomatis: seluruh elemen input numerik dinonaktifkan (`disabled`/`read-only`) secara default saat modal terbuka untuk unit non-operasional.
  2. Menampilkan Banner Informatif Ramah Non-Teknis di bagian atas form dengan 2 skenario teks spesifik:
     - Skenario A (Ritase 0 & Keterangan kosong): *"Unit tidak memiliki target Ritase (Tidak Beroperasi) — Hanya kolom Keterangan yang dapat diedit/diisi."*
     - Skenario B (Ritase 0 & Keterangan OFF/LIBUR): *"Unit tidak memiliki target Ritase dan berstatus 'OFF (Libur)' — Hanya kolom Keterangan yang dapat diedit/diisi."*
  3. Menyediakan tombol pembuka kunci `[ 🔓 Aktifkan Input ]` jika bus tersebut sewaktu-waktu mendadak beroperasi kembali di siang hari (OKB/RENOP). Dialog aktivasi mewajibkan pengisian target ritase (> 0), dan jika sebelumnya keterangan murni bernilai `"OFF"` atau `"LIBUR"`, nilai tersebut otomatis dibersihkan. Catatan selain OFF/LIBUR (seperti kode rute atau memo perbaikan) tetap dipertahankan.

---

### ID Temuan: BUG-NONOP-199-03
- **Lokasi Kode:** `src/components/plotting/DailyPlottingPage.tsx`, `src/components/plotting/PlottingUnitCard.tsx`, `src/components/bus/BusList.tsx`, `src/components/bus/BusCard.tsx`
- **Keparahan:** High (Pengacakan Operasional & Integritas Antrean)
- **Deskripsi:** Unit-unit yang tidak beroperasi tercampur di tengah-tengah urutan kartu bus operasional dan memakan jatah nomor antrean keberangkatan (misal Bus OFF mendapat nomor urut #3, sehingga bus jalan berikutnya melompat menjadi #4). Di halaman Plotting, tombol reorder panah tetap muncul pada unit OFF dan unit OFF ikut muncul di pilihan dropdown acuan reorder.
- **Dampak User:** Pengawas dan pramudi di terminal kebingungan menentukan urutan keberangkatan armada yang sebenarnya. Urutan antrean menjadi tidak berurutan dan mengaburkan armada siap jalan.
- **Mitigasi:**
  1. **Auto-Park to Bottom:** Unit non-operasional secara otomatis diposisikan di bagian paling bawah antrean pangkalan di Halaman Plotting maupun Halaman Input SS.
  2. **Eksklusi Nomor Urutan (Sequential 1..N):** Hanya unit yang beroperasi yang mendapatkan nomor urut `1..N`. Unit non-operasional diset ke `order: 0`, badge nomor urut pada Halaman Plotting diganti menjadi strip `-`, tombol panah reorder disembunyikan, dan pada kartu Input SS badge nomor urutan antrean disembunyikan sepenuhnya.
  3. **Pembersihan Dropdown Acuan:** Dropdown unit acuan pada `PlottingOrderModal` hanya menampilkan armada aktif yang memiliki nomor urut valid (`order > 0`).
  4. **Pengecualian Khusus Domain:** Unit dengan memo perbaikan sementara seperti `"TO"`, `"T.O"`, `"TO EVDAL"`, `"T.O EVDAL"` yang ritasenya > 0 tetap diperlakukan sebagai unit beroperasi (berpeluang jalan kembali OKB).
