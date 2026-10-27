# Audit Bugs - Refactor 170

## Daftar Temuan Masalah & Celah

### BUG-170-01: Unit dengan Keterangan OFF dan TO EVDAL Masih Terhitung ke dalam Target Bar Progres Harian
- **Lokasi Kode**: `src/utils/keteranganUtils.ts` (`isUnitOffOrToEvdal`), `src/components/busList/busListUtils.ts` (`isUnitAllowedForInput`, `isBusFilled`), `src/components/busList/useBulkOperations.ts`, `src/utils/unitAnalytics.ts`, `src/utils/modals/busInput/busModalPreConfirm.ts`
- **Tingkat Keparahan**: Sedang (Akurasi Metrik & Integritas Operasional)
- **Deskripsi**:
  Unit non-operasional yang memiliki status `OFF` atau `TO EVDAL` sebelumnya sempat terhitung ke dalam target unit (`totalCount`) pada bar progres harian jika catatan hanya tersemat pada salah satu shift (misalnya `S1: OFF` karena diinput pagi hari, atau `S2: TO EVDAL`), atau jika format penulisan memuat variasi seperti `T.O EVDAL`, `OFF - BAN PECAH`, `TO-EVDAL`, dll. Akibatnya, pengawas lapangan melihat target unit lebih tinggi dari armada riil yang beroperasi, dan unit non-operasional tersebut keliru teridentifikasi sebagai "belum selesai diinput" (*unfinished*).
- **Dampak Pengguna**:
  Persentase bar progres harian tidak pernah mencapai 100% meskipun seluruh armada yang dinas sudah selesai diinput, membingungkan petugas dan korlap di lapangan.
- **Mitigasi**:
  1. Mengembangkan fungsi murni `isUnitOffOrToEvdal(raw)` pada `src/utils/keteranganUtils.ts` yang mendeteksi seluruh variasi penulisan `OFF` dan `TO EVDAL` (murni, prefix shift `S1:`/`S2:`, variasi penulisan `T.O`, `TO-EVDAL`, dan catatan gabungan dengan pipa `|`).
  2. Menerapkannya di awal fungsi `isUnitAllowedForInput` dan `isBusFilled` sehingga unit non-operasional tersebut secara mutlak dikecualikan dari `totalCount` bar progres harian di seluruh kategori.
  3. Menyinkronkan deteksi ini ke `useBulkOperations` (bulk trip) dan `detectTargetTrip` (unit analytics).

---

### BUG-170-02: Keterikatan Statis Quick Pill NP1 & NP2 pada BA.02
- **Lokasi Kode**: `src/components/busCard/modal/notes/KeteranganPresetBar.tsx`, `src/utils/keteranganUtils.ts` (`normalizeKeterangan`)
- **Tingkat Keparahan**: Rendah - Sedang (Fleksibilitas Pelaporan Operasional)
- **Deskripsi**:
  Status Negatif Pramudi (NP1 / NP2) sebelumnya diikat secara statis sebagai sub-chip tombol pada pill BA.02 di `KeteranganPresetBar.tsx` dan otomatis dipaksa menjadi `BA.02 NP1` / `BA.02 NP2` pada normalisasi string di `normalizeKeterangan`. Pada kenyataannya di lapangan, kendala NP1 / NP2 merupakan catatan independen dan belum tentu terikat pada kode Berita Acara BA.02.
- **Dampak Pengguna**:
  Pengawas lapangan terkekang seolah-olah NP1 dan NP2 selalu menjadi bagian dari BA.02, dan pengetikan manual NP1/NP2 tanpa BA.02 terkonversi secara paksa.
- **Mitigasi**:
  1. Menghapus sub-chip tombol cepat `[NP1]` dan `[NP2]` pada baris BA.02 di `KeteranganPresetBar.tsx`.
  2. Memperbarui `normalizeKeterangan` agar input teks bebas `NP1` / `NP2` tidak lagi dipaksa menjadi prefix `BA.02`, namun tetap dipertahankan format kapitalnya secara murni via Smart Title Case / akronim armada.
