# REPAIR REPORT: REFACTOR 197
**Modul:** Penataan Ulang UI & Ergonomi Kartu Unit Plotting Armada Harian  
**Tanggal:** 03 November 2026  
**Status:** Terverifikasi 100% Lulus (Zero Regression)

---

## 1. Implementasi Perbaikan

### A. Two-Tier Clean Layout pada `PlottingUnitCard.tsx`
Menata ulang hierarki kartu unit menjadi 2 baris terstruktur:
1. **Baris 1 (Identitas Utama & Kesiapan):**
   - Kiri: `[O]` Checkbox Multi-Select + `[::]` Grip Reorder Handle (saat mode aktif) + `[ 1 ]` Badge Nomor Urut + **Nama Unit Bus** (`flex: 1`, font tebal `800`, tidak terpotong).
   - Kanan: `[ ✓ Siap ]` / `[ ⚠️ Kendala ]` / `[ ✕ OFF ]` Status Pill (tetap ringkas ~72px).
2. **Sub-baris Keterangan Khusus (Bila Ada Kendala/OFF):**
   - Menampilkan strip chip khusus berlatar semantik adaptif (kuning peringatan atau merah kendala) dengan ikon dan teks catatan kendala lengkap yang dapat di-tap langsung untuk mengedit modal kendala.
3. **Baris 2 (Kontrol Operasional & Reorder):**
   - Kiri: Badge Pangkalan Start `[ 📍 Priok ⇄ ]` + Tombol Panah Reorder `[ ↑ ] [ ↓ ]` (tampil saat mode atur urutan aktif).
   - Kanan: Kontrol Stepper Target Ritase `[-] [ ⚡ 7.5 Rit ] [+]`.

### B. Proteksi Pemotongan Tanggal pada `PlottingHeader.tsx`
- Menyelaraskan teks subtitle agar segmen tanggal dibungkus dengan `<span style={{ whiteSpace: 'nowrap' }}>{date}</span>` sehingga browser tidak lagi memecah tanggal di tanda hubung (`2026-11-` dan `03`).

### C. Clearance Bawah Lega pada `DailyPlottingPage.tsx`
- Menaikkan padding dasar container dari `calc(92px + ...)` menjadi `calc(130px + env(safe-area-inset-bottom, 0px))` untuk menghilangkan tumpang tindih antara unit kartu paling bawah dengan floating `BottomNav`.

### D. Penambahan Comprehensive Unit Test `PlottingUnitCard.test.tsx`
- Menguji render identitas unit utuh tanpa truncate.
- Menguji isolasi status pill terhadap catatan kendala.
- Menguji kemunculan tombol panah reorder dan trigger callback `onMoveUp` / `onMoveDown`.
- Menguji interaksi tombol stepper ritase.

---

## 2. Before vs After

| Aspek | Sebelum Refactor 197 | Sesudah Refactor 197 |
|---|---|---|
| **Baris 1 Kartu Unit** | Berdesakan 7 elemen interaktif (`[O]`, `[::]`, `[ 1 ]`, `KW...`, `[↑]`, `[↓]`, `[📍 Priok ⇄]`). Nama unit terpotong parah. | Hanya memuat `[O]`, `[::]`, `[ 1 ]`, `Nama Unit` (ruang lega 65%+), dan `Status Pill`. Identitas terbaca 100% utuh. |
| **Status Pill Kendala** | Teks catatan kendala disatukan ke tombol status, membuat tombol melebar > 180px dan meremukkan elemen sekitar. | Status pill tetap ringkas konsisten (`Kendala`), catatan kendala pindah ke chip baris tersendiri yang manis dan informatif. |
| **Kontrol Reorder Panah** | Menghimpit nama unit di baris atas. | Ditempatkan di Baris 2 bersanding dengan pangkalan start, ergonomis dan ramah sentuhan jempol. |
| **Subtitle Header** | Tanggal terputus menjadi `2026-11-` di atas dan `03` di bawah. | Tanggal utuh satu kesatuan tidak terpotong (`2026-11-03`). |
| **Scroll Clearance Bawah** | Unit kartu terakhir tertutup sebagian oleh floating `BottomNav`. | Diberikan padding ekstra `130px + env(...)`, kartu terakhir dapat digulir bebas di atas navigasi. |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan: Subuh Pengawas Rute JAK.115
- **Kondisi:** Pukul 04:30 WIB, pengawas membuka aplikasi di smartphone dengan cahaya layar sedang untuk membagi 30 armada bus ke Tanjung Priok dan Pegangsaan II IGI.
- **Sebelum Perbaikan:** Seluruh unit bus hanya tampak sebagai `KW...`. Pengawas tidak dapat membedakan mana unit `KWK 222153` dan mana `KWK 222158`. Ketika unit ke-3 dilaporkan mogok/bocor radiator, tombol status melar dan mendorong layout berantakan. Saat menggulir ke bawah, kartu ke-15 tertutup tombol navigasi bawah.
- **Setelah Perbaikan:** Nomor lambung setiap bus terbaca jelas dan tegas (`KWK 222153`). Mode atur urutan memunculkan panah di baris kontrol tanpa menyentuh area nama bus. Unit bermasalah menampilkan peringatan jelas di bawah nama unit. Seluruh 30 kartu dapat digulir leluasa tanpa ada yang tertutup navigasi.
