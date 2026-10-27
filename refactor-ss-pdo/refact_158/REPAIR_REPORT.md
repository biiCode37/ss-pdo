# REPAIR REPORT — REFACTOR 158
**Tanggal:** 25 Oktober 2026  
**Fokus:** Multi-Day Ingestion Rate Limiting (HTTP 429) & Period Progress Labeling Transparency

---

## 1. Implementasi Perbaikan

### 1.1 Kamus Teks Sentral & Labeling Transparan Progress Rentang Tanggal (BUG-158-01)
- Menambahkan fungsi template kamus teks di `src/constants/texts/text_monitoring.ts`:
  - `PROGRESS_COUNT_SINGLE: (cur: number, total: number) => `${cur} / ${total} Rute``
  - `PROGRESS_COUNT_RANGE: (cur: number, total: number, routes: number, days: number) => `${cur} / ${total} Laporan (${routes} Rute × ${days} Hari)``
- Menambahkan properti `totalDays?: number` dan `totalRoutes?: number` pada antarmuka `IngestionProgress` di `src/services/regionalIngestionService.ts`.
- Memperbarui komponen `src/components/monitoring/IngestionProgressModal.tsx` agar secara cerdas menyajikan format label yang transparan dan kontekstual.

### 1.2 Pacing, Throttling, & Pengurangan Konkurensi Batch (BUG-158-02)
- Pada `src/services/regionalIngestionService.ts`:
  - Mengurangi ukuran konkurensi chunk dari 4 rute menjadi 2 rute per batch.
  - Memperpanjang jeda napas antar-batch menjadi 1.000 ms (1 detik).
  - Menambahkan jeda antar-hari sebesar 1.200 ms (1,2 detik) pada perulangan rentang multi-hari.
  - Menyelaraskan perhitungan `processedCount` agar proporsional saat rute berstatus `submitted`/`verified` dilewati (*skipped*).

### 1.3 Auto-Retry Exponential Backoff pada Transport Google Sheets Proxy (BUG-158-02)
- Pada `src/services/googleSheets/transport.ts`:
  - Mengimplementasikan helper `invokeProxyWithRetry` yang mendeteksi respons `429`, `Too Many Requests`, atau error kuota Google.
  - Melakukan penundaan eksponensial (1,5 detik $\rightarrow$ 3 detik $\rightarrow$ 6 detik) dengan batas 3 kali percobaan sebelum melempar galat.

---

## 2. Before vs After

| Aspek | Before (Sebelum Refactor 158) | After (Setelah Refactor 158) |
| :--- | :--- | :--- |
| **Label Modal Sinkronisasi Mingguan** | Menampilkan teks ambigu `44 / 126 Rute` yang menimbulkan kesan data rusak / duplikat. | Menampilkan teks transparan `44 / 126 Laporan (18 Rute × 7 Hari)`. |
| **Konkurensi Request Ingestion** | 4 rute paralel sekaligus tanpa jeda napas yang memadai (250 ms antar chunk, 0 ms antar hari). | 2 rute paralel dengan jeda napas 1.000 ms antar batch dan 1.200 ms antar hari (laju stabil di bawah 40 req/menit). |
| **Resistensi terhadap HTTP 429** | Langsung gagal total saat terkena batas kuota Google Sheets API. | Kebal dari kegagalan instan dengan mekanisme *Exponential Backoff Auto-Retry* (1,5s -> 3s -> 6s). |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Superadmin Menjalankan Sinkronisasi Mingguan (7 Hari)
- **Kondisi:** Superadmin membuka tab Mingguan di halaman Monitoring Wilayah dan menekan tombol "Tarik Mingguan".
- **Before:** Modal menampilkan "X / 126 Rute". Di tengah proses (data ke-44), request menabrak kuota Google 60 req/menit, melempar HTTP 429, dan proses gagal.
- **After:** Modal menampilkan "X / 126 Laporan (18 Rute × 7 Hari)". Sistem menarik data dengan laju terkendali dan melakukan auto-retry halus bila kuota mendekati batas, menyelesaikan seluruh 126 target hingga 100% tuntas.
