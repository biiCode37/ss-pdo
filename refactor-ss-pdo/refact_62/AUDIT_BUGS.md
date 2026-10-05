# Audit Bugs Report - Refactor 62 (Transformasi Pemblokir Status Armada Menjadi Soft Reminder)

Dokumen audit dan evaluasi teknis terhadap alur pemblokiran input spreadsheet saat status armada belum dikonfirmasi oleh pengguna.

---

### Daftar Temuan Masalah & Analisis Risiko

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi Masalah | Dampak Pengguna | Mitigasi Solusi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-62-01** | `src/components/busCard/useBusCardModal.ts` | **High** | Modal input bus (`BusInputModal`) diblokir keras (*hard-block*) ketika `isShiftConfirmed === false`, memunculkan warning toast dan langsung membuka modal status armada secara paksa. | Di jam sibuk operasional pos rute (pergantian shift), petugas lapangan yang perlu mencatat data riil ritase/KM pramudi secara cepat terhambat dan frustrasi karena antarmuka menolak interaksi input. | Hapus pemblokir keras di `useBusCardModal.ts`, izinkan modal input tetap dapat dibuka dan diisi, serta tampilkan banner pengingat lembut (*soft reminder*) di dalam modal input. |
| **BUG-62-02** | `src/components/busList/useBulkOperations.ts` | **Medium** | Operasi massal seperti *Set Target Trip* dan *Bulk Copy KM Shift 1 ke Shift 2* terblokir total jika status armada shift belum dikonfirmasi. | Pengawas tidak dapat melakukan penyesuaian target trip atau menyalin KM S1 secara cepat sebelum seluruh status armada 1 rute selesai ditetapkan. | Hapus kondisi pemblokir `if (isShiftConfirmed === false)` pada `handleOpenBulkTripModal` dan `handleBulkCopyKmS1`, sehingga aksi massal tetap dapat dieksekusi secara mulus. |
| **BUG-62-03** | `src/components/busCard/BusCard.tsx`, `src/index.css`, `src/constants/texts/` | **Low** | Kartu unit bus memiliki tampilan badge gembok `🔒 Belum Konfirmasi` dan gaya CSS `opacity: 0.72` yang memberi kesan elemen sedang *disabled* (mati/tidak dapat diklik). | Pengguna mengira aplikasi macet atau rusak karena kartu bus tampak redup dan terkunci. | Ganti badge menjadi `⚠️ Belum Konfirmasi`, hilangkan efek `opacity: 0.72` agar kartu tetap jelas dan interaktif dengan aksen batas amber peringatan, serta perbarui kamus teks antarmuka di `text_fleet_status.ts` dan `text_dashboard.ts`. |
