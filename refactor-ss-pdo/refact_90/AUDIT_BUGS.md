# Audit Bugs & Temuan Teknis — Batch 2.2 (Refact 90)

Tanggal: 27 September 2026  
Auditor/Pelaksana: Gemini (executor)  
Branch: `devmode`  
Basis Acuan: `refactor-ss-pdo/refact_82/IMPLEMENTATION_BATCHES.md` (Batch 2.2), `refact_89/REPAIR_REPORT.md`, dan instruksi penutupan R79-02 / R80-02.

---

## Daftar Temuan & Status Audit

| ID Temuan | Komponen / Berkas Terkait | Keparahan | Status Implementasi |
| :--- | :--- | :--- | :--- |
| **R79-02 / R80-02** | `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, `fields/BusFormField.tsx`, `fields/ShiftOptionChip.tsx`, `texts/text_alerts.ts` | **Medium** | **SELESAI (FIXED)** |
| **R89-01** | `dist_old/assets/`, `graphify-out/`, build lock artifacts | **Low (Tooling / Warning)** | **TERCATAT SECARA JUJUR (DELEGASI TERPISAH)** |

---

## Rincian Temuan

### 1. R79-02 / R80-02: Duplikasi Kontrol Input dan Chip Pilihan pada BusInputModalShift1 & BusInputModalShift2

- **Lokasi Kode:**
  - `src/components/busCard/modal/BusInputModalShift1.tsx` (baris ~28–60 dan ~135–220)
  - `src/components/busCard/modal/BusInputModalShift2.tsx` (baris ~28–60 dan ~135–220)
- **Keparahan:** Medium (Maintainability, UI/UX Inconsistency, Anti Hardcoded String)
- **Deskripsi:**
  1. **Duplikasi baris style objek input:** Kedua berkas modal shift mendefinisikan objek `heroInputStyle` dan `secondaryInputStyle` secara terpisah dengan aturan inline styling yang identik.
  2. **Hardcoded warna gelap:** Gaya latar belakang input menggunakan warna gelap heksadesimal statis `#181C24` tanpa mengindahkan token desain adaptif (`var(--input-bg)`), sehingga input tetap gelap saat pengguna beralih ke Light Mode.
  3. **Duplikasi markup form group:** Wrapper div, label, badge satuan (KM/Penumpang), input element dengan props kontraktual (`id`, `htmlFor`, `value`, `placeholder`, `disabled`, `inputMode`, `pattern`, `onFocus`, `onKeyDown`), serta penanganan state terkunci (*disabled/locked*) terduplikasi secara berulang.
  4. **Duplikasi kontrol chip:** Fungsi `getChipStyle(isActive)` dan tombol toggle untuk "Manual TOA" dan "Catatan" terduplikasi di kedua shift.
  5. **Hardcoded UI String di JSX:** Label tombol chip aktif menggunakan template literal hardcoded `` `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_SHIFT_X}` `` dan `` `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_CATATAN}` `` langsung di dalam JSX komponen, melanggar Golden Rule Kamus Teks Sentral.
- **Dampak User:**
  - Inkonsistensi visual dan interaksi antar Shift 1 dan Shift 2 ketika ada perbaikan atau perubahan behavior.
  - Tampilan form input pada Light Mode mengalami penurunan kontras dan kenyamanan karena latar belakang input tetap gelap statis (`#181C24`).
  - Ketidakmampuan melokalisasi tanda centang aktif secara konsisten dari kamus sentral.
- **Mitigasi:**
  1. Membuat komponen input terfokus `BusFormField` di `src/components/busCard/modal/fields/BusFormField.tsx` dengan varian `hero` dan `secondary`, mendukung `forwardRef`, adaptasi token CSS variable (`var(--input-bg)`, `var(--border-color)`, `var(--text-primary)`, `var(--card-bg)`), serta perlakuan `disabled` dan `locked`.
  2. Membuat komponen chip terfokus `ShiftOptionChip` di `src/components/busCard/modal/fields/ShiftOptionChip.tsx` dengan token CSS variable dan transisi fluid iOS style (`cubic-bezier(0.32, 0.72, 0, 1)`).
  3. Menambahkan fungsi template murni `CHIP_ACTIVE_LABEL: (label: string) => \`✓ ${label}\`` pada kamus sentral `TEXT_ALERTS.BUS_INPUT_MODAL` di `src/constants/texts/text_alerts.ts` beserta uji integritas pada `src/constants/texts/texts.test.ts`.
  4. Mempertahankan seluruh state, validasi, dan alur keyboard (Enter-to-Submit, focus scrolling) di `useBusInputForm.ts` tanpa mengubah kontrak domain.

---

### 2. R89-01: Kontaminasi Graf Pengetahuan oleh Artefak Direktori dist_old/

- **Lokasi Kode:**
  - Direktori `dist_old/assets/`
  - `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`
- **Keparahan:** Low (Tooling / Metric Integrity)
- **Deskripsi:**
  - Direktori `dist_old/` berisi berkas bundle minifikasi sisa build sebelumnya yang terkunci (*file lock*) di sistem operasi Windows.
  - Saat `graphify update .` dijalankan, parser AST memindai file-file minifikasi di `dist_old/`, menyebabkan graf pengetahuan membengkak menjadi 5.747 node (melebihi batas agregasi 5.000 node) dan 426 komunitas.
  - Saat `pnpm run lint` dijalankan di root, oxlint melaporkan 1.868 peringatan (sebagian besar berasal dari bundle minifikasi `dist_old/`).
- **Dampak User:**
  - Tidak berdampak pada pengguna akhir di lapangan.
  - Berdampak pada kejujuran metrik pelaporan developer (jumlah node graf dan hitungan peringatan linter).
- **Mitigasi:**
  - Sesuai instruksi Codex dan paket pengerjaan Batch 2.2, agen dilarang keras menghapus atau memindahkan `dist_old/`.
  - Kontaminasi ini dicatat secara jujur dan transparan dalam dokumen audit dan laporan perbaikan.
  - Verifikasi linting kode sumber proyek dilakukan secara terisolasi pada `src/` (`pnpm dlx oxlint src`) yang menghasilkan 0 error dan 101 warning baseline. Pembersihan `dist_old/` didelegasikan ke sesi terpisah.
