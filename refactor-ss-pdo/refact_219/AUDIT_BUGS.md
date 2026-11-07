# AUDIT TEMUAN LAYOUT KARTU UNIT INPUT SS: REFACTOR 219
**Modul:** Halaman Input SS & tab Armada — `src/components/busCard/BusCard.tsx`, `BusCardSummary.tsx`, `src/components/UnitCard.tsx`, `src/index.css` (`.glass`, `.bus-card*`, `.bus-metric-*`), `src/constants/texts/text_dashboard.ts`.
**Fokus Masalah:** Kartu unit (bagian terbesar layar petugas) tampil tidak rapi: bingkai kartu tidak utuh, garis pemisah metrik melengkung, label huruf kapital semua, warna angka tidak seragam, dan gaya ganda inline vs CSS.

---

### ID Temuan: BUG-LAYOUT-219-01
- **Lokasi Kode:** `src/index.css` (`.bus-card` border kiri/kanan `3.5px solid transparent`)
- **Keparahan:** Medium (cacat visual di setiap kartu)
- **Deskripsi:** Kartu tanpa status memakai border kiri/kanan transparan selebar 3,5px sementara atas/bawah 1px. Akibatnya sisi kartu tidak terlihat dan sudut melengkung tampak "putus"; kartu berstatus dan tidak berstatus juga berbeda lebar isi.
- **Dampak User:** Daftar unit tampak seperti garis-garis horizontal, bukan kartu yang rapi.
- **Mitigasi:** Semua kartu memakai border 1px yang sama di empat sisi; warna status (OFF/kendala/TO) digambar sebagai tepi 4px kiri & kanan di lapisan `::after` lewat variabel `--unit-edge` (tidak menggeser isi, tidak tertutup latar strip metrik).

### ID Temuan: BUG-LAYOUT-219-02
- **Lokasi Kode:** `src/index.css` (`.bus-metric-col:not(:last-child)` + `.bus-metric-interactive { border-radius: 8px }`)
- **Keparahan:** Low
- **Deskripsi:** Garis pemisah kolom Ritase ikut melengkung karena kolom itu punya radius 8px untuk efek ketuk.
- **Dampak User:** Pemisah pertama terlihat bengkok, berbeda dari pemisah kedua.
- **Mitigasi:** Pemisah dipindah ke sisi kiri kolom berikutnya (`.bus-metric-col + .bus-metric-col`).

### ID Temuan: BUG-LAYOUT-219-03
- **Lokasi Kode:** `text_dashboard.ts` (`LABEL_RITASE`, `LABEL_KM`, `LABEL_PASSENGER` di `UNIT_CARD` & `BUS_CARD_ACTIONS`), `.bus-metric-label`
- **Keparahan:** Low (melanggar aturan "tanpa huruf kapital semua")
- **Deskripsi:** Label metrik "RITASE", "TOTAL KM", "PELANGGAN" ditulis kapital, ditambah `text-transform: uppercase`, `letter-spacing`, dan `opacity: 0.85` pada teks.
- **Dampak User:** Label terasa "berteriak" dan lebih lambat dibaca; opacity membuat kontras berubah-ubah.
- **Mitigasi:** "Ritase", "Total KM", "Pelanggan"; warna `--color-text-secondary` tanpa opacity.

### ID Temuan: BUG-LAYOUT-219-04
- **Lokasi Kode:** `BusCardSummary.tsx`, `UnitCard.tsx` (inline `color` per angka), `.bus-metric-empty`, `.bus-metric-strip`, `.bus-metric-interactive:hover`
- **Keparahan:** Low
- **Deskripsi:** Angka KM berwarna biru langit warisan (`--shift1-color`) sedangkan ritase & pelanggan netral; tanda kosong memakai `opacity: 0.45`; latar strip dan hover memakai `rgba` mentah dengan override tema terang terpisah.
- **Dampak User:** Tiga angka sejajar tampil dengan warna berbeda tanpa makna.
- **Mitigasi:** Warna angka dari kelas `.bus-metric-value` (`--color-text-primary`), tanda kosong `--color-text-muted`, strip `--color-surface-subtle`, hover `--color-action-secondary-bg`.

### ID Temuan: BUG-LAYOUT-219-05
- **Lokasi Kode:** `BusCard.tsx` (inline style header) vs `.bus-card-header`; `.glass`; `.bus-card:hover`
- **Keparahan:** Low
- **Deskripsi:** Header kartu punya padding ganda (CSS 16px 20px ditimpa inline 12px 16px). Bingkai `.glass` memakai `--color-border-control` (abu tegas, untuk kontrol input) sehingga semua kartu tampak bergaris tebal. Hover kartu memakai bayangan `rgba` dan efek angkat.
- **Dampak User:** Kartu terlihat berat; perilaku hover tidak relevan di HP.
- **Mitigasi:** Padding header satu sumber di CSS (12px 16px); `.glass` memakai `--color-border-subtle`; hover angkat/bayangan dihapus.
