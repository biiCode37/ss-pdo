# Laporan Perbaikan Revisi Batch 2.2 — Refact 92

Tanggal: 27 September 2026  
Auditor/Pelaksana: Gemini (executor)  
Branch: `devmode`  
Keputusan: **READY_FOR_REVIEW**

Laporan ini mendokumentasikan penyelesaian menyeluruh atas paket revisi **Fase 2, Batch 2.2** untuk menutup temuan **R91-01 s.d. R91-03** dari `refact_91/AUDIT_BUGS.md`. Seluruh perubahan lokal sebelumnya dan arsip dokumentasi historis (`refact_84` s.d. `refact_91`) dipertahankan sepenuhnya tanpa modifikasi.

---

## 1. Ringkasan Eksekutif & Status Perbaikan

| ID Temuan | Komponen / Berkas | Status Implementasi | Status Verifikasi |
| :--- | :--- | :--- | :--- |
| **R91-01** | `src/components/busCard/modal/fields/ShiftOptionChip.tsx` | **SELESAI (FIXED)** | Ditambahkan `aria-pressed={isActive}` pada `<button>` native; diuji `aria-pressed="false"` & `"true"` serta callback klik |
| **R91-02** | `src/components/busCard/modal/fields/BusFormField.test.tsx` & evidence | **SELESAI (FIXED)** | Tes Enter mencapai `requestSubmit()` via handler form nyata; `KM Akhir 2` diuji disabled saat `isKmAkhir2Locked`; chip Manual & Catatan diuji memanggil setter pada Shift 1 & Shift 2 |
| **R91-03** | `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, dokumentasi | **SELESAI (FIXED)** | Baris kosong ekstra di EOF dihapus; `git diff --check` lulus 0 error; contoh Before vs After dikoreksi sesuai source aktual |
| **R89-01** | `dist_old/assets/` & `graphify-out/` | **TERCATAT SECARA JUJUR** | Tooling note: `dist_old/` dipertahankan tanpa dihapus/dipindahkan sesuai mandat; kontaminasi dicatat secara transparan |

---

## 2. Rincian Implementasi & Koreksi Faktual (Before vs After)

### A. Aksesibilitas Chip Pilihan (`ShiftOptionChip.tsx`) [R91-01]

#### Before:
Elemen `<button type="button">` native hanya mengubah warna dan background visual, tanpa atribut status toggle untuk teknologi bantu:
```tsx
<button
  id={id}
  type="button"
  onClick={onToggle}
  title={title}
  style={{ ... }}
>
  {label}
</button>
```

#### After:
Menambahkan atribut semantik `aria-pressed={isActive}` tanpa menambahkan `role="button"` atau `tabIndex={0}` yang redundan pada elemen button native:
```tsx
<button
  id={id}
  type="button"
  aria-pressed={isActive}
  onClick={onToggle}
  title={title}
  style={{ ... }}
>
  {label}
</button>
```

---

### B. Koreksi Faktual Before vs After Form Field (`BusFormField.tsx`) [R91-03]

#### Source Aktual Sebelum Batch 2.2:
Objek style lokal di `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` sebelum ekstraksi sebenarnya menggunakan latar belakang semi-transparan `rgba(...)` (bukan heksadesimal `#181C24`):
```tsx
const heroInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1.5px solid var(--card-border, rgba(255, 255, 255, 0.12))",
  background: "var(--input-bg, rgba(0, 0, 0, 0.35))",
  color: "var(--text-primary, #ededed)",
  fontSize: "1.15rem",
  fontWeight: 800,
  boxSizing: "border-box",
};

const secondaryInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
  background: "var(--input-bg, rgba(0, 0, 0, 0.25))",
  color: "var(--text-primary, #ededed)",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};
```

#### Source Komponen Aktual Setelah Batch 2.2:
Komponen `BusFormField` dibuat seminimal dan sefokus mungkin dengan props nyata berikut:
- **Props yang tersedia:** `id`, `label`, `value`, `onChange`, `variant` (`"hero" | "secondary"`), `type`, `inputMode`, `pattern`, `min`, `max`, `placeholder`, `disabled`, `onFocus`, `onKeyDown`, `labelStyle`, `inputStyle`, `containerStyle`.
- **Klarifikasi batas fitur:** Komponen ini **TIDAK** memiliki props `isLocked`, `suffix`, `helperText`, ataupun `onBlur`. Penanganan status terkunci (*locked*) dioperasikan melalui prop standar HTML `disabled` dan `placeholder`.
- **Alur Submit Keyboard:** Elemen `<input>` di dalam `BusFormField` meneruskan event `onKeyDown` secara murni. Logika eksekusi submit keyboard (`requestSubmit()`) berada di hook domain `useBusInputForm.ts` pada fungsi `handleInputKeyDown`:
  ```ts
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };
  ```

---

### C. Koreksi Faktual Pemakaian Chip & Kamus Teks (`ShiftOptionChip.tsx`) [R91-03]

- Komponen `ShiftOptionChip` menerima callback `onToggle: () => void` (bukan `onClick`).
- Komponen chip tidak mendefinisikan ataupun memakai token fiktif `CHIP_ADD_LABEL`. Pemanggil di Shift 1 dan 2 menggunakan token kamus domain yang sudah ada:
  ```tsx
  <ShiftOptionChip
    isActive={showManual1}
    onToggle={() => setShowManual1((prev) => !prev)}
    label={
      showManual1
        ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(
            TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1,
          )
        : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1
    }
  />
  ```

---

### D. Kerapian Whitespace Diff [R91-03]

Baris kosong ekstra (blank line di EOF) pada baris 400 di `BusInputModalShift1.tsx` dan baris 394 di `BusInputModalShift2.tsx` telah dihapus.  
Pemeriksaan `git diff --check` menghasilkan exit code 0 tanpa peringatan ataupun error whitespace.

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Menggunakan Pembaca Layar (Screen Reader) Memilih Opsi Manual/Catatan
- **Kondisi Lapangan:** Petugas dengan kebutuhan aksesibilitas mengaktifkan TalkBack atau Screen Reader pada ponsel saat mengisi laporan bus.
- **Sebelum Perbaikan:** Tombol chip dapat diklik, namun teknologi bantu tidak dapat mengumumkan status toggle aktif/tidak aktif karena tidak adanya atribut `aria-pressed`.
- **Sesudah Perbaikan:** Dengan atribut `aria-pressed={isActive}`, screen reader langsung mengumumkan status *"Manual Shift 1, ditandai"* atau *"Manual Shift 1, tidak ditandai"* secara otomatis saat di-tap.

### Skenario 2: Petugas Menekan Tombol Enter pada Keyboard Ponsel (Enter-to-Submit)
- **Kondisi Lapangan:** Petugas mengetik angka penumpang pada input hero TOA dan menekan tombol `Enter` / `Done` pada keyboard virtual Android/iOS.
- **Sebelum Perbaikan:** Pengujian sebelumnya hanya memverifikasi pemanggilan fungsi spy `handleKeyDown`, belum membuktikan bahwa event Enter yang melalui `BusFormField` berhasil mencapai pemanggilan `form.requestSubmit()` pada elemen `<form>`.
- **Sesudah Perbaikan:** Uji perilaku `Enter key on BusFormField reaches requestSubmit() through the real form handler` memverifikasi bahwa event keyboard yang diteruskan `BusFormField` memicu `handleInputKeyDown` dari `useBusInputForm.ts`, menemukan form terdekat, dan memanggil `requestSubmit()`.

### Skenario 3: Input Odometer Terkunci pada Shift 2 (`isKmAkhir2Locked`)
- **Kondisi Lapangan:** KM Awal Shift 2 belum valid atau belum diisi, sehingga sistem mengharuskan KM Akhir 2 dalam keadaan terkunci.
- **Sebelum Perbaikan:** Uji integrasi Shift 2 belum memverifikasi secara eksplisit bahwa `input-km-akhir-2` berstatus `disabled` dan menampilkan placeholder teks terkunci.
- **Sesudah Perbaikan:** Uji integrasi Shift 2 secara spesifik memvalidasi bahwa saat `isKmAkhir2Locked = true`, elemen `#input-km-akhir-2` memiliki atribut `disabled={true}`, placeholder `PLACEHOLDER_KM_LOCKED`, dan kursor `not-allowed`.

### Skenario 4: Tinjauan Visual Tema Terang & Gelap pada Layar Ponsel & Catatan Batas Verifikasi
- **Analisis Faktual Token Desain:**
  - Token `--input-bg`: pada tema gelap bernilai `rgba(30, 30, 30, 0.7)`, sedangkan pada tema terang (`[data-theme="light"]`) bernilai `rgba(243, 244, 246, 0.9)`.
  - Token `--card-border`: pada tema gelap bernilai `rgba(255, 255, 255, 0.08)`, sedangkan pada tema terang bernilai `rgba(0, 0, 0, 0.08)`.
  - Token `--text-primary`: pada tema gelap bernilai `#ededed`, sedangkan pada tema terang bernilai `#171717`.
  - Gaya fallback `BusFormField` menggunakan `var(--input-bg, rgba(0, 0, 0, 0.25))` dan warna teks `var(--text-primary, #ededed)`.
- **Catatan Batas Verifikasi Visual:**  
  *Lingkungan browser preview/dev server saat ini tidak sedang berjalan di port lokal (ports 5173/3000 offline) pada lingkungan eksekusi terminal ini. Oleh karena itu, kesetaraan visual murni pada rendering perangkat fisik tidak dapat di-capture sebagai screenshot secara langsung dan tidak diklaim secara sepihak. Namun, kepatuhan token CSS variable terhadap sistem tema `src/index.css` telah diverifikasi secara struktural dan analitis.*

---

## 4. Hasil Verifikasi & Quality Gates

| Gerbang Pemeriksaan | Perintah Eksekusi | Status | Hasil Aktual |
| :--- | :--- | :--- | :--- |
| **Target Unit Tests** | `pnpm vitest run src/components/busCard/modal/fields/BusFormField.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/constants/texts/texts.test.ts` | **PASS** | 3 file lulus, **41 / 41 tes lulus** (0 gagal, waktu 1.84s) |
| **Full Project Tests** | `pnpm run test --dir src` | **PASS** | 75 file uji lulus, **542 / 542 tes lulus** (100% pass, waktu 48.2s) |
| **Targeted Lint (Batch 2.2)** | `pnpm run lint src/components/busCard/modal/fields src/components/busCard/modal/BusInputModalShift1.tsx src/components/busCard/modal/BusInputModalShift2.tsx` | **PASS** | **0 warning, 0 error** pada seluruh 5 berkas Batch 2.2 |
| **Whitespace Diff Check** | `git diff --check` | **PASS** | Exit code 0, **tidak ada whitespace error** di seluruh repositori |
| **TypeScript & Bundling** | `pnpm run build` (`tsc -b && vite build`) | **PASS** | Exit code 0, bundling Vite produksi sukses |
| **Knowledge Graph** | `graphify update .` | **PASS** | Graf terbarukan (**5.791 nodes, 9.695 edges, 434 komunitas**) |

> **Catatan Tooling & Kontaminasi Graf (R89-01):**  
> Direktori `dist_old/` (berkas bundle lama yang terkunci di OS Windows) tetap dipertahankan tanpa manipulasi sesuai mandat Codex. Kontaminasi `dist_old/` terhadap pembengkakan total node graphify (5.791 nodes) dan 1.868 peringatan linter root dicatat secara transparan di `refact_92/evidence/lint-root.txt`. Linting terarah pada kode sumber Batch 2.2 bersih 0 warning dan 0 error.

---

## 5. Daftar Berkas yang Diubah / Ditambah

1. `src/components/busCard/modal/fields/ShiftOptionChip.tsx` (Modifikasi: penambahan `aria-pressed={isActive}`)
2. `src/components/busCard/modal/fields/BusFormField.test.tsx` (Modifikasi: penambahan tes Enter `requestSubmit()`, tes `aria-pressed`, tes chip Shift 1 & 2, tes locked KM Akhir 2)
3. `src/components/busCard/modal/BusInputModalShift1.tsx` (Modifikasi: penghapusan blank line ekstra di EOF)
4. `src/components/busCard/modal/BusInputModalShift2.tsx` (Modifikasi: penghapusan blank line ekstra di EOF)
5. `refactor-ss-pdo/refact_92/AUDIT_BUGS.md` (**BARU**: Dokumentasi audit temuan revisi R91-01 s.d. R91-03 dan R89-01)
6. `refactor-ss-pdo/refact_92/REPAIR_REPORT.md` (**BARU**: Laporan komprehensif penutupan revisi Batch 2.2)
7. `refactor-ss-pdo/refact_92/evidence/` (**BARU**: Berkas log bukti `target-tests.txt`, `full-tests.txt`, `lint.txt`, `lint-root.txt`, `build.txt`, `git-diff-check.txt`)

---

## 6. Kesimpulan & Rekomendasi

Seluruh temuan revisi **R91-01, R91-02, dan R91-03** telah diselesaikan secara tuntas dan presisi tanpa mengubah logika domain pada `useBusInputForm.ts`.

Status pengerjaan: **READY_FOR_REVIEW**.  
Sesuai batasan pengerjaan, agen **berhenti di sini** dan menunggu keputusan review Codex sebelum melanjutkan ke Batch 2.3.
