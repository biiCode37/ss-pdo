# AUDIT TEMUAN IKON TIDAK KONSISTEN & DEKORATIF: REFACTOR 217
**Modul:** Seluruh komponen TSX yang memakai `lucide-react`; khususnya kartu analitik dashboard, header modal (input bus, detail unit, akumulasi), judul modal periode monitoring, sheet pemilih rute, kartu fitur login, kartu unit tab Armada, dan grafik pelanggan harian.
**Fokus Masalah:** Ukuran ikon acak (17 nilai berbeda), banyak ikon dekoratif di judul/daftar yang membuat tampilan ramai ("AI slop"), serta label grafik SVG yang terlalu kecil karena lolos dari normalisasi tipografi.

---

### ID Temuan: BUG-ICON-217-01
- **Lokasi Kode:** 85 file TSX (prop `size={…}` pada ikon lucide)
- **Keparahan:** Medium (inkonsistensi visual lintas halaman)
- **Deskripsi:** 274 ikon memakai ukuran di luar skala (10, 11, 12, 13, 14, 15, 17, 18, 19, 22, 28, 30, 32, 34, 36, 48), sehingga ikon setara tampil berbeda ukuran di tiap komponen.
- **Dampak User:** Tampilan tidak rapi; ikon kadang terlalu kecil untuk dikenali, kadang terlalu dominan.
- **Mitigasi:** Normalisasi ke skala 16/20/24: ≤ 17 → 16, 18–21 → 20, ≥ 22 → 24.

### ID Temuan: BUG-ICON-217-02
- **Lokasi Kode:** `KPICard.tsx`, `CompletionStatusCard.tsx`, `ShiftComparisonCard.tsx`, `dailyToaTrend/ToaTrendHeader.tsx` (judul kartu analitik); `BusInputModalHeader.tsx`, `UnitDetailModal.tsx`, `AccumulationHeader.tsx` (kotak ikon header); `MonitoringMonthPickerModal.tsx`, `MonitoringPeriodSelector.tsx` (judul modal); `RouteSelectorSheet.tsx` (judul sheet); `UnitDetailModal.tsx` (judul bagian catatan); `LoginFeatureCards.tsx` (3 kartu fitur); `UnitCard.tsx` (ikon bus di setiap kartu Armada)
- **Keparahan:** Low (dekoratif, tidak menambah informasi)
- **Deskripsi:** Ikon diletakkan di depan judul, judul bagian, dan item daftar tanpa fungsi navigasi/aksi/status. Beberapa memakai warna aksen warisan `--accent-color`/`#3ECF8E`.
- **Dampak User:** Layar ramai dan perhatian terpecah; kesan tidak profesional.
- **Mitigasi:** Ikon dekoratif dibuang. Ikon navigasi, tombol hanya-ikon, dan penanda status yang disertai teks dipertahankan. CSS mati ikut dihapus (`.analytics-card-title > svg`, `--title-icon-color`, `.ui-icon-tile`).

### ID Temuan: BUG-ICON-217-03
- **Lokasi Kode:** `src/components/dailyToaTrend/ToaBarChart.tsx` (atribut SVG `fontSize="9"`, `fontSize="10"`, `fontWeight="800"`), `src/styles/ui-debt-ratchet.test.ts`
- **Keparahan:** Medium (label sumbu tanggal tampil ±8px di HP)
- **Deskripsi:** Label sumbu tanggal dan badge nilai di grafik pelanggan harian memakai atribut JSX, bukan objek style, sehingga lolos dari codemod refact_216 dan dari pemindai ratchet.
- **Dampak User:** Tanggal di bawah grafik sulit dibaca.
- **Mitigasi:** Ukuran dinaikkan ke 13 unit viewBox (±12px setelah skala 0,93) dan bobot 700; ratchet diperluas mendeteksi `fontSize="N"`/`fontSize={N}` dan `fontWeight="800"`.
