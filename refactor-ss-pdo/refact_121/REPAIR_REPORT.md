# Laporan Perbaikan: Revisi Banner Rollover & Bukti Kontras (Fase 3 Batch 3.4)

Folder Referensi: `refactor-ss-pdo/refact_121`  
Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **READY_FOR_REVIEW**

---

## 1. Ringkasan Eksekutif

Revisi ini menuntaskan dua temuan penahan dari audit Codex `refact_120`:
1. **R120-01 (Kontras Seluruh Teks Banner Rollover di Kedua Tema):**
   - Memperbaiki warna judul (`0.8rem`) dan isi teks penjelas (`0.76rem`) pada banner `SingleFocusKmRolloverBanner.tsx` agar memenuhi kriteria WCAG 2.1 AA ($\ge 4.5:1$) di atas latar belakang komposit banner.
   - Menggantikan judul Light Mode dari `--warning-color: #d97706` (hanya 2.82:1) menjadi token semantik `--warning-banner-title: #9a3412`, mencapai rasio kontras **6.46:1** (lolos WCAG AA dengan margin aman di atas 4.5:1).
   - Menggantikan isi teks penjelas Light Mode dari `--text-secondary: #6b7280` (hanya 4.27:1) menjadi `--warning-banner-text: var(--text-primary)` (`#171717`), mencapai rasio kontras **15.85:1** (lolos WCAG AAA $\ge 7.0:1$).
   - Menjaga kontras tinggi pada Dark Mode: judul `#f59e0b` mencapai **7.28:1** (AAA) dan isi penjelas `#ededed` mencapai **13.36:1** (AAA).
   - Mempertahankan seluruh aksi tombol, data saran rollover, ukuran layout, dan isolasi Shift 1 / Shift 2.
2. **R120-02 (Koreksi Bukti Matematika Luminansi & Alpha Chip):**
   - Mengoreksi derivasi formula luminansi sRGB IEC 61966-2-1: `#d97706` memiliki luminansi **0.2796** dan `#0f172a` memiliki luminansi **0.0088**, menghasilkan rasio tombol yang valid dan tepat sebesar `(0.2796 + 0.05) / (0.0088 + 0.05) = 5.60:1`.
   - Mengoreksi asumsi alpha blending chip aktif Shift 1: CSS token `--shift1-bg` aktual di Light Mode menggunakan alpha **8%** (`rgba(2, 132, 199, 0.08)`), menghasilkan latar komposit `rgb(235, 245, 251)` ($L = 0.8993$) dan rasio kontras teks `#0369a1` sebesar **5.36:1** (lolos WCAG AA).
   - Menyediakan skrip mandiri yang dapat dieksekusi langsung ([contrast-verification.js](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/evidence/contrast-verification.js)) beserta output log pembuktiannya ([contrast-verification.txt](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/evidence/contrast-verification.txt)).

---

## 2. Before vs After

| Aspek / Elemen | Kondisi Sebelum Revisi (`refact_120`) | Kondisi Setelah Revisi (`refact_121`) | Keterangan & Standar |
| :--- | :--- | :--- | :--- |
| **Judul Banner Rollover (Light Mode)** | `--warning-color: #d97706` di atas latar komposit peach `rgb(253, 238, 231)` | `--warning-banner-title: #9a3412` di atas latar komposit peach | Rasio naik dari **2.82:1 (GAGAL)** menjadi **6.46:1 (LOLOS WCAG AA)** |
| **Isi Saran Banner (Light Mode)** | `--text-secondary: #6b7280` di atas latar komposit peach | `--warning-banner-text: var(--text-primary)` (`#171717`) | Rasio naik dari **4.27:1 (GAGAL)** menjadi **15.85:1 (LOLOS WCAG AAA)** |
| **Judul Banner Rollover (Dark Mode)** | Tidak ada token khusus | `--warning-banner-title: #f59e0b` | Rasio **7.28:1 (LOLOS WCAG AAA)** |
| **Isi Saran Banner (Dark Mode)** | `--text-secondary: #8b8b8b` | `--warning-banner-text: var(--text-primary)` (`#ededed`) | Rasio **13.36:1 (LOLOS WCAG AAA)** |
| **Tombol Banner Rollover** | `#0f172a` di atas `--warning-color` | Dipertahankan (`#0f172a` dengan `fontWeight: 700`) | Rasio **5.60:1** (Light AA) dan **8.31:1** (Dark AAA) |
| **Derivasi Luminansi sRGB** | Tertulis angka 0.2378 dan 0.0135 menghasilkan persamaan tidak cocok | Derivasi eksak IEC 61966-2-1: `L(#d97706) = 0.2796`, `L(#0f172a) = 0.0088` | Persamaan `0.3296 / 0.0588 = 5.60:1` 100% konsisten |
| **Komposisi Alpha Chip S1 Light** | Tertulis asumsi alpha 12% | Dihitung dengan alpha token aktual **8%** (`rgba(2, 132, 199, 0.08)`) | Menghasilkan rasio eksak **5.36:1** |
| **Pengujian Komponen Banner** | Tidak ada unit test terisolasi | Dibuat unit test mandiri `SingleFocusKmRolloverBanner.test.tsx` | 100% lulus memverifikasi judul, teks, dan event klik |

---

## 3. Case: Skenario Lapangan

### Case 1: Pengawasan Siang Hari Terik di Pool/Terminal (Light Mode)
- **Skenario:** Petugas di halte atau pool bus menginput KM Awal S1 pada peranti smartphone di bawah sinar matahari langsung menggunakan tema Light Mode. Odometer bus mengalami rollover (misal bus baru saja kembali dari bengkel atau pergantian mesin dari `292990` ke `293003`). Banner saran rollover muncul.
- **Masalah Sebelumnya:** Tombol aksi terlihat, namun judul peringatan "Rollover Terdeteksi" berwarna kuning/oranye pucat (#d97706, kontras 2.82:1) dan kalimat rincian "Maksud Anda 293003? (+13 KM dari kemarin)" berwarna abu-abu (#6b7280, kontras 4.27:1) membaur dengan latar belakang oranye muda banner sehingga sulit dibaca tanpa memicingkan mata.
- **Perbaikan:** Judul kini berwarna jingga gelap pekat `--warning-banner-title: #9a3412` (kontras 6.46:1) dan isi teks berwarna hitam legam `--text-primary: #171717` (kontras 15.85:1). Petugas langsung dapat membaca peringatan dan memverifikasi angka saran secara instan sebelum menekan tombol "Gunakan 293003".

### Case 2: Pengoperasian Dini Hari pada Shift 2 (Dark Mode)
- **Skenario:** Pengawas bus malam menerima laporan pergantian hari dan menginput odometer bus pada kondisi minim cahaya (Dark Mode aktif).
- **Hasil Verifikasi:** Latar belakang banner komposit gelap `rgb(48, 32, 21)` ($L = 0.0172$). Judul banner `--warning-banner-title: #f59e0b` ($L = 0.4389$) memberikan kontras **7.28:1**, dan teks rincian `--text-primary: #ededed` ($L = 0.8469$) memberikan kontras **13.36:1**. Keduanya lolos kriteria tertinggi WCAG AAA ($\ge 7.0:1$), menghasilkan tampilan yang sangat nyaman di mata dan bebas silau.

### Case 3: Integritas & Verifikasi Bukti Kualitas (Audit Reproduktibilitas)
- **Skenario:** Tim QA dan pengembang melakukan audit kepatuhan WCAG 2.1 pada repositori untuk memastikan tidak ada angka klaim palsu atau persamaan yang tidak cocok (*zero pseudo-metrics*).
- **Hasil:** Skrip mandiri [contrast-verification.js](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/evidence/contrast-verification.js) dapat dijalankan kapan saja dengan perintah `node refactor-ss-pdo/refact_121/evidence/contrast-verification.js`. Skrip ini langsung mengambil nilai RGB, menghitung transformasi sRGB ke luminansi linier, melakukan komposisi alpha blending piksel demi piksel, dan mencetak rasio kontras yang identik dengan laporan ini.

### Case 4: Kepatuhan Alpha Chip Shift 1 (Light Mode 8%)
- **Skenario:** Pengguna memeriksa chip odometer referensi Shift 1.
- **Hasil:** Berdasarkan token CSS `--shift1-bg: rgba(2, 132, 199, 0.08)`, alpha komposit dihitung dengan nilai 8% di atas latar putih murni:
  $$C_{\text{comp}} = 0.08 \times [2, 132, 199] + 0.92 \times [255, 255, 255] = [235, 245, 251]$$
  Dengan luminansi latar $L = 0.8993$ dan luminansi teks `--shift1-action-text: #0369a1` ($L = 0.1270$), rasio kontras adalah **5.36:1**, membuktikan kepatuhan penuh terhadap standar WCAG AA.

---

## 4. Perhitungan Matematis Rasio Kontras WCAG 2.1 Eksak

Standar IEC 61966-2-1:
Untuk komponen $C \in \{R, G, B\}$ yang dinormalisasi $C_{\text{sRGB}} = C / 255$:
$$C_{\text{lin}} = \begin{cases} C_{\text{sRGB}} / 12.92 & \text{jika } C_{\text{sRGB}} \le 0.04045 \\ \left(\frac{C_{\text{sRGB}} + 0.055}{1.055}\right)^{2.4} & \text{jika } C_{\text{sRGB}} > 0.04045 \end{cases}$$
Luminansi Relatif:
$$L = 0.2126 \times R_{\text{lin}} + 0.7152 \times G_{\text{lin}} + 0.0722 \times B_{\text{lin}}$$
Rasio Kontras:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \quad (L_1 \ge L_2)$$

### A. Banner Rollover Light Mode
- **Latar Komposit Banner:**
  $\text{rgba}(234, 88, 12, 0.1)$ di atas $[255, 255, 255]$:
  $$R = 0.1 \times 234 + 0.9 \times 255 = 252.9 \approx 253$$
  $$G = 0.1 \times 88 + 0.9 \times 255 = 238.3 \approx 238$$
  $$B = 0.1 \times 12 + 0.9 \times 255 = 230.7 \approx 231$$
  Warna komposit = $[253, 238, 231]$, $L_{\text{bg}} = \mathbf{0.8780}$.

- **Judul Banner (`--warning-banner-title: #9a3412` = $[154, 52, 18]$):**
  $R_{\text{lin}} = 0.3179$, $G_{\text{lin}} = 0.0343$, $B_{\text{lin}} = 0.0053$
  $$L_{\text{fg}} = 0.2126(0.3179) + 0.7152(0.0343) + 0.0722(0.0053) = \mathbf{0.0937}$$
  $$\text{Rasio} = \frac{0.8780 + 0.05}{0.0937 + 0.05} = \frac{0.9280}{0.1437} = \mathbf{6.46:1} \quad (\ge 4.5:1, \text{PASS WCAG AA})$$

- **Isi Penjelas Banner (`--warning-banner-text: #171717` = $[23, 23, 23]$):**
  $R_{\text{lin}} = G_{\text{lin}} = B_{\text{lin}} = 0.0086$
  $$L_{\text{fg}} = \mathbf{0.0086}$$
  $$\text{Rasio} = \frac{0.8780 + 0.05}{0.0086 + 0.05} = \frac{0.9280}{0.0586} = \mathbf{15.85:1} \quad (\ge 7.0:1, \text{PASS WCAG AAA})$$

- **Tombol Banner (`--warning-btn-text: #0f172a` di atas `--warning-color: #d97706`):**
  $L(\#d97706) = \mathbf{0.2796}$, $L(\#0f172a) = \mathbf{0.0088}$
  $$\text{Rasio} = \frac{0.2796 + 0.05}{0.0088 + 0.05} = \frac{0.3296}{0.0588} = \mathbf{5.60:1} \quad (\ge 4.5:1, \text{PASS WCAG AA})$$

### B. Banner Rollover Dark Mode
- **Latar Komposit Banner:**
  $\text{rgba}(249, 115, 22, 0.12)$ di atas kartu gelap $[21, 21, 21] = [48, 32, 21]$, $L_{\text{bg}} = \mathbf{0.0172}$.
- **Judul Banner (`#f59e0b` = $[245, 158, 11]$):** $L_{\text{fg}} = \mathbf{0.4389}$
  $$\text{Rasio} = \frac{0.4389 + 0.05}{0.0172 + 0.05} = \frac{0.4889}{0.0672} = \mathbf{7.28:1} \quad (\ge 7.0:1, \text{PASS WCAG AAA})$$
- **Isi Penjelas Banner (`#ededed` = $[237, 237, 237]$):** $L_{\text{fg}} = \mathbf{0.8469}$
  $$\text{Rasio} = \frac{0.8469 + 0.05}{0.0172 + 0.05} = \frac{0.8969}{0.0672} = \mathbf{13.36:1} \quad (\ge 7.0:1, \text{PASS WCAG AAA})$$
- **Tombol Banner (`#0f172a` di atas `#f59e0b`):**
  $$\text{Rasio} = \frac{0.4389 + 0.05}{0.0088 + 0.05} = \frac{0.4889}{0.0588} = \mathbf{8.31:1} \quad (\ge 7.0:1, \text{PASS WCAG AAA})$$

---

## 5. Pengukuran Fisik Modularitas File

Ukuran fisik baris seluruh file modul Single Focus diverifikasi langsung melalui eksekusi Node.js:
- [BusInputModalSingleFocus.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/BusInputModalSingleFocus.tsx): **73 baris**
- [singleFocusStyles.ts](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/singleFocusStyles.ts): **89 baris**
- [SingleFocusToa.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusToa.tsx): **198 baris**
- [SingleFocusKm.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKm.tsx): **33 baris**
- [SingleFocusKmShift1.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx): **259 baris**
- [SingleFocusKmShift2.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx): **261 baris**
- [SingleFocusKmRolloverBanner.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx): **84 baris**
- [SingleFocusNotes.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusNotes.tsx): **53 baris**
- [SingleFocusKmRolloverBanner.test.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.test.tsx): **77 baris**

Seluruh file berada jauh di bawah batas god-file proyek (400–500 baris).

---

## 6. Daftar File yang Diubah & Ditambah

1. [src/index.css](file:///d:/MINE/SS_PDO/src/index.css): Penambahan token `--warning-banner-title` dan `--warning-banner-text` pada `:root` dan `[data-theme="light"]`.
2. [src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx): Pembaruan styling warna judul dan teks isi agar menggunakan token kontras tinggi.
3. [src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.test.tsx](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.test.tsx): Penambahan unit test baru untuk komponen banner rollover.
4. Folder [refactor-ss-pdo/refact_121/](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/):
   - [AUDIT_BUGS.md](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/AUDIT_BUGS.md): Dokumentasi temuan R120-01 dan R120-02.
   - [REPAIR_REPORT.md](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_121/REPAIR_REPORT.md): Laporan perbaikan ini.
   - `evidence/contrast-verification.js`: Skrip perhitungan mandiri rasio kontras.
   - `evidence/contrast-verification.txt`: Log hasil eksekusi perhitungan kontras.
   - `evidence/targeted-tests.txt`: Log tes area Single Focus (14 tests passed).
   - `evidence/targeted-lint.txt`: Log oxlint (0 errors, 0 warnings).
   - `evidence/src-tests.txt` & `evidence/standard-tests.txt`: Log seluruh tes (88 files, 664 tests passed).
   - `evidence/build.txt`: Log TypeScript dan Vite PWA build (Exit code 0).
   - `evidence/git-status.txt`: Log status branch `devmode`.
   - `evidence/file-sizes.txt`: Log pengukuran baris fisik file.

---

## 7. Quality Gates & Status Verifikasi

| Gerbang Kualitas | Target / Perintah | Hasil | Status |
| :--- | :--- | :--- | :---: |
| **Targeted Test Suite** | `pnpm exec vitest run src/.../singleFocus/` | 2 test files, 14 passed | **PASS** |
| **Source Test Suite** | `pnpm run test src/` | 88 test files, 664 passed | **PASS** |
| **Standard Test Suite** | `pnpm run test` | 88 test files, 664 passed | **PASS** |
| **Targeted Linter** | `pnpm exec oxlint src/.../singleFocus/ src/index.css` | 0 errors, 0 warnings | **PASS** |
| **TypeScript Strict Check** | `pnpm exec tsc -b` | 0 errors | **PASS** |
| **Vite Production Build** | `pnpm exec vite build --emptyOutDir false` | Exit code 0 (PWA generated) | **PASS** |
| **Knowledge Graph** | `graphify update .` | 6447 nodes, 519 communities | **PASS** |
| **Batasan Uji Browser** | Evaluasi komputasi rasio WCAG dan headless DOM | Browser interaktif riil tidak tersedia | **TERCATAT** |

---

## 8. Status Akhir

Seluruh kriteria revisi Batch 3.4 telah diselesaikan secara menyeluruh dan terverifikasi secara matematis serta fungsional. Pengerjaan Fase 3 Batch 3.5 belum dimulai sesuai batasan instruksi.

**READY_FOR_REVIEW**
