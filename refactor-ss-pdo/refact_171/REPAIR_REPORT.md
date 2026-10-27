# Repair Report: Refactor 171 — Solusi Komprehensif Status Kesiapan Armada 18 Rute & Redesain Mobile-First

## Ringkasan Perbaikan
Refactor 171 menuntaskan dua permasalahan besar pada halaman **Monitoring Wilayah (Tab Status Armada)**:
1. **Penyatuan Data 18 Rute Otomatis (Dual-Source Resolution):** Memastikan seluruh 18 rute terdeteksi otomatis dengan memadukan data tabel `daily_fleet_shifts` (input manual A2/Korlap) dan fallback ke data `daily_route_reports` (hasil penarikan otomatis Google Sheets 18 rute).
2. **Redesain Mobile-First Compact List & Akordeon:** Menghemat ruang layar hingga **>65%**, mengeliminasi badge redundan `[CATATAN]`, dan menambahkan transparansi rute-rute yang 100% normal beroperasi.
3. **Pembersihan Istilah SGO/Non-SGO & Dead-Code:** Menghilangkan sisa modal konfirmasi usang di `text_dashboard.ts` dan `text_fleet_status.ts`, serta meremajakan kamus `text_monitoring.ts` dengan bahasa Indonesia operasional yang ramah pengguna.

---

## Implementasi Kode

### 1. Dual-Source Resolution pada `MonitoringFleetStatusTab.tsx`
- Mengumpulkan seluruh 18 rute unik dari prop `routes` (dari `data.routes`).
- Memeriksa ketersediaan shift pada `fleetShifts` (DB). Jika belum ada, sistem membaca rincian unit kendala dari `r.fleetStatusShift1` dan `r.fleetStatusShift2` hasil sinkronisasi spreadsheet.
- Mengklasifikasikan rute menjadi dua kelompok:
  - `troubledRoutes`: Rute dengan bus kendala (ditampilkan lengkap dengan akordeon).
  - `normalRoutes`: Rute dengan 0 kendala (ditampilkan sebagai chip hijau ringkas).
- Menghitung agregat makro 18 rute (Total Armada, Beroperasi, Terkendala) secara presisi.

### 2. Helper Cerdas `inferStatusCode()` & Formatting
- Menganalisis catatan unit secara otomatis:
  - Kode BA (`BA.01` s/d `BA.06`) diberi badge warna orange `#FB923C`.
  - Uji Kir (`KEUR`) diberi badge warna cyan `#38BDF8`.
  - Kendala Bengkel / Mesin (`TEKNIS`) diberi badge warna ungu `#C084FC`.
  - Operasional Khusus (`OKB` / `RENOP`) diberi badge warna biru/hijau.
  - Off Pramudi / Libur (`OFF`) diberi badge merah `#F43F5E`.
  - Tidak Operasi (`T.O` / `TO EVDAL`) diberi badge kuning `#F59E0B`.

### 3. Redesain Tata Letak Mobile-First
- Mengubah struktur kartu bus dari kotak besar terpisah (`minmax(280px, 1fr)`) menjadi baris daftar kompak (**Compact List Rows**).
- Menambahkan interaksi **Akordeon Lipat** pada setiap header rute, dilengkapi tombol *Tutup Semua / Buka Semua*.
- Memberikan safe-area padding bawah (`calc(90px + env(safe-area-inset-bottom, 16px))`) agar elemen terbawah tidak terpotong oleh floating bottom navigation.

### 4. Peremajaan Kamus Teks Sentral
- `text_dashboard.ts`: Menghapus sisa dead-code `SGO_CONFIRM_TITLE`, `SGO_CONFIRM_HTML`, `SGO_CONFIRM_BTN`, `SGO_CANCEL_INPUT_BTN`, `SGO_DENY_BTN`.
- `text_fleet_status.ts`: Menghapus dead-code `SGO_ALL_BTN` dan `SGO_FULL_LABEL`.
- `text_monitoring.ts`: Memperbarui token `TITLE`, `SGO_LABEL`, `NON_SGO_LABEL`, `EMPTY_DESC`, dan menambahkan token untuk rute normal dan kontrol akordeon.

---

## Perbandingan: Before vs After

| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Cakupan Rute yang Tampil** | Hanya rute yang diisi manual di modal A2/Korlap (contoh: JAK.87 saja). 17 rute lain hilang. | Seluruh 18 rute terdata otomatis via Dual-Source Resolution (DB + Spreadsheet Fallback). |
| **Rute Normal (0 Kendala)** | Disembunyikan diam-diam tanpa ada info apa pun di layar (*silent filter*). | Ditampilkan jelas di seksi khusus: *"Rute Beroperasi Penuh"* dengan chip hijau informatif. |
| **Konsumsi Ruang Layar** | 1 rute dengan 6 bus memakan tinggi >420px (hampir seluruh layar HP habis). | 1 rute dengan 6 bus hanya memakan ~150px (**hemat ruang >65%**). |
| **Model Tampilan Bus** | Kotak terpisah raksasa dengan padding tebal yang kaku. | Compact List Rows ramping dengan informasi jelas (Bodi, Status, Shift, Catatan). |
| **Badge Status Kendala** | Tertulis generik `[CATATAN] [S1]` untuk semua kendala non-TO/OFF. | Menampilkan kode masalah spesifik: `[BA.02]`, `[KEUR]`, `[TEKNIS]`, `[OFF]`, `[T.O]`. |
| **Interaksi Rute** | Semua terbuka terus tanpa opsi melipat. | Fitur Akordeon: Bisa dilipat/dibuka per rute, atau serentak via tombol *Tutup/Buka Semua*. |
| **Bahasa Antarmuka** | Istilah teknis: `(Non-SGO)`, `Siap Guna (SGO)`, `Kendala (Non-SGO)`. | Bahasa operasional ramah: *"Status Kesiapan Armada Wilayah"*, *"Armada Beroperasi"*, *"Armada Terkendala"*. |
| **Bottom Navigation Safe Area** | Kartu terbawah tertutup floating bottom menu. | Padding aman responsif memperhitungkan tinggi bottom navigation bar. |

---

## Case: Skenario Lapangan

### Skenario 1: Pengawas Wilayah Memantau Kesiapan Armada Pagi Hari
- **Kondisi:** Pengawas membuka Tab Status Armada pada tanggal 27 Oktober setelah operator melakukan sinkronisasi Load All. Baru Korlap JAK.87 yang sempat menginput data lewat modal korlap.
- **Sebelum Perbaikan:** Pengawas bingung karena hanya kartu JAK.87 yang muncul dengan 6 bus memenuhi seluruh layar. Pengawas mengira 17 rute lain belum masuk atau aplikasinya rusak.
- **Setelah Perbaikan:** Pengawas langsung melihat ringkasan makro 18 rute di atas: *"Total Armada: 310 Unit • Beroperasi: 290 Unit (93.5%) • Terkendala: 20 Unit"*. Di bawahnya, rute yang ada kendala muncul rapi dan terlipat/terbuka proporsional, sementara 15 rute yang 100% jalan tampil hijau di seksi rute normal.

### Skenario 2: Korlap Memeriksa Detail Kendala JAK.87 di Layar HP
- **Kondisi:** Korlap ingin melihat unit apa saja di JAK.87 yang terkena BA dan Keur di Shift 1.
- **Sebelum Perbaikan:** Setiap bus memakan satu kotak raksasa dengan badge abu-abu `[CATATAN]`. Korlap harus scroll berulang kali untuk melihat 6 bus.
- **Setelah Perbaikan:** Keenam bus tampil ringkas dalam 1 kotak rute JAK.87: `LSG 230043` dengan badge orange `[BA.02]` dan catatan `PROGRAM KEUR`. Korlap langsung paham jenis masalahnya dalam sekali lihat tanpa perlu scroll panjang.
