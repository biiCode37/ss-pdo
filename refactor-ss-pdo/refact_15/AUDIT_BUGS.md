# AUDIT BUGS: KETIADAAN INFORMASI CAPAIAN TRIP/RITASE PADA HALAMAN DAFTAR UNIT (REFACTOR 15)

Dokumen ini mendokumentasikan temuan audit fungsionalitas dan UX terkait ketiadaan indikator capaian ritase/trip armada pada halaman "Daftar Unit" di aplikasi SS_PDO.

---

## 1. UNIT-15-01: UI Halaman Daftar Unit Hanya Menampilkan KM dan Pnp

- **ID Temuan:** `UNIT-15-01`
- **Lokasi Kode:**
  - `src/utils/unitAnalytics.ts` (baris 6–16, 65–80, 110–130)
  - `src/components/UnitCard.tsx` (baris 188–221)
  - `src/components/UnitSummaryDashboard.tsx` (baris 35–88)
  - `src/components/UnitDetailModal.tsx` (baris 210–330)
- **Keparahan:** **MEDIUM** (Kesenjangan Visibilitas Operasional Ritase Harian)
- **Deskripsi Masalah:**
  1. **Tipe Data `UnitSummaryItem` Mengabaikan Kolom Trip:**
     Interface `UnitSummaryItem` dan `UnitSummaryMetrics` di `unitAnalytics.ts` hanya mengekstrak `totalToa`, `totalPassengers`, `totalKm`, dan `shiftStatus`. Nilai `tripPergi` dan `tripPulang` dari spreadsheet tidak diekstraksi ke model data ringkasan armada.
  2. **Tampilan Kartu Unit Terbatas pada KM dan Penumpang:**
     Komponen `UnitCard.tsx` hanya menampilkan 2 metrik ringkas:
     - `Navigation` KM
     - `Users` Pnp
     Petugas operasional yang membuka tab "Daftar Unit" untuk memantau performa armada tidak dapat mengetahui berapa ritase yang telah diselesaikan unit tersebut tanpa harus berpindah ke tab "Input SS" atau membuka spreadsheet manual.
  3. **Ketiadaan Evaluasi Ketercapaian Target pada Kartu Unit:**
     Sama seperti temuan `TRIP-14-01`, kartu unit tidak mengetahui target ritase rute sehingga tidak memberikan sinyal visual jika suatu unit tertinggal ritase (misal baru 5/5 trip saat target rute 7/7 trip).
- **Dampak Lapangan:**
  Pengawas armada dan petugas operasional kehilangan efisiensi waktu saat memeriksa daftar unit, karena harus bolak-balik memeriksa apakah armada tersebut mengalami kendala ritase atau sudah menyelesaikan target ritase harian.
- **Mitigasi Terencana:**
  1. Di `src/utils/unitAnalytics.ts`:
     - Tambahkan `tripPergi` dan `tripPulang` ke `UnitSummaryItem` dan `UnitSummaryMetrics`.
     - Buat helper terpusat `detectTargetTrip(data: BusData[])` untuk auto-deteksi target ritase rute.
  2. Di `src/components/UnitCard.tsx`:
     - Tampilkan metrik Trip berdampingan dengan KM dan Pnp: `KM | Pnp | Trip`.
     - Berikan warna penanda status ketercapaian target ritase (Emerald Green bila tercapai, Amber dengan `⚠️` bila kurang ritase, atau Orange bila tidak seimbang).
  3. Di `src/components/UnitSummaryDashboard.tsx`:
     - Hitung `targetTrip` dari data bus dan teruskan prop ke `UnitCard`.
  4. Di `src/components/UnitDetailModal.tsx`:
     - Tampilkan ringkasan trip pada modal detail akumulasi unit.
