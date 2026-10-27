# Laporan Perbaikan: Penyesuaian Nomenklatur Subheader Unit Libur/Keterangan Khusus & Mitigasi ERR_QUIC_PROTOCOL_ERROR (Refactor 162)

## Ringkasan Perbaikan
Refactor 162 menyelesaikan dua isu operasional yang dilaporkan oleh pengguna:
1. **Ketidaksesuaian Subheader WhatsApp Format 3:** Memperbarui label subheader dari `*Unit Libur (OFF):*` menjadi `*Unit Libur (OFF) / Keterangan Khusus:*` pada kamus sentral `TEXT_WA_REPORT.TEMPLATE.FORMAT_3_OFF_SUBHEADER`. Hal ini karena daftar unit yang tercantum di bawahnya tidak hanya unit yang libur terjadwal, melainkan juga memuat unit yang memiliki catatan/keterangan teknis khusus (misalnya: kendala BA.02, perbaikan bearing, dll.).
2. **Mitigasi `net::ERR_QUIC_PROTOCOL_ERROR 200 (OK)`:** Mengimplementasikan mekanisme *silent retry* pada pengambilan data `daily_route_reports` di `allRouteMonitoringService.ts` untuk memitigasi terputusnya soket UDP QUIC (HTTP/3) browser saat fluktuasi jaringan, sehingga bila percobaan pertama terkena drop QUIC, sistem langsung melakukan re-fetch secara transparan tanpa membuat tampilan dashboard kosong.

---

## Rincian Perubahan (Before vs After)

### 1. Kamus Teks Sentral Laporan WhatsApp (`src/constants/texts/text_wa_report.ts`)
- **Before:**
  ```ts
  FORMAT_3_OFF_SUBHEADER: "*Unit Libur (OFF):*",
  ```
- **After:**
  ```ts
  FORMAT_3_OFF_SUBHEADER: "*Unit Libur (OFF) / Keterangan Khusus:*",
  FORMAT_3_KENDALA_SUBHEADER: "*Rincian Tidak Ops:*",
  FORMAT_3_PELENGKAP_SUBHEADER: "*Unit Pelengkap Renops (Shift 2):*",
  ```

### 2. Generator Laporan WhatsApp (`src/utils/waReportGenerator.ts`)
- **Before:**
  Menggunakan template hardcoded string `*Rincian Tidak Ops:*` dan `*Unit Pelengkap Renops (Shift 2):*`.
- **After:**
  Menggunakan token sentral dari kamus teks (`TEXT_WA_REPORT.TEMPLATE.FORMAT_3_KENDALA_SUBHEADER`, `TEXT_WA_REPORT.TEMPLATE.FORMAT_3_OFF_SUBHEADER`, dan `TEXT_WA_REPORT.TEMPLATE.FORMAT_3_PELENGKAP_SUBHEADER`).

### 3. Ketahanan Jaringan Fetch Data (`src/services/allRouteMonitoringService.ts`)
- **Before:**
  Hanya melakukan 1 kali pemanggilan `supabase.from('daily_route_reports')`. Jika koneksi QUIC UDP browser mengalami *packet loss* / *interrupted stream*, `reportData` langsung menjadi `undefined` dan log mencatat kegagalan.
- **After:**
  Diberikan *resilient retry loop* (2 kali upaya dengan backoff 350ms) yang memungkinkan browser secara otomatis melakukan *fallback* ke protokol TCP HTTP/2 jika protokol QUIC mengalami *socket reset*.

---

## Case: Skenario Lapangan

### Skenario 1: Pesan WhatsApp Format 3 Menampilkan Unit Rusak & Libur Bersamaan
- **Kondisi:**
  Pada rute JAK.118 di hari Minggu, 9 unit berstatus LIBUR (KWK 1618 s/d 1626) dan 1 unit mengalami kendala teknis (KWK 1811: BA.02 BEARING RODA DEPAN KANAN RUSAK / OKB).
- **Sebelum Perbaikan:**
  Pesan WhatsApp mencetak judul subheader:
  ```text
  *Unit Libur (OFF):*
  - KWK 1618 : LIBUR
  ...
  - KWK 1811 : BA.02 BEARING RODA DEPAN KANAN RUSAK / OKB
  ```
  Pimpinan mengira KWK 1811 yang rusak sedang libur reguler.
- **Setelah Perbaikan:**
  Pesan WhatsApp mencetak judul yang akurat dan komprehensif:
  ```text
  *Unit Libur (OFF) / Keterangan Khusus:*
  - KWK 1618 : LIBUR
  ...
  - KWK 1811 : BA.02 BEARING RODA DEPAN KANAN RUSAK / OKB
  ```
  Pimpinan dan pengawas operasional langsung memahami bahwa daftar di bawah mencakup unit libur maupun unit dengan catatan khusus.

### Skenario 2: Fluktuasi Jaringan / Packet Loss UDP QUIC di Ponsel Pengawas
- **Kondisi:**
  Pengawas mengakses aplikasi monitoring wilayah melalui koneksi seluler di terminal yang mengalami jitter / packet loss UDP.
- **Sebelum Perbaikan:**
  Browser menampilkan galat merah `ERR_QUIC_PROTOCOL_ERROR` dan data laporan rute gagal ditampilkan sementara.
- **Setelah Perbaikan:**
  Sistem melakukan retry otomatis dalam 350ms, browser otomatis beralih ke TCP, dan seluruh kartu rute berhasil dimuat tanpa kendala.
