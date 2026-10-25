# Audit Temuan: Penyesuaian Nomenklatur Subheader Unit Libur/Keterangan Khusus & Mitigasi ERR_QUIC_PROTOCOL_ERROR (Refactor 162)

## Ringkasan Eksekutif
Berdasarkan hasil tangkapan layar operasional dan laporan pengguna pada antarmuka Report Studio WhatsApp (Format 3 Kesiapan Armada):
1. Terdapat ketidaksesuaian label subheader `*Unit Libur (OFF):*`. Di bawah subheader tersebut, daftar unit yang tampil tidak hanya mencakup unit yang berstatus "LIBUR", melainkan juga memuat unit-unit yang memiliki catatan/keterangan operasional khusus (seperti *"KWK 1811 : BA.02 BEARING RODA DEPAN KANAN RUSAK / OKB"*). Hal ini membuat judul subheader terkesan keliru jika hanya melabeli unit-unit tersebut sebagai "Unit Libur (OFF)".
2. Pada console browser DevTools, muncul galat jaringan berwarna merah:
   `GET https://swjttmsnzogsykmtwys.supabase.co/rest/v1/daily_route_reports?... net::ERR_QUIC_PROTOCOL_ERROR 200 (OK)`
   Meskipun status dari server adalah `200 (OK)`, transfer data protokol QUIC (HTTP/3 UDP) terputus di tengah jalan akibat fluktuasi jaringan / packet loss soket browser.

---

## Temuan Masalah & Analisis Risiko

### 1. BUG-162-01: Label Subheader Format 3 Terlalu Sempit Mengabaikan Unit Berketerangan Khusus
- **Lokasi:**
  - `src/constants/texts/text_wa_report.ts` (`FORMAT_3_OFF_SUBHEADER`)
  - `src/utils/waReportGenerator.ts` (baris 350–365)
- **Keparahan:** Medium (Kejelasan Komunikasi Operasional WhatsApp)
- **Deskripsi:**
  Subheader laporan kesiapan armada saat ini secara kaku tertulis `*Unit Libur (OFF):*`. Ketika terdapat unit non-operasional yang membawa catatan teknis/BA.02/kerusakan, unit tersebut ikut dicantumkan di bawah subheader ini, sehingga menimbulkan kebingungan bagi pimpinan operasional yang membaca laporan seolah unit rusak tersebut sedang "libur".
- **Dampak User:**
  Pimpinan atau manajemen yang membaca pesan WhatsApp mengira seluruh unit dalam daftar tersebut adalah jadwal libur reguler, padahal ada unit yang mengalami kendala teknis atau catatan khusus.
- **Mitigasi:**
  Memperbarui token sentral `TEXT_WA_REPORT.TEMPLATE.FORMAT_3_OFF_SUBHEADER` menjadi `"*Unit Libur (OFF) / Keterangan Khusus:*"` dan menyentralisasi seluruh subheader Format 3 ke dalam modul kamus teks (`text_wa_report.ts`).

### 2. BUG-162-02: Ketiadaan Retry Otomatis pada Fetch `daily_route_reports` Saat Terjadi Blip QUIC
- **Lokasi:** `src/services/allRouteMonitoringService.ts` (baris 227–237)
- **Keparahan:** Medium (Ketahanan Jaringan Klien)
- **Deskripsi:**
  Permintaan `supabase.from('daily_route_reports').select('*').in('date', ...)` mengandalkan satu kali eksekusi tanpa mekanisme *retry* mandiri. Jika koneksi UDP QUIC (HTTP/3) browser mengalami *packet loss* atau gangguan soket lokal (`ERR_QUIC_PROTOCOL_ERROR`), data laporan 3 tanggal (H, H-1, H-7) berisiko gagal dimuat dan jatuh ke array kosong.
- **Dampak User:**
  Pada kondisi jaringan seluler yang tidak stabil di lapangan, dashboard monitoring wilayah dapat menampilkan metrik kosong sesaat jika terjadi drop koneksi QUIC.
- **Mitigasi:**
  Menerapkan *resilient retry loop* (2 upaya dengan jeda 350ms) pada pemanggilan Supabase `daily_route_reports`, sehingga browser otomatis melakukan *fallback* ke TCP HTTP/2 secara transparan dan data tetap berhasil dimuat.
