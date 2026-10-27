# Task 5 Review: Integrasi Tab Catatan Penuh (BusInputModalNotes) & Single Focus (SingleFocusNotes)

## Status: CHANGES_REQUESTED

## Metadata
- **Commit Reviewed**: `2020ab0` (`feat: Tab Catatan segmented shift & preview`)
- **Base Commit**: `e9624e0`
- **Branch**: `devmode`
- **Review Date**: 2026-10-27

---

## 1. Ringkasan Evaluasi

Implementasi Task 5 pada commit `2020ab0` berhasil mewujudkan mayoritas fitur yang direncanakan:
1. **Tab Catatan Penuh (`BusInputModalNotes.tsx`)** memiliki segmented shift selector (Shift 1 & Shift 2), toggle *"Terapkan ke Kedua Shift"*, integrasi `KeteranganPresetBar`, dan kotak Live Preview SSOT berbasis formula kanonik `combineShiftKeterangan`.
2. **Mode Fokus Tunggal (`SingleFocusNotes.tsx`)** telah mendeteksi shift aktif dan menyematkan `KeteranganPresetBar`.
3. Seluruh 39 unit test pada `BusInputModal.test.tsx` dan 17 test pada `BusInputModalSingleFocus.test.tsx` lulus (`PASS`).

Namun, melalui audit mendalam terhadap kode dan theming ditemukan **3 temuan Important** (terkait kontras tema Light Mode, penanganan fallback nilai kosong di Single Focus, dan mutasi silang pada `setKeterangan`), **1 temuan Important perbaikan token tema**, serta **1 temuan Minor kamus teks**. Oleh karena itu, status ditetapkan sebagai **CHANGES_REQUESTED** agar kualitas dan keandalan di lapangan terjamin sepenuhnya sebelum melangkah ke Task 6 (Quality Gates).

---

## 2. Kesesuaian Spesifikasi (Spec Compliance)

| Kriteria | Status | Catatan Verifikasi |
|---|---|---|
| Segmented Switch Shift 1 & Shift 2 di Tab Catatan | **PASS** | Beralih antar shift secara mulus dengan indikator dot jika shift memiliki catatan. |
| Checkbox "Terapkan ke Kedua Shift" (`APPLY_ALL_SHIFTS`) | **PASS** | Menyalin isi catatan aktif ke shift lainnya secara instan dan menyinkronkan perubahan berikutnya jika dicentang. |
| Integrasi `KeteranganPresetBar` di Tab Catatan | **PASS** | Terpasang langsung di atas textarea dan terikat ke shift aktif. |
| Live Preview SSOT Badge Box | **PASS** | Menampilkan format kanonik hasil `combineShiftKeterangan(s1, s2)` dengan fallback `"Normal (SGO)"` saat kosong. |
| Integrasi `KeteranganPresetBar` di `SingleFocusNotes` | **PASS** | Terpasang tepat di atas textarea Single Focus. |
| Pengikatan State Catatan di `SingleFocusNotes` | **CHANGES REQUESTED** | Terdapat bug fallback `||` alih-alih `??` saat Shift 1 kosong, dan mutasi ganda tak bersyarat via `setKeterangan`. |
| Dukungan 2 Tema (Light Mode & Dark Mode) | **CHANGES REQUESTED** | Variabel CSS `--text-main` tidak terdaftar di `src/index.css`, mengakibatkan teks putih di atas background abu-abu terang pada Light Mode. |

---

## 3. Rincian Temuan (Findings)

### Finding 1 (Important) - Textarea Light Mode: Variabel CSS `--text-main` Tidak Terdefinisi
- **Lokasi Kode**: `src/components/busCard/modal/BusInputModalNotes.tsx:222`
  ```tsx
  background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
  color: "var(--text-main, #f8fafc)",
  ```
- **Masalah**: Token `--text-main` **tidak ada** di `src/index.css` (token resmi proyek adalah `--text-primary: #171717` untuk Light Mode dan `--text-primary: #ededed` untuk Dark Mode).
- **Dampak Lapangan**: Browser jatuh ke fallback `#f8fafc` (warna putih/putih gading). Pada Light Mode, background `--input-bg` bernilai `rgba(243, 244, 246, 0.9)` (abu-abu sangat terang), sehingga teks yang diketik pengguna di Tab Catatan menjadi **putih di atas abu-abu terang (hampir tidak terlihat / kontras ~1.05:1)**.
- **Rekomendasi Perbaikan**:
  Ubah menjadi token standar yang sama seperti `BusInputModalShift1.tsx`:
  ```tsx
  color: "var(--text-primary, #ededed)",
  ```

---

### Finding 2 (Important) - Bug Asimetri Fallback pada `SingleFocusNotes.tsx` (Empty Note Shift 1 Menampilkan Catatan Gabungan)
- **Lokasi Kode**: `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx:32-33`
  ```tsx
  const currentNote = isShift2
    ? (keteranganS2 ?? keterangan ?? "")
    : (keteranganS1 || keterangan || "");
  ```
- **Masalah**: Pada Shift 1 digunakan operator `||` alih-alih `??`. Jika armada memiliki status `"SGO | BA.02 Sakit"` (Shift 1 normal/kosong, Shift 2 bermasalah), maka `keteranganS1 === ""`. Karena `""` bersifat falsy, operator `||` mengevaluasi `keterangan` (`"SGO | BA.02 Sakit"`).
- **Dampak Lapangan**: Saat pengguna membuka Mode Fokus Tunggal pada Shift 1 (misal `toaShift1`), catatan Shift 1 yang seharusnya kosong/Normal justru menampilkan teks `"SGO | BA.02 Sakit"`.
- **Rekomendasi Perbaikan**:
  Gunakan operator nullish coalescing `??` secara konsisten pada kedua shift:
  ```tsx
  const currentNote = isShift2
    ? (keteranganS2 ?? keterangan ?? "")
    : (keteranganS1 ?? keterangan ?? "");
  ```
  *(Catatan: pastikan juga helper `createMockForm` pada test Single Focus menginisialisasi `keteranganS1` dari overrides agar tes tidak gagal palsu).*

---

### Finding 3 (Important) - Mutasi Ganda & Potensi Menimpa Shift Berlawanan di `SingleFocusNotes.tsx`
- **Lokasi Kode**: `src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx:34-43`
  ```tsx
  const handleNoteChange = (val: string) => {
    if (isShift2) {
      if (setKeteranganS2) setKeteranganS2(val);
    } else {
      if (setKeteranganS1) setKeteranganS1(val);
    }
    if (setKeterangan) {
      setKeterangan(val);
    }
  };
  ```
- **Masalah**: `setKeterangan(val)` dipanggil tanpa syarat setelah memanggil `setKeteranganS1` atau `setKeteranganS2`. Di `useBusInputForm.ts`, implementasi `setKeterangan` menggunakan state `activeTab`. Jika `activeTab` tidak selaras dengan `isShift2` (misalnya pada kategori fokus tertentu yang default tab-nya `"shift1"`), `setKeterangan` akan memanggil setter shift yang salah dan merusak state shift lainnya.
- **Dampak Lapangan**: Risiko catatan Shift 1 dan Shift 2 saling tumpang tindih (*cross-shift mutation*) secara tidak disengaja dalam mode single focus.
- **Rekomendasi Perbaikan**:
  Gunakan `setKeterangan` hanya sebagai fallback jika setter per shift tidak tersedia:
  ```tsx
  const handleNoteChange = (val: string) => {
    if (isShift2) {
      if (setKeteranganS2) {
        setKeteranganS2(val);
      } else if (setKeterangan) {
        setKeterangan(val);
      }
    } else {
      if (setKeteranganS1) {
        setKeteranganS1(val);
      } else if (setKeterangan) {
        setKeterangan(val);
      }
    }
  };
  ```

---

### Finding 4 (Important) - Inkonsistensi Token Tema Shift & Hardcoded Warna pada Segmented Control Tab Catatan
- **Lokasi Kode**: `src/components/busCard/modal/BusInputModalNotes.tsx:98, 113, 139, 154`
- **Masalah**:
  1. Tombol Shift 1 menggunakan `var(--accent-color, #38bdf8)`. Pada Light Mode, `--accent-color` proyek adalah hijau (`#24B47E`), sehingga tombol Shift 1 menjadi berwarna hijau alih-alih biru identitas Shift 1. Token yang benar adalah `var(--shift1-color, #38bdf8)`.
  2. Tombol Shift 2 menggunakan warna statis `#c084fc`. Pada Light Mode dengan latar belakang kartu putih (`#ffffff`), warna ungu muda `#c084fc` memiliki rasio kontras rendah (~2.8:1, gagal WCAG AA). Token yang benar adalah `var(--shift2-color, #c084fc)` yang otomatis menjadi ungu tua (`#7e22ce`) di Light Mode (kontras 7:1).
  3. Titik dot indikator memiliki hardcoded background `#38bdf8` dan `#c084fc`.
- **Rekomendasi Perbaikan**:
  Gunakan token semantic yang sudah ada di `src/index.css`:
  - Shift 1 color: `var(--shift1-color, #38bdf8)`
  - Shift 1 border: `1px solid var(--shift1-border, rgba(56, 189, 248, 0.3))`
  - Shift 2 color: `var(--shift2-color, #c084fc)`
  - Shift 2 border: `1px solid var(--shift2-border, rgba(168, 85, 247, 0.3))`
  - Dot 1: `background: "var(--shift1-color, #38bdf8)"`
  - Dot 2: `background: "var(--shift2-color, #c084fc)"`

---

### Finding 5 (Minor) - Hardcoded String pada `aria-label` Segmented Group
- **Lokasi Kode**: `src/components/busCard/modal/BusInputModalNotes.tsx:69`
  ```tsx
  <div
    role="group"
    aria-label="Pilih Shift Catatan"
  ```
- **Masalah**: Aturan Emas 10 melarang hardcoded UI string langsung pada kode `.tsx`.
- **Rekomendasi Perbaikan**:
  Tambahkan kunci ke `src/constants/texts/text_alerts.ts`:
  ```ts
  PRESETS: {
    ...
    ARIA_SELECT_NOTE_SHIFT: "Pilih Shift Catatan",
  }
  ```
  Dan gunakan `aria-label={texts.PRESETS.ARIA_SELECT_NOTE_SHIFT}`.

---

## 4. Rangkuman Tindakan Perbaikan (Action Items)

1. **`BusInputModalNotes.tsx`**:
   - Ganti `color: "var(--text-main, #f8fafc)"` menjadi `color: "var(--text-primary, #ededed)"`.
   - Gunakan token `var(--shift1-color, #38bdf8)` dan `var(--shift2-color, #c084fc)` pada segmented buttons & dot indicators.
   - Pindahkan string `"Pilih Shift Catatan"` ke `TEXT_ALERTS.BUS_INPUT_MODAL.PRESETS.ARIA_SELECT_NOTE_SHIFT`.

2. **`SingleFocusNotes.tsx`**:
   - Ganti `keteranganS1 || keterangan || ""` menjadi `keteranganS1 ?? keterangan ?? ""`.
   - Perbaiki `handleNoteChange` agar memanggil setter spesifik shift dan hanya memanggil `setKeterangan` sebagai `else if` fallback.

3. **`BusInputModalSingleFocus.test.tsx`**:
   - Pada `createMockForm`, pastikan `keteranganS1: overrides.keteranganS1 ?? (overrides.keterangan || "")` agar sinkron dengan `overrides.keterangan`.
   - Tambahkan pengujian verifikasi untuk kasus armada dengan catatan hanya di Shift 2, memastikan Single Focus Shift 1 tetap bersih (`""`).

4. **Verifikasi Quality Gates**:
   - Jalankan `pnpm vitest run src/components/busCard/` (harus 100% PASS).
   - Jalankan `pnpm tsc -b` (harus 0 errors).

---

## 5. Kesimpulan Review

Kode pada Task 5 memiliki arsitektur yang solid dan modular, namun memerlukan perbaikan terarah pada theming kontras Light Mode dan isolasi state Single Focus sebelum dapat disetujui secara resmi.

**Status Akhir: CHANGES_REQUESTED**
