# Laporan Perbaikan Batch 2.2 — Refact 90

Tanggal: 27 September 2026  
Auditor/Pelaksana: Gemini (executor)  
Branch: `devmode`  
Keputusan: **READY_FOR_REVIEW**

Laporan ini mendokumentasikan penyelesaian **Fase 2, Batch 2.2** untuk menutup temuan **R79-02 / R80-02** mengenai eliminasi duplikasi kontrol input dan chip pilihan pada `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`. Seluruh perubahan lokal sebelumnya dan berkas dokumentasi historis (`refact_84` s.d. `refact_89`) dipertahankan sepenuhnya tanpa modifikasi.

---

## 1. Ringkasan Eksekutif & Status Perbaikan

| ID Temuan | Komponen / Berkas | Status Implementasi | Status Verifikasi |
| :--- | :--- | :--- | :--- |
| **R79-02 / R80-02** | `fields/BusFormField.tsx`, `fields/ShiftOptionChip.tsx`, `BusInputModalShift1.tsx`, `BusInputModalShift2.tsx`, `text_alerts.ts`, `texts.test.ts` | **SELESAI (FIXED)** | **100% LULUS** (Target 3 file / 40 test pass; Full suite 75 file / 541 test pass; Build exit 0; Lint 0 error) |
| **R89-01** | `dist_old/assets/` & `graphify-out/` | **TERCATAT SECARA JUJUR** | Tooling note: `dist_old/` tidak disentuh/dihapus sesuai mandat; kontaminasi dicatat transparan |

---

## 2. Rincian Implementasi (Before vs After)

### A. Ekstraksi Komponen Form Field Terarah (`fields/BusFormField.tsx`)

#### Before:
Objek style terduplikasi di `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx` dengan warna gelap hardcoded (`#181C24`):
```tsx
const heroInputStyle: React.CSSProperties = {
  backgroundColor: "#181C24",
  border: "1px solid var(--border-color, #2A303C)",
  borderRadius: "12px",
  color: "var(--text-primary, #FFFFFF)",
  fontSize: "1.25rem",
  fontWeight: "700",
  height: "52px",
  outline: "none",
  textAlign: "center",
  width: "100%",
};

const secondaryInputStyle: React.CSSProperties = {
  backgroundColor: "#181C24",
  border: "1px solid var(--border-color, #2A303C)",
  borderRadius: "10px",
  color: "var(--text-primary, #FFFFFF)",
  fontSize: "0.95rem",
  fontWeight: "600",
  height: "42px",
  outline: "none",
  textAlign: "center",
  width: "100%",
};
```
Markup div pembungkus, label, badge, dan input HTML ditulis ulang 4–6 kali di masing-masing modal.

#### After:
Diekstrak ke komponen murni dan ringan `src/components/busCard/modal/fields/BusFormField.tsx` dengan props kontraktual yang jelas, mendukung `forwardRef`, serta mengadopsi token tema adaptif:
```tsx
export interface BusFormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "hero" | "secondary";
  label: string;
  suffix?: string;
  helperText?: string;
  helperType?: "error" | "info" | "warning";
  containerClassName?: string;
  isLocked?: boolean;
}

export const BusFormField = forwardRef<HTMLInputElement, BusFormFieldProps>(
  (
    {
      variant = "hero",
      label,
      suffix,
      helperText,
      helperType = "info",
      containerClassName = "",
      isLocked = false,
      id,
      disabled,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    ref,
  ) => {
    // Memakai var(--input-bg, #181C24) dan adaptif untuk Light Mode serta Disabled/Locked
    const inputStyle: CSSProperties = {
      backgroundColor: isDisabledOrLocked ? "var(--card-bg, #1E232D)" : "var(--input-bg, #181C24)",
      border: `1px solid ${isFocused ? "var(--accent-color, #3ECF8E)" : "var(--border-color, #2A303C)"}`,
      color: isDisabledOrLocked ? "var(--text-disabled, #6B7280)" : "var(--text-primary, #FFFFFF)",
      ...variantStyles[variant],
      ...style,
    };
    // ...
  }
);
```

---

### B. Ekstraksi Komponen Chip Pilihan (`fields/ShiftOptionChip.tsx`)

#### Before:
Fungsi `getChipStyle(isActive)` dan tombol toggle diduplikasi di kedua modal:
```tsx
const getChipStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? "rgba(62, 207, 142, 0.12)" : "transparent",
  border: active
    ? "1px solid var(--accent-color, #3ECF8E)"
    : "1px solid var(--border-color, #2A303C)",
  color: active
    ? "var(--accent-color, #3ECF8E)"
    : "var(--text-secondary, #9CA3AF)",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "0.8rem",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.15s ease",
  outline: "none",
});
```

#### After:
Diekstrak ke `src/components/busCard/modal/fields/ShiftOptionChip.tsx` dengan transisi pegas iOS fluid Apple (`cubic-bezier(0.32, 0.72, 0, 1)`), aksesibilitas keyboard (`role="button"`, `aria-pressed`, `tabIndex={0}`), dan menerima teks dari pemanggil/kamus.

---

### C. Standardisasi Kamus Teks Sentral (`text_alerts.ts` & `texts.test.ts`)

#### Before:
Label tombol chip aktif di-hardcode dengan string template JSX di `BusInputModalShift1.tsx` dan `BusInputModalShift2.tsx`:
```tsx
{showManual1
  ? `✓ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_SHIFT_1}`
  : `+ ${TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_SHIFT_1}`}
```

#### After:
Ditambahkan fungsi template murni pada kamus sentral `src/constants/texts/text_alerts.ts`:
```ts
CHIP_ACTIVE_LABEL: (label: string) => `✓ ${label}`,
```
Serta dipanggil secara rapi pada kedua modal:
```tsx
<ShiftOptionChip
  isActive={showManual1}
  onClick={() => setShowManual1(!showManual1)}
  label={
    showManual1
      ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL(
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_SHIFT_1,
        )
      : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ADD_LABEL(
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_SHIFT_1,
        )
  }
/>
```
Dan diverifikasi dengan uji integritas pada `src/constants/texts/texts.test.ts`:
```ts
expect(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL("Catatan")).toBe("✓ Catatan");
expect(TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_LABEL("Manual TOA")).toBe("✓ Manual TOA");
```

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan Menginput TOA dan Odometer pada Perangkat Ponsel (Mobile Light & Dark Mode)
- **Kondisi Lapangan:** Petugas pengawas bertugas di terminal bus saat siang hari terik menggunakan tema terang (Light Mode).
- **Sebelum Perbaikan:** Input field memiliki background statis gelap `#181C24`, kontras dengan tema terang halaman aplikasi sehingga terlihat kaku, terisolasi, dan menurunkan keterbacaan label angka.
- **Sesudah Perbaikan:** `BusFormField` mengadopsi variabel dinamis `var(--input-bg)`. Di Light Mode, latar belakang input field beradaptasi secara elegan mengikuti palet terang sistem, dan di Dark Mode mempertahankan kontras modern.

### Skenario 2: Odometer Shift 2 Terkunci Otomatis dari KM Akhir Shift 1
- **Kondisi Lapangan:** Petugas menekan tombol *"Salin dari Akhir Shift 1"* atau sistem mengunci KM Awal Shift 2 (`isKmAwal2Locked = true`).
- **Sebelum Perbaikan:** Style disabled diterapkan secara manual di inline style masing-masing berkas dengan kemungkinan terlewat saat ada penambahan status kunci baru.
- **Sesudah Perbaikan:** `BusFormField` secara otomatis menerapkan visual styling `isLocked` dan `disabled` (latar `var(--card-bg)`, teks `var(--text-disabled)`, `cursor: not-allowed`, `user-select: none`) secara konsisten di seluruh shift tanpa modifikasi logika state.

### Skenario 3: Alur Keyboard Enter-to-Submit & Scrolling Fokus Mobile
- **Kondisi Lapangan:** Petugas mengetik angka penumpang pada input Hero TOA lalu menekan tombol `Enter` pada virtual keyboard ponsel.
- **Sebelum Perbaikan:** Event handler `onFocus` dan `onKeyDown` diteruskan secara manual ke elemen input mentah di puluhan baris kode.
- **Sesudah Perbaikan:** `BusFormField` meneruskan seluruh event handler kontraktual (`onFocus`, `onKeyDown`, `onChange`, `ref`) secara transparan ke elemen input DOM bawaan. Penekanan tombol Enter memicu `form.requestSubmit()` dengan mulus.

---

## 4. Hasil Verifikasi & Quality Gates

| Gerbang Pemeriksaan | Perintah / Alat | Status | Hasil / Catatan |
| :--- | :--- | :--- | :--- |
| **Target Unit Tests** | `pnpm vitest run src/components/busCard/modal/fields/BusFormField.test.tsx src/components/busCard/modal/useBusInputForm.test.tsx src/constants/texts/texts.test.ts` | **PASS** | 3 berkas lulus, **40 / 40 tes lulus** (0 gagal) |
| **Full Project Tests** | `pnpm run test --dir src` | **PASS** | 75 berkas uji lulus, **541 / 541 tes lulus** (100% pass) |
| **TypeScript Strict & Bundling** | `pnpm run build` (`tsc -b && vite build`) | **PASS** | Exit code 0, aset Vite ter-bundle sempurna |
| **Linting Proyek** | `pnpm run lint` / `pnpm dlx oxlint src` | **PASS** | 0 error pada seluruh berkas kode sumber |
| **Pembaruan Graf Pengetahuan** | `graphify update .` | **PASS** | Graf terbarukan (5.747 nodes, 9.654 edges, 426 komunitas) |

---

## 5. Catatan Tooling & Kontaminasi Graf (R89-01)

Sesuai instruksi Codex dan aturan pengerjaan:
1. Direktori `dist_old/` berisi berkas minifikasi lama yang terkunci di sistem Windows dipertahankan tanpa manipulasi, penghapusan, atau pemindahan.
2. Kehadiran `dist_old/` menyebabkan:
   - Graf pengetahuan mencatat 5.747 node (melebihi limit agregasi 5.000).
   - Linter root mencatat 1.868 peringatan (sebagian besar dari bundle minifikasi `dist_old/`).
3. Verifikasi kode sumber yang bersih dilakukan terfokus pada `src/`, dengan **0 error**.

---

## 6. Daftar Berkas yang Diubah / Ditambah

1. `src/constants/texts/text_alerts.ts` (Penambahan `CHIP_ACTIVE_LABEL` template fungsi murni)
2. `src/constants/texts/texts.test.ts` (Uji integritas kamus untuk `CHIP_ACTIVE_LABEL`)
3. `src/components/busCard/modal/fields/BusFormField.tsx` (**BARU**: Komponen field input reusable varian hero & secondary)
4. `src/components/busCard/modal/fields/ShiftOptionChip.tsx` (**BARU**: Komponen option chip reusable untuk Manual TOA & Catatan)
5. `src/components/busCard/modal/fields/BusFormField.test.tsx` (**BARU**: Uji unit komprehensif untuk komponen baru dan integrasi modal)
6. `src/components/busCard/modal/BusInputModalShift1.tsx` (Refactor menggunakan `BusFormField` dan `ShiftOptionChip`)
7. `src/components/busCard/modal/BusInputModalShift2.tsx` (Refactor menggunakan `BusFormField` dan `ShiftOptionChip`)
8. `refactor-ss-pdo/refact_90/AUDIT_BUGS.md` (**BARU**: Audit temuan R79-02/R80-02 dan R89-01)
9. `refactor-ss-pdo/refact_90/REPAIR_REPORT.md` (**BARU**: Laporan komprehensif perbaikan Batch 2.2)
10. `refactor-ss-pdo/refact_90/evidence/` (**BARU**: Log bukti verifikasi build, target-tests, full-tests, lint)

---

## 7. Kesimpulan & Rekomendasi

Fase 2, Batch 2.2 telah selesai diimplementasikan secara rapi, minimalis, dan teruji penuh tanpa mengubah logika state maupun perhitungan domain di `useBusInputForm.ts`.

Status pengerjaan saat ini: **READY_FOR_REVIEW**.  
Agen berhenti di sini untuk menunggu review dan persetujuan dari Codex sebelum melanjutkan ke Batch 2.3.
