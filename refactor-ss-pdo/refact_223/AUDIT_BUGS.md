# AUDIT TEMUAN KELENGKAPAN DATA & KONFIRMASI SIAP KIRIM: REFACTOR 223
**Modul:** Monitoring 18 Rute (tab baru Siap Kirim), `sheet-sync-webhook`, Edge Function `route-confirmation`, `daily_route_reports`, `route_submission_confirmations`
**Fokus Masalah:** Korlap/korwil wajib mengirim file SS 18 rute ke admin pusat setiap malam (>22.00). Mereka sering ditegur karena data tidak lengkap atau janggal (ritase terisi tapi TOA kosong, atau sebaliknya), tetapi aplikasi hanya menampilkan angka capaian. Selain itu, halaman Monitoring masih ditutup untuk korlap karena kekhawatiran kuota Supabase.
**Spesifikasi:** `docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md` · **Rencana:** `docs/superpowers/plans/2026-11-07-kelengkapan-siap-kirim.md`

---

### ID Temuan: BUG-SUB-223-01
- **Lokasi Kode:** `src/components/monitoring/` (tidak ada fitur kelengkapan), `sheet-sync-webhook` (data per unit dibuang setelah diringkas)
- **Keparahan:** High (kebutuhan operasional utama tidak terlayani)
- **Deskripsi:** Webhook sudah membaca semua baris unit di setiap edit sheet, tetapi informasi "unit mana yang belum lengkap" tidak disimpan. Korlap harus membuka 18 file satu per satu untuk memeriksa ritase dan TOA sebelum pengiriman malam.
- **Dampak User:** Data tidak lengkap atau janggal lolos terkirim ke pusat; korlap ditegur atasan.
- **Mitigasi:** Hitung kelengkapan per unit di webhook (fungsi murni bersama `_shared/completeness.ts`), simpan sebagai ringkasan JSON kecil di `daily_route_reports.completeness`, dan tampilkan di tab baru Siap Kirim.

### ID Temuan: BUG-SUB-223-02
- **Lokasi Kode:** Proses pengiriman laporan harian (di luar aplikasi)
- **Keparahan:** Medium (tidak ada jejak audit)
- **Deskripsi:** Tidak ada catatan siapa yang memastikan rute siap dikirim, kapan, dan apakah dikirim dalam keadaan tidak lengkap.
- **Dampak User:** Saat ada teguran, korlap tidak punya bukti bahwa kekurangan sudah diketahui beserta alasannya.
- **Mitigasi:** Tabel `route_submission_confirmations` (anon hanya baca) dan Edge Function `route-confirmation`. Fungsi ini memverifikasi sesi proxy dan hak akses halaman, mewajibkan alasan bila masih ada masalah, dan mengambil jumlah masalah serta fingerprint dari server. Ada tanda "berubah setelah dikonfirmasi".

### ID Temuan: BUG-QUOTA-223-03
- **Lokasi Kode:** `src/components/monitoring/AllRouteMonitoringPage.tsx` (efek Realtime refact_200)
- **Keparahan:** High (risiko kuota Log Ingestion 1 GB bila Monitoring dibuka korlap)
- **Deskripsi:** Setiap edit sheet memicu muat ulang otomatis Monitoring (≤1×/menit, ±5 request dan ±77 KB per muat). Satu layar yang terbuka bisa mencapai ±300 request/jam. Data capaian juga dimuat walau tab yang dibuka tidak membutuhkannya.
- **Dampak User:** Monitoring tidak aman dibuka untuk korlap/PJ.
- **Mitigasi:** Tab Siap Kirim (default) memakai 3 request saat dibuka dan memperbarui tampilan dari payload Realtime tanpa request. Data capaian dimuat hanya bila dibutuhkan. Event Realtime di tab capaian hanya memunculkan banner "Ada pembaruan data".

### ID Temuan: BUG-SUB-223-04
- **Lokasi Kode:** `src/services/dailyRouteReportService.ts` (`upsertDailyRouteReport`), dipanggil `QuickKorlapFleetModal` dan `A2ReportModal` dengan `...existingReport`
- **Keparahan:** Medium (data baru tertimpa nilai basi)
- **Deskripsi:** Kedua modal men-spread seluruh baris laporan lama (`select('*')`) lalu meng-upsert ulang. Setelah kolom `completeness` ada, alur ini akan menimpa kelengkapan terbaru dari webhook dengan nilai lama.
- **Dampak User:** Status kelengkapan dan tanda "berubah" bisa salah setelah korlap menyimpan status armada.
- **Mitigasi:** `upsertDailyRouteReport` membuang field `completeness` dari payload klien (1 perbaikan di kode bersama + test).

### ID Temuan: BUG-UI-223-05
- **Lokasi Kode:** `AllRouteMonitoringPage.tsx` → `MonitoringHeader` (`loading`/`refreshing`)
- **Keparahan:** Medium (ditemukan saat verifikasi browser)
- **Deskripsi:** State `loading` data capaian bernilai `true` sejak awal dan tidak pernah selesai di tab Siap Kirim (karena data capaian sengaja tidak dimuat), sehingga tombol Perbarui Data, Load All, dan pemilih periode terkunci.
- **Dampak User:** Korlap tidak bisa memuat ulang status kelengkapan dari header.
- **Mitigasi:** Header menerima `loading`/`refreshing` hanya bila data capaian dibutuhkan (`needsRegionalData`).

### ID Temuan: BUG-DATE-223-06
- **Lokasi Kode:** `AllRouteMonitoringPage.tsx` (`todayStr = new Date().toISOString()`)
- **Keparahan:** Low
- **Deskripsi:** Tanggal default Monitoring memakai UTC, sehingga pukul 00.00–07.00 WIB masih menunjukkan tanggal kemarin.
- **Mitigasi:** Memakai `getWibTodayString()`.

## Observasi Lain (tidak diperbaiki di refact ini)
- Banner "Mode Pratinjau Superadmin" melebar 391 px di layar 375 px dan menyebabkan scroll horizontal (khusus superadmin saat halaman nonaktif).
- Kolom `completeness` masih bisa ditulis anon lewat policy `FOR ALL` lama di `daily_route_reports` (follow-up 6 tabel publik). Akibatnya jumlah masalah yang dicatat server bisa dimanipulasi oleh pemegang anon key.
