# REPAIR REPORT: DIFERENSIASI VISUAL UNIT CAPAI TARGET RITASE VS KURANG RITASE (REFACTOR 14)

Dokumen ini mencatat implementasi perbaikan, perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `TRIP-14-01`.

---

## 1. Implementasi & Detail Solusi

### A. Komputasi & Inferensi Target Ritase Terpadu (`BusList.tsx`)
1. **Target Ritase Rute (`targetTrip`):**
   - Mengombinasikan nilai pengisian masal (`bulkPergi` & `bulkPulang`) oleh petugas dan inferensi otomatis dari spreadsheet.
   - Jika nilai masal belum disetel manual, sistem menghitung modus / capaian maksimum trip dari seluruh armada yang beroperasi pada rute tersebut (mengabaikan armada non-operasional `OFF`).
   - Secara otomatis menyinkronkan `bulkPergi` dan `bulkPulang` saat armada memiliki capaian trip yang terdeteksi, sehingga label tombol "Set Jumlah Trip" langsung merefleksikan target rute berjalan (contoh: `Set Jumlah Trip (7/7)`).
2. **Penerusan Prop:**
   - Objek `targetTrip` dioper secara merata ke seluruh kartu `<BusCard targetTrip={targetTrip} />`.

### B. Diferensiasi Visual & Badge Peringatan pada Kartu Bus (`BusCard.tsx`)
1. **Evaluasi Status Capaian Armada:**
   - `isTargetAchieved`: Unit yang menyelesaikan ritase penuh (`pergi >= targetTrip.pergi && pulang >= targetTrip.pulang`).
   - `isBelowTarget`: Unit yang masih beroperasi atau tripnya terpotong di bawah target (`pergi < targetTrip.pergi || pulang < targetTrip.pulang`).
   - `isImbalanced`: Evaluasi perjalanan pergi vs pulang tidak seimbang (misal `4/5`).
2. **Hierarki Desain Badge:**
   - **Target Tercapai Penuh (Capaian 7/7 pada target 7 ritase):**
     - Badge Emerald Green (`rgba(16, 185, 129, 0.12)`, teks `#10b981`, border `rgba(16, 185, 129, 0.25)`).
     - Label: `7/7 Rit` (Ikon tanda centang/kesuksesan visual bersih).
     - Tooltip: `Target Ritase Tercapai Penuh: 7/7 Rit`.
   - **Kurang Ritase / Di Bawah Target (Capaian 5/5 atau 3/2 pada target 7 ritase):**
     - Badge Amber Warning (`rgba(245, 158, 11, 0.12)`, teks `var(--warning-text, #f59e0b)`, border `rgba(245, 158, 11, 0.35)`).
     - Label: `⚠️ 5/5 Rit` (Memberikan sinyal visual instan bagi pengawas/petugas).
     - Tooltip: `Kurang Ritase: 5/5 Rit (Target Rute: 7/7 Rit)`.
   - **Mode Fokus Kolom (`activeCategory === 'trip'`):**
     - Unit tercapai menampilkan: `Trip: 7/7 Rit (Tercapai)`.
     - Unit kurang ritase menampilkan: `Trip: ⚠️ 5/5 Rit (Kurang)`.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
| :--- | :--- | :--- |
| **Pembedaan Capaian** | Unit dengan 7/7 ritase dan 5/5 ritase memiliki warna badge **hijau yang identik** karena hanya mengecek `pergi === pulang`. | Unit 7/7 tampil **Hijau Emerald** (Target Tercapai), sedangkan unit 5/5 tampil **Kuning Amber dengan ikon `⚠️`** (Kurang Ritase). |
| **Konteks Target Rute** | Komponen kartu tidak tahu berapa target ritase rute yang sedang dibuka. | Kartu menerima prop `targetTrip` baik dari input masal petugas maupun auto-deteksi modus armada aktif dari spreadsheet. |
| **Mode Fokus Kolom** | Hanya menampilkan angka mentah `Trip: 7/7 Rit` dan `Trip: 5/5 Rit` tanpa status ketercapaian. | Menampilkan penanda status yang eksplisit: `Trip: 7/7 Rit (Tercapai)` vs `Trip: ⚠️ 5/5 Rit (Kurang)`. |
| **Deteksi Otomatis** | Tombol "Set Jumlah Trip" kosong jika petugas belum menekan tombol masal. | Terisi otomatis merefleksikan target mayoritas armada yang sedang berjalan (`Set Jumlah Trip (7/7)`). |

---

## 3. Case: Skenario Lapangan

### Skenario Lapangan: Operasional Rute JAK.115 (Target Harian: 7 Ritase)
- **Kondisi Lapangan:**
  - Rute `JAK.115` memiliki kewajiban 7 ritase per unit per hari (7 trip pergi, 7 trip pulang).
  - Armada `TS-01`, `TS-02`, dan `TS-03` sukses beroperasi penuh hingga akhir shift dan menyelesaikan 7 ritase (`7/7`).
  - Armada `TS-04` mengalami pecah ban atau terhambat kemacetan parah di koridor pada jam 16:00, sehingga hanya mampu menyelesaikan 5 ritase (`5/5`).
  - Armada `TS-05` mengalami kendala teknis saat trip pulang ke-4, sehingga capaiannya `4/3`.

- **Pengalaman Sebelum Perbaikan:**
  - Pengawas melihat kartu `TS-01` (7/7) berwarna hijau.
  - Pengawas melihat kartu `TS-04` (5/5) **JUGA berwarna hijau**.
  - Pengawas terkecoh dan mengira seluruh armada telah memenuhi target harian, kecuali jika pengawas membaca baris teks kecil angka 5/5 satu per satu.

- **Pengalaman Sesudah Perbaikan:**
  - `TS-01`, `TS-02`, `TS-03`: Tampil elegan dengan badge hijau emerald `7/7 Rit`. Pengawas langsung tahu armada ini aman dan memenuhi target.
  - `TS-04`: Tampil mencolok dengan badge amber berpenanda `⚠️ 5/5 Rit`. Pengawas langsung waspada bahwa unit ini mengalami defisit ritase harian sebanyak 2 ritase.
  - `TS-05`: Tampil dengan badge amber berpenanda `⚠️ 4/3 Rit (Tidak Seimbang)` dengan border tegas oranye.
  - Petugas lapangan dapat mengambil keputusan cepat, apakah unit perlu rotasi rute atau pelaporan Berita Acara (BA) kendala operasional.
