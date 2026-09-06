# AUDIT BUGS: KETIDAKMAMPUAN MEMBEDAKAN UNIT CAPAI TARGET VS KURANG RITASE (REFACTOR 14)

Dokumen ini mendokumentasikan temuan audit fungsionalitas dan UX terkait validasi ketercapaian target ritase/trip per unit armada pada rute operasional di aplikasi SS_PDO.

---

## 1. TRIP-14-01: Tampilan Seragam Antara Unit Capai Target Penuh vs Unit Kurang Ritase

- **ID Temuan:** `TRIP-14-01`
- **Lokasi Kode:**
  - `src/components/BusCard.tsx` (baris 250–350)
  - `src/components/BusList.tsx` (baris 55–90, 560–600)
- **Keparahan:** **HIGH** (Gap Pengawasan Operasional Lapangan & Integritas Target Ritase)
- **Deskripsi Teknis Masalah:**
  1. **Logika Validasi Trip Terbatas pada Keseimbangan (Symmetry Only):**
     Di `BusCard.tsx`, penentuan status warna badge Trip sebelumnya hanya mengecek ketidakseimbangan perjalanan pergi vs pulang:
     ```ts
     const isImbalanced = hasTrip && pergiVal !== pulangVal;
     ```
     Akibatnya:
     - Unit dengan capaian `7/7` (7 pergi, 7 pulang) dievaluasi seimbang (`7 === 7`), sehingga badge berwarna hijau normal.
     - Unit dengan capaian `5/5` (5 pergi, 5 pulang) JUGA dievaluasi seimbang (`5 === 5`), sehingga badge tetap berwarna hijau normal yang identik dengan unit `7/7`.
  2. **Ketiadaan Konteks Target Ritase Rute pada Komponen Kartu:**
     Setiap rute Transjakarta/Mikrotrans memiliki target ritase wajib per hari (misalnya rute `JAK.115` memiliki target 7 ritase / 7-7 trip per unit). Namun komponen `BusCard` tidak menerima informasi target ritase rute (`targetTrip`), sehingga kartu tidak dapat membedakan mana unit yang telah memenuhi target operasional dan mana yang ritase-nya terpotong di tengah jalan.
  3. **Ketiadaan Auto-Deteksi Target Rute dari Data Spreadsheet:**
     Di `BusList.tsx`, state `bulkPergi` dan `bulkPulang` hanya terisi jika pengguna membuka dan menyimpan modal masal. Jika pengguna membuka data hari berjalan di mana data trip sudah terisi dari spreadsheet, sistem tidak menginferensi target trip rute secara otomatis dari armada yang beroperasi.
- **Dampak Lapangan:**
  Pengendali operasional dan petugas di lapangan tidak dapat membedakan secara visual mana bus yang sukses mencapai target harian (misal 7/7) dan mana bus yang kurang ritase (misal 5/5 karena kendala macet atau keterlambatan). Petugas terpaksa membaca angka satu per satu secara manual.
- **Mitigasi Terencana:**
  1. Di `BusList.tsx`:
     - Bangun kalkulator target ritase rute (`targetTrip`) yang memprioritaskan input masal petugas dan menginferensi modus/target dominan armada aktif dari spreadsheet secara otomatis.
     - Teruskan objek `targetTrip: { pergi: number; pulang: number } | null` sebagai prop ke seluruh `BusCard`.
     - Sinkronkan `bulkPergi` dan `bulkPulang` secara reaktif dari target terdeteksi agar tombol kontrol di atas langsung menginformasikan target rute berjalan (contoh: `Set Jumlah Trip (7/7)`).
  2. Di `BusCard.tsx`:
     - Terima prop `targetTrip`.
     - Evaluasi apakah capaian unit memenuhi target (`isTargetAchieved`: `pergi >= targetP && pulang >= targetQ`) atau berada di bawah target (`isBelowTarget`: `pergi < targetP || pulang < targetQ`).
     - Berikan pembedaan visual yang jelas:
       - **Target Tercapai Penuh (misal `7/7 Rit` pada target 7):** Badge hijau emerald solid (`rgba(16, 185, 129, 0.12)`, teks `#10b981`) menandakan armada sukses menyelesaikan tugas harian.
       - **Di Bawah Target / Kurang Ritase (misal `5/5 Rit` atau `3/2 Rit` pada target 7):** Badge amber peringatan (`rgba(245, 158, 11, 0.12)`, teks `var(--warning-text, #f59e0b)`) dengan penanda `⚠️ 5/5 Rit` dan tooltip informatif (`Kurang Ritase: 5/5 Rit (Target Rute: 7/7)`).
