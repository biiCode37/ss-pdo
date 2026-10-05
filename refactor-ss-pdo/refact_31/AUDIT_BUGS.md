# AUDIT BUGS: PEMANGKASAN IKON TIDAK PENTING, REDUNDAN & POLUSI VISUAL (REFACTOR 31)

Dokumen ini mendokumentasikan temuan audit UI/UX dan prinsip *Anti-Slop / Ponytail* terkait penggunaan ikon-ikon dekoratif yang berlebihan (*icon fatigue*), ikon redundan yang tidak menambah konteks informasi, serta emoji mentah yang mengurangi kesan profesional dan menyita ruang horizontal pada layar ponsel operasional SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File Terkait | Keparahan | Status |
| :--- | :--- | :--- | :---: |
| **BUG-31-01** | `src/components/BusCard.tsx`<br>`src/components/UnitCard.tsx` | 🔴 **CRITICAL** (Icon Fatigue & Ruang Sempit: Ikon berjejal pada strip data unit menyita ~48px dan memicu layout berantakan di layar 360px–390px) | Terselesaikan |
| **BUG-31-02** | `src/components/KPICard.tsx` | 🟠 **HIGH** (Decorative Clutter: Ikon `Gauge`, `Users`, `Bus`, `UserCheck` tidak informatif dan menduplikasi makna label metrik) | Terselesaikan |
| **BUG-31-03** | `src/components/DailyToaTrendCard.tsx` | 🟠 **HIGH** (Visual Noise pada Bar Chart: Ikon SVG melayang di puncak bar dan ikon dekoratif di 3 kotak statistik ringkasan) | Terselesaikan |
| **BUG-31-04** | `src/components/UnitDetailModal.tsx`<br>`src/components/RouteOperationalReportCard.tsx`<br>`src/components/WaReportModal.tsx` | 🟡 **MEDIUM** (Redundant Modal Headers: Ikon `Bus`, `Clock`, `AlertTriangle`, `FileText`, `MessageSquare` yang mengulang konteks teks) | Terselesaikan |
| **BUG-31-05** | `src/components/ShiftComparisonCard.tsx`<br>`src/components/CompletionStatusCard.tsx` | 🟡 **MEDIUM** (Tacky Title Icons: Ikon `Sun` dan `FileText` pada header kartu yang menurunkan estetika minimalis) | Terselesaikan |

---

## RINCIAN TEMUAN

### 🔴 BUG-31-01: Icon Fatigue & Penyempitan Ruang Horizontal pada Kartu Armada
- **ID Temuan:** `BUG-31-01`
- **Lokasi Kode:** `src/components/BusCard.tsx` dan `src/components/UnitCard.tsx`
- **Keparahan:** **CRITICAL** (Inefisiensi Ruang Mobile & Distraksi Visual)
- **Deskripsi Masalah:**
  1. Pada kartu bus (`BusCard` & `UnitCard`), setiap angka (ritase, KM, penumpang) selalu dipasangi ikon terpisah: `Navigation` untuk KM, `Users` untuk penumpang, dan `Repeat` untuk ritase.
  2. Di layar smartphone standar (lebar 360px – 390px), keberadaan ikon-ikon 12px–14px ini menyita ruang horizontal hingga 48px, memaksa teks menyusut dan memperbesar risiko teks bertumpuk atau turun baris (*line wrapping*).
  3. Terdapat penggunaan emoji mentah `⚠️` di dalam tag span yang tidak seragam lintas sistem operasi (Android, iOS, Windows merender warna dan ketajaman emoji berbeda-beda).
- **Dampak Lapangan:** Petugas di lapangan terdistraksi oleh tumpukan ikon kecil saat memeriksa daftar puluhan armada di bawah terik matahari, padahal angka dan unit ukuran (`rit`, `KM`, `Pnp`) sudah sangat jelas maknanya.
- **Mitigasi:**
  - Menghapus ikon `Navigation`, `Users`, `Repeat`, dan `ArrowRightLeft` dari strip data kartu bus.
  - Mengganti emoji mentah `⚠️` dengan badge indikator berlatar amber halus dan dot semantik yang konsisten dan elegan.
  - Memanfaatkan tipografi `tabular-nums` yang bersih, meningkatkan ruang baca horizontal secara signifikan.

---

### 🟠 BUG-31-02: Decorative Clutter pada Header Kartu KPI Dashboard
- **ID Temuan:** `BUG-31-02`
- **Lokasi Kode:** `src/components/KPICard.tsx`
- **Keparahan:** **HIGH** (Over-Engineering Visual / Slop)
- **Deskripsi Masalah:**
  1. Setiap kartu KPI (Total Penumpang, Rata-rata Ritase, Armada Beroperasi, dll.) menampilkan badge bundar dengan ikon Lucide (`Gauge`, `Users`, `Bus`, `UserCheck`) di sudut kanan atas.
  2. Ikon-ikon ini bersifat murni ornamen/dekoratif (*slop*) karena judul metrik ("Total Penumpang", "Armada Beroperasi") sudah mendeskripsikan isi metrik secara eksplisit.
  3. Warna badge ikon sering bertabrakan dengan aksen warna tren (+/- persen) di bagian bawah kartu.
- **Dampak Lapangan:** Menurunkan estetika profesional dashboard analitik (terlihat seperti *template Bootstrap/Tailwind pemula* daripada dashboard setara Linear atau Stripe).
- **Mitigasi:**
  - Menghapus badge kontainer ikon dekoratif beserta pemanggilan `lucide-react` terkait.
  - Memfokuskan hierarki visual kartu pada **tipografi murni**: label kecil uppercase yang rapi, angka metrik besar yang menonjol, dan badge tren delta yang jelas.

---

### 🟠 BUG-31-03: Visual Noise pada Grafik Tren Harian (Bar Chart & Stat Boxes)
- **ID Temuan:** `BUG-31-03`
- **Lokasi Kode:** `src/components/DailyToaTrendCard.tsx`
- **Keparahan:** **HIGH** (Polusi Visual & Penutupan Data Batang Grafik)
- **Deskripsi Masalah:**
  1. Di atas setiap puncak batang bar chart tren TOA, terdapat elemen SVG ikon mini yang melayang. Pada layar mobile atau saat nilai batang berdekatan, ikon melayang ini menutupi nilai angka puncak dan ujung batang grafik.
  2. Tiga kotak ringkasan performa di bawah grafik (Tertinggi, Terendah, Rata-rata) dipasangi ikon `Award`, `Zap`, dan `TrendingDown` yang memakan ruang vertikal dan membuat kotak terlihat penuh sesak.
- **Dampak Lapangan:** Pengawas operasional kesulitan membaca angka TOA harian pada batang grafik karena tertimpa ikon.
- **Mitigasi:**
  - Mengeliminasi ikon SVG melayang di atas puncak batang grafik, membiarkan nilai angka tampil murni di atas batang secara presisi.
  - Menghapus ikon `Award`, `Zap`, `TrendingDown` dari 3 kotak ringkasan, digantikan dengan label teks ringkas dan dot aksen warna semantik.

---

### 🟡 BUG-31-04: Ikon Redundan pada Header Modal Detail, Laporan, dan WhatsApp
- **ID Temuan:** `BUG-31-04`
- **Lokasi Kode:** `src/components/UnitDetailModal.tsx`, `src/components/RouteOperationalReportCard.tsx`, `src/components/WaReportModal.tsx`
- **Keparahan:** **MEDIUM** (Redundansi Semantik)
- **Deskripsi Masalah:**
  1. Pada modal detail unit (`UnitDetailModal`), ikon `Bus` ditempatkan di samping nomor bus ("Bus TJ-123"), padahal pengguna sudah jelas sedang membuka detail bus. Di dalam kartu Shift 1, Shift 2, dan Total, ikon `Navigation`, `Users`, dan `Repeat` kembali diulang berkali-kali.
  2. Pada modal laporan operasional rute (`RouteOperationalReportCard`), terdapat ikon `Bus` di judul, ikon `Clock` di samping teks "Headway Terpanjang", dan ikon `AlertTriangle` di samping "Kemacetan".
  3. Pada tab format laporan WhatsApp (`WaReportModal`), tab "Format Ringkas" dan "Format Lengkap" masing-masing memiliki ikon `FileText` identik yang tidak memberikan nilai diferensiasi visual apa pun.
- **Dampak Lapangan:** Pemborosan bundle size dan kerumitan DOM yang tidak berguna bagi pengguna.
- **Mitigasi:**
  - Menghapus seluruh ikon redundan di header modal, kartu shift, section catatan, dan tombol tab.
  - Mempertahankan hanya ikon navigasi esensial (seperti tombol silang tutup modal `X` atau chevron).

---

### 🟡 BUG-31-05: Ikon Kartu Judul yang Mengurangi Kesan Minimalis
- **ID Temuan:** `BUG-31-05`
- **Lokasi Kode:** `src/components/ShiftComparisonCard.tsx`, `src/components/CompletionStatusCard.tsx`
- **Keparahan:** **MEDIUM** (Estetika & Konsistensi UI)
- **Deskripsi Masalah:**
  - Kartu perbandingan shift memajang ikon `Sun` di samping judulnya, dan kartu status pengisian laporan memajang ikon `FileText`. Penempatan ikon di samping setiap judul kartu membuat tampilan antarmuka terkesan ramai (*cluttered*) seperti dashboard mainan anak-anak.
- **Dampak Lapangan:** Visual dashboard terasa tidak padu dengan prinsip desain modern minimalis yang mengedepankan konten.
- **Mitigasi:**
  - Menghapus ikon `Sun` dan `FileText` pada header kartu, menstandarkan judul kartu menggunakan tipografi sans-serif berbobot semi-bold yang bersih.
