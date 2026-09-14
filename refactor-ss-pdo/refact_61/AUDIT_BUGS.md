# Audit Bugs Report - Refactor 61 (Monitoring Wilayah & Generator Laporan WA v2)

Dokumentasi temuan audit dan evaluasi teknis pada modul Monitoring Wilayah 18 Rute dan Generator Laporan WhatsApp Dinas.

---

### Daftar Temuan Masalah & Analisis Risiko

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi Masalah | Dampak Pengguna | Mitigasi Solusi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-61-01** | `src/utils/waReportGenerator.ts`, `src/constants/texts/text_wa_report.ts` | **Medium** | Terdapat karakter tabulasi liar (`\t`) dan tanda kutip ganda pada template laporan WA Format 1 & 2. Di layar ponsel Android/iOS, karakter tab dirender dengan lebar bervariasi sehingga teks berantakan dan baris pecah. | Format laporan dinas resmi yang dibagikan ke grup pimpinan Transjakarta terlihat tidak rapi dan sulit dibaca. | Hapus seluruh karakter `\t`, terapkan monospace code block (```) terstruktur dengan *column padding* presisi spasi tetap (`padStart` / `padEnd`). |
| **BUG-61-02** | `src/services/allRouteMonitoringService.ts` | **High** | Beban kueri komputasi tinggi pada pembacaan 18 rute lintas 3 tanggal (H, H-1, H-7) karena mengandalkan kalkulasi agregasi *on-the-fly* dari ribuan baris `daily_unit_summaries`. | Halaman Monitoring Wilayah dan Modal Generator WA mengalami latensi pemuatan yang lambat saat data unit semakin membengkak. | Perkaya skema tabel `daily_route_reports` dengan 8 kolom capaian harian (`toa_shift1`, `manual_shift1`, `toa_shift2`, `manual_shift2`, `total_passengers`, `total_km`, `achievement_km`, `total_trip`, `last_synced_at`) sebagai *fast-lane read*, dengan fallback otomatis ke *unit summaries*. |
| **BUG-61-03** | `src/services/googleSheets/`, `src/components/monitoring/` | **High** | Belum ada integrasi dengan Spreadsheet Capaian Global Wilayah (18 rute). Pengawas harus menyinkronkan 18 rute secara individual. | Pengawas wilayah menghabiskan waktu 20–30 menit setiap malam hanya untuk merekap capaian 18 rute ke sistem. | Bangun modul `globalReportReader.ts` dan fungsi sinkronisasi massal 1-klik `syncRegionalDailyFromGlobalSheet`, terintegrasi dengan modal dialog modern di halaman monitoring wilayah. |
