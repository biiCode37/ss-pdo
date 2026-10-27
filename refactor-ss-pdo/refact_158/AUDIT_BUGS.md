# AUDIT BUGS — REFACTOR 158
**Tanggal:** 25 Oktober 2026  
**Fokus:** Multi-Day Ingestion Rate Limiting (HTTP 429) & Period Progress Labeling Transparency

---

### Temuan Audit

#### BUG-158-01: Ambigu Penamaan Progress Bar Rentang Tanggal ("126 Rute")
- **Lokasi Kode:** `src/components/monitoring/IngestionProgressModal.tsx` (baris 221) & `src/services/regionalIngestionService.ts` (baris 489)
- **Keparahan:** Sedang (UX & Mental Model Confusion)
- **Deskripsi:** Pada saat melakukan sinkronisasi rentang mingguan (7 hari) untuk 18 rute aktif, sistem menghitung total tugas sebagai $18 \times 7 = 126$ target penarikan data harian. Namun, modal progress menampilkan label teks mentah: `{processedCount} / {totalToSync} Rute` (`44 / 126 Rute`).
- **Dampak User:** Pengguna pimpinan/superadmin/korwil terkejut dan bingung karena aplikasi hanya mengelola 18 rute Mikrotrans aktif, sehingga teks "126 Rute" tampak aneh dan seperti data rusak / duplikat.
- **Mitigasi:**
  1. Menambahkan metadata rentang `totalDays` dan `totalRoutes` pada `IngestionProgress`.
  2. Menambahkan kamus teks sentral pada `TEXT_MONITORING.INGESTION`:
     `PROGRESS_COUNT_RANGE: (cur, total, routes, days) => `${cur} / ${total} Laporan (${routes} Rute × ${days} Hari)``.
  3. Memperbarui `IngestionProgressModal.tsx` agar menyajikan format label yang transparan dan akurat.

---

#### BUG-158-02: HTTP 429 (Too Many Requests) Akibat Konkurensi Agresif Tanpa Throttling & Auto-Retry
- **Lokasi Kode:** `src/services/regionalIngestionService.ts` (baris 287–347 & 481–501) & `src/services/googleSheets/transport.ts` (baris 133–150)
- **Keparahan:** Tinggi (Operational Blocker / Batch Failure)
- **Deskripsi:** Google Cloud memberlakukan kuota ketat Google Sheets API v4 maksimal 60 request per menit per akun layanan (*Service Account*). Pada proses sinkronisasi rentang multi-hari, sistem mengeksekusi batching dengan ukuran chunk 4 rute paralel dengan jeda tidur hanya 250 milidetik antar chunk dan 0 milidetik antar hari. Dalam waktu kurang dari 30 detik, sistem menembakkan lebih dari 44 request HTTP berat secara bertubi-tubi ke Supabase Edge Function `sheets-proxy`, menyebabkan Google Sheets API memutus request dengan status HTTP `429 (Too Many Requests)`. Karena client tidak memiliki mekanisme retry bertahap (*exponential backoff*), seluruh penarikan sisa rute langsung gagal total.
- **Dampak User:** Proses sinkronisasi mingguan terhenti di tengah jalan (di sekitar 35% - 44 tugas), data rute-rute berikutnya tidak tersimpan ke database, dan konsol browser dipenuhi galat HTTP 429.
- **Mitigasi:**
  1. **Konkurensi Ramah Kuota (Pacing):** Mengurangi konkurensi menjadi 2 rute per chunk (bukan 4), dan memperpanjang jeda antar batch menjadi 1.000 ms serta jeda antar hari sebesar 1.200 ms.
  2. **Auto-Retry Exponential Backoff di Transport:** Membungkus pemanggilan proxy pada `src/services/googleSheets/transport.ts` dengan fungsi `invokeProxyWithRetry()` yang mendeteksi status 429 dan otomatis melakukan retry hingga 3 kali dengan penundaan eksponensial (1,5s -> 3s -> 6s).
  3. **Penanganan Retry Khusus di Tingkat Service:** Menambahkan fallback retry per rute sebelum menandai rute sebagai gagal membaca sheet.
