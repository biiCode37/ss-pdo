# AUDIT BUGS: RESTORASI IKON VISUAL & AFEKSI IDENTITAS ARMADA (REFACTOR 32)

Dokumen ini mendokumentasikan evaluasi pasca-Refactor 31 terkait dampak hilangnya elemen visual ikonik (seperti ikon `Bus`, `Navigation`, `Users`, dan `Repeat`) terhadap kenyamanan kognitif pengguna operasional di lapangan.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **BUG-32-01** | `src/components/BusCard.tsx`<br>`src/components/UnitCard.tsx` | 🟠 **HIGH** (Loss of Visual Scannability: Pengguna lapangan kehilangan anchor visual ikon navigasi & penumpang untuk membedakan metrik sekilas) | Terselesaikan |
| **BUG-32-02** | `src/components/UnitDetailModal.tsx`<br>`src/components/RouteOperationalReportCard.tsx` | 🟡 **MEDIUM** (Identitas Domain Meredup: Hilangnya ikon `Bus` pada penomoran unit mengurangi kesan identitas operasional armada) | Terselesaikan |
| **BUG-32-03** | `src/components/KPICard.tsx`<br>`DailyToaTrendCard.tsx` | 🟡 **MEDIUM** (Keseragaman Visual Monoton: Tanpa ikon semantik, kartu metrik dan grafik terasa terlalu polos bagi sebagian pengguna) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🟠 BUG-32-01: Hilangnya Penanda Visual Cepat (*Visual Anchors*) pada Strip Kartu Bus
- **ID Temuan:** `BUG-32-01`
- **Lokasi Kode:** `src/components/BusCard.tsx` dan `src/components/UnitCard.tsx`
- **Keparahan:** **HIGH** (Kenyamanan Kognitif & User Preference)
- **Deskripsi Masalah:**
  1. Pemangkasan total seluruh ikon pada strip data (`Navigation` untuk KM, `Users` untuk penumpang, `Repeat` untuk ritase) membuat kartu bus bertumpu 100% pada tipografi teks.
  2. Bagi petugas operasional lapangan yang terbiasa mengenali metrik berdasarkan bentuk ikon warna (hijau/biru) secara cepat di bawah kondisi terburu-buru, ketiadaan ikon memperlambat pemindaian mata (*scannability*).
- **Dampak Lapangan:** Pengguna merasa tampilan kehilangan ciri khas navigasi bus dan membutuhkan waktu adaptasi lebih lama untuk membedakan kolom KM dan Penumpang.
- **Mitigasi:**
  - Mengembalikan (*revert*) seluruh ikon fungsional dan dekoratif ke kondisi stabil Refactor 30.
  - Mempertahankan ikon `Navigation`, `Users`, `Repeat`, dan `ArrowRightLeft` dengan layout yang telah dioptimalkan sebelumnya.

---

### 🟡 BUG-32-02: Meredupnya Ciri Visual Identitas Armada pada Modal & Laporan
- **ID Temuan:** `BUG-32-02`
- **Lokasi Kode:** `src/components/UnitDetailModal.tsx`, `src/components/RouteOperationalReportCard.tsx`
- **Keparahan:** **MEDIUM**
- **Deskripsi Masalah:**
  - Penghapusan ikon `Bus` di header modal dan kartu detail unit membuat header terasa monoton dan kehilangan identitas domain bus yang ramah.
- **Mitigasi:**
  - Merestorasi ikon `Bus`, `Clock`, dan penanda visual pendukung lainnya pada modal detail unit dan laporan operasional.
