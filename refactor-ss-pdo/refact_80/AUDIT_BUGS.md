# Audit Arsitektur, Bug Domain, dan Standar Kontrak UI — Refact 80

- **Tanggal Audit:** 27 September 2026
- **Auditor:** AntiGravity / Gemini (Executor)
- **Branch:** `devmode`
- **Referensi Paket:** `refactor-ss-pdo/refact_79/GEMINI_PHASE_01.md`
- **HEAD Komit:** `2e15090ef04c7ea0e8434ce43af738fbd0b13e38`
- **Metode Pemeriksaan:** Static Code Analysis, AST Caller Mapping, Grep Verifikasi Global, dan Baseline Testing (`pnpm run test --dir src` 74 files / 524 tests pass, `pnpm run lint` 72 warnings / 0 errors, `pnpm run build` exit 0).

---

## 1. Validasi Temuan Awal (R79-01 s.d. R79-07)

Seluruh 7 temuan awal dari audit orkestrasi Codex (`refact_79`) telah diperiksa secara menyeluruh terhadap codebase aktual. Di bawah ini adalah status validasi, lokasi kode presisi, bukti teknis, dampak lapangan, serta rencana mitigasinya.

---

### R79-01 (ID Lanjutan: R80-01) — Hook Form Memusatkan Banyak Tanggung Jawab
- **Status:** **CONFIRMED** (Risiko Struktural Nyata)
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts` (970 baris fisik)
- **Pemanggil Aktif:**
  - `src/components/busCard/BusInputModal.tsx` (baris 81)
  - `src/components/busCard/modal/BusInputModalShift1.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalShift2.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalTrip.tsx` (baris 9, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalNotes.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (baris 10, menerima `BusInputFormReturn`)
- **Keparahan:** **TINGGI** (Risiko Regresi Operasional)
- **Deskripsi Bukti:**
  1. Satu file hook menangani 8 tanggung jawab sekaligus:
     - State draft nilai input (TOA S1, TOA S2, Total TOA, Manual S1, Manual S2, KM Awal/Akhir S1, KM Awal/Akhir S2, Keterangan).
     - Logika prefill odometer 3-digit dari hari kemarin (`previousDayKmAkhir2`) atau antar-shift.
     - Penanganan event keyboard & fokus navigasi Enter (`handleInputKeyDown`, `handleInputFocus`).
     - Deteksi rollover odometer 6-digit dan kalkulasi saran perbaikan.
     - Derivasi kalkulasi jarak KM tempuh (`kmDistanceS1`, `kmDistanceS2`, `kmLiveS1`, `kmLiveS2`).
     - Validasi form menyeluruh (cross-shift, cross-day, batas wajar jarak tempuh, TOA <= 999).
     - Penyusunan payload bus dan eksekusi penyimpanan ke Google Sheets / antrean offline.
     - Penanganan pergantian bus target saat modal tetap terbuka.
  2. Komponen presentasional (`Shift1`, `Shift2`, `Trip`, `Notes`) tidak menerima props data murni, melainkan seluruh objek `BusInputFormReturn`. Setiap perubahan state kecil (misal pengetikan 1 karakter di catatan) memicu re-render pada seluruh cabang komponen modal.
- **Dampak User:**
  - Perubahan logika di satu bagian (misal perbaikan batas rollover) rawan memicu bug sampingan pada alur single-focus atau alur shift lainnya.
  - Penurunan responsivitas ketikan di ponsel berspesifikasi rendah saat modal form aktif.
- **Mitigasi:**
  - Dekomposisi modular pada **Fase 3**:
    1. `useBusDraftState`: Mengelola state nilai input murni dan reset/switching bus.
    2. `useBusOdometerPrefill`: Menangani prefill 3 digit dan deteksi rollover.
    3. `useBusFormValidation`: Menangani validasi bisnis dan perakitan pesan error.
    4. `useBusFormKeyboardNav`: Menangani Enter-to-save dan fokus transisi antar-field.
  - Sub-komponen `Shift1` dan `Shift2` diubah kontraknya agar hanya menerima field props spesifik yang dibutuhkan.

---

### R79-02 (ID Lanjutan: R80-02) — Duplikasi Aturan Gaya Kontrol Shift 1 dan Shift 2
- **Status:** **CONFIRMED** (Duplikasi Gaya Terverifikasi)
- **Lokasi Kode:**
  - `src/components/busCard/modal/BusInputModalShift1.tsx:43-76`
  - `src/components/busCard/modal/BusInputModalShift2.tsx:49-80`
- **Keparahan:** **SEDANG** (Inkonsistensi Pemeliharaan UI)
- **Deskripsi Bukti:**
  Tiga blok objek inline style diduplikasi 100% karakter per karakter antara Shift 1 dan Shift 2:
  ```ts
  // Ditemukan identik pada kedua file:
  const heroInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1.5px solid var(--card-border, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.35)",
    color: "var(--text-primary, #ededed)",
    fontSize: "1.15rem",
    fontWeight: 800,
    boxSizing: "border-box",
    textAlign: "left",
  };
  const secondaryInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
    background: "rgba(0, 0, 0, 0.25)",
    color: "var(--text-primary, #ededed)",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };
  const getChipStyle = (isActive: boolean): React.CSSProperties => ({ ... });
  ```
  Selain style, pola tata letak accordion KM Awal (tombol toggle Chevron, label status, dan input field) memiliki struktur visual yang sama persis namun diimplementasikan berulang.
- **Dampak User:**
  - Jika kontras atau ukuran padding diperbaiki pada Shift 1 agar ramah di bawah terik matahari, perbaikan tersebut berpotensi tertinggal di Shift 2.
- **Mitigasi:**
  - Menjadikan perapihan kontrol ini sebagai **Pilot Reusable Component pada Fase 2**:
    - Ekstrak primitif input field bersama (`FormFieldHero`, `FormFieldSecondary`, `StatusChoiceChip`) dengan props sempit.
    - Menjaga independensi logika domain per shift (Shift 1 memiliki relasi KM kemarin, Shift 2 memiliki relasi KM Shift 1 dan akumulasi Total TOA).

---

### R79-03 (ID Lanjutan: R80-03) — Kontrak Implementasi Modal Belum Seragam
- **Status:** **CONFIRMED** (Inkonsistensi Arsitektur Modal Terverifikasi)
- **Lokasi Kode:**
  - `src/components/busCard/BusInputModal.tsx:59-79` (Portal `document.body`, Escape event listener, hardcoded body overflow `""`, z-index 99999, tanpa Android back handler).
  - `src/components/pdoReport/ReportModalLayout.tsx:30-45` (Portal `document.body`, `useMobileBackHandler`, simpan `prevOverflow`, tanpa Escape event listener, z-index `.modal-overlay`).
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:94-110` (**Tanpa Portal / inline DOM**, tanpa Escape listener, tanpa scroll lock body, tanpa Android back handler, z-index lokal 1000).
  - `src/components/dashboard/QueueModal.tsx:30-43` (**Tanpa Portal**, Escape listener, hardcoded body overflow `""`, z-index 100).
  - `src/components/accumulation/AccumulationSheet.tsx:99` (Portal `document.body`, touch swipe gesture, tanpa Escape listener).
- **Keparahan:** **SEDANG** (Kerapuhan UX Navigasi Mobile)
- **Deskripsi Bukti:**
  Terdapat perbedaan mendasar dalam penanganan dialog/modal:
  1. *Mounting Point:* Ada yang menggunakan `createPortal(..., document.body)` untuk keluar dari stacking context parent (seperti `BusInputModal`), namun ada modal berat seperti `MonitoringRouteDetailModal` yang dirender inline dalam pohon DOM lokal.
  2. *Tombol Kembali Android (Hardware Back):* Hanya `ReportModalLayout` yang mengimplementasikan `useMobileBackHandler`. Pada modal lain, menekan tombol Back fisik Android akan menyebabkan browser melakukan navigasi mundur alih-alih menutup modal.
  3. *Body Scroll Lock Leak:* `BusInputModal` dan `QueueModal` menimpa `document.body.style.overflow = ""`. Jika modal dibuka di atas modal lain yang sedang aktif, penutupan modal kedua akan membuka scroll lock pada modal pertama.
- **Dampak User:**
  - Petugas di lapangan yang menekan tombol kembali Android pada form input bus berisiko keluar dari sesi/halaman secara tidak sengaja.
  - Pada layar monitoring detail rute, halaman di belakang modal masih dapat tergulir saat pengguna mengusap modal.
- **Mitigasi:**
  - Menetapkan **Kontrak Baku Modal Shell** pada Fase 2:
    - Wrapper standar yang mengintegrasikan: `createPortal`, stack-safe scroll lock, `useMobileBackHandler`, Escape key dismissal, backdrop click, serta atribut ARIA (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
    - Migrasi modular dilakukan bertahap dari Fase 2 (pilot), Fase 3 (bus modal), Fase 4 (monitoring modal), hingga Fase 5 (modal lainnya).

---

### R79-04 (ID Lanjutan: R80-04) — CSS Global Besar dan Inline Styles Tersebar
- **Status:** **CONFIRMED**
- **Lokasi Kode:**
  - `src/index.css` (2.165 baris fisik)
  - 1.472 kemunculan `style={` pada komponen TSX non-test
- **Keparahan:** **SEDANG** (Beban Perawatan & Risiko Konflik Cascade)
- **Deskripsi Bukti:**
  1. `src/index.css` memadukan token CSS variabel tema dasar (baris 1-70), reset HTML, kelas utility global, hingga styling spesifik komponen fitur individual (`.bus-card`, `.route-card`, `.monitoring-tab`, `.pdo-table`).
  2. Terdapat perubahan lokal pada `src/index.css` di working tree saat ini (terkait visual chart monitoring) yang wajib dipertahankan.
  3. Inline styles banyak digunakan untuk properti statis yang berulang (misal font-weight, padding, border-radius) alih-alih menggunakan utility token atau modul CSS terkait.
- **Dampak User:**
  - Perubahan token tema berisiko tidak berdampak pada komponen yang menggunakan warna hardcoded di inline styles.
  - Ukuran file CSS tunggal yang terus membesar memperlambat rendering awal.
- **Mitigasi:**
  - Pertahankan inline styles untuk nilai dinamis murni (misal: persentase progress bar, koordinat touch geser, tinggi viewport dinamis).
  - Pindahkan aturan visual statis berulang ke token CSS atau modul CSS berbasis fitur secara bertahap pada **Fase 2 dan 5**, dengan tetap menjaga urutan cascade dan mendukung penuh 2 tema (Light & Dark Mode).

---

### R79-05 (ID Lanjutan: R80-05) — Fallback Ritase Membulatkan Trip Ganjil
- **Status:** **CONFIRMED** (Aritmatika Domain Tak Tepat)
- **Lokasi Kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:73`
  ```ts
  const totalRitasePp = route.totalRitasePp !== undefined
    ? route.totalRitasePp
    : route.totalTrips
    ? Math.round(route.totalTrips / 2) // <-- BUG
    : 0;
  ```
- **Keparahan:** **TINGGI** (Pelanggaran Aturan Emas Integritas Data Operasional)
- **Deskripsi Bukti:**
  1. Berdasarkan aturan proyek di `AGENTS.md` dan `.agents/AGENTS.md`:
     - *1 Ritase / Rit = 1 Putaran Penuh (PP) = 2 Trip.*
     - *Dilarang memotong atau membulatkan angka desimal secara sepihak.*
  2. Pada kondisi data spreadsheet/API di mana field `totalRitasePp` kosong/tidak terisi dan sistem melakukan fallback dari `totalTrips`:
     - Jika `totalTrips = 101`, maka kalkulasi seharusnya adalah 101 / 2 = 50,5 ritase PP.
     - Kode saat ini mengeksekusi `Math.round(101 / 2) = Math.round(50.5) = 51`. Nilai terkatrol naik sebesar 0,5 ritase PP.
  3. Kesalahan ini merambat ke metrik turunan pada baris 80-82:
     ```ts
     const ritasePerBus = ... : realops > 0 ? (totalRitasePp / realops).toFixed(1) : 0;
     ```
     Jika `realops = 10`, maka ritase per bus terhitung `5.1` alih-alih `5.05` (atau `5.1` dengan dasar angka yang salah).
  4. Pencarian grep global membuktikan bahwa komponen lain (`BusInputModalTrip.tsx` dan `regionalIngestionService.ts`) sudah menggunakan pembagian desimal murni `.toFixed(1)`. `MonitoringRouteDetailModal.tsx` adalah satu-satunya lokasi yang melakukan `Math.round(totalTrips / 2)`.
- **Dampak User:**
  - Pengawas wilayah melihat ringkasan ritase 51 ritase (kelebihan 0,5 ritase PP) pada rute dengan total trip ganjil saat nilai fallback aktif.
- **Mitigasi:**
  - Ubah fallback kalkulasi menjadi presisi desimal tanpa pembulatan integer sepihak:
    ```ts
    const totalRitasePp = route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.totalTrips
      ? Number((route.totalTrips / 2).toFixed(1))
      : 0;
    ```
  - Buat test suite komprehensif pada **Fase 2 (Batch 2.1)** yang mencakup:
    - 101 trip -> 50,5 ritase PP
    - 100 trip -> 50 ritase PP
    - 0 trip -> 0 ritase PP
    - Prioritas nilai sumber eksplisit `totalRitasePp` tetap terjaga.

---

### R79-06 (ID Lanjutan: R80-06) — String Label Validasi Error Hardcoded di Hook
- **Status:** **CONFIRMED** (Pelanggaran Standar Kamus Teks Sentral)
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts:757` (`"TOA Shift 2"`)
  - `src/components/busCard/modal/useBusInputForm.ts:767` (`"Shift 2"`)
  - `src/components/busCard/modal/useBusInputForm.ts:724` (`"Shift 1"`)
  - `src/components/busCard/modal/useBusInputForm.ts:730` (`"Shift 1"`)
  - `src/components/busCard/modal/useBusInputForm.ts:742` (`"Shift 2"`)
- **Keparahan:** **SEDANG** (Kerapuhan Teks UI & Validasi)
- **Deskripsi Bukti:**
  1. Label string `"TOA Shift 2"`, `"Shift 1"`, dan `"Shift 2"` ditulis sebagai string literal langsung di dalam logika validasi hook.
  2. Nilai ini diteruskan ke `validateToaValue()` dan `validateKmPair()`, yang kemudian diinterpolasi ke template SweetAlert2 di `TEXT_ALERTS.BUS_INPUT_MODAL.TOA_MUST_BE_POSITIVE(fieldLabel)` dan `KM_AKHIR_LESS_THAN_AWAL(shift, ...)`.
  3. Pemeriksaan pada `src/constants/texts/text_alerts.ts` menunjukkan bahwa konstanta `LABEL_TOA_S1` sudah ada, namun `LABEL_TOA_S2`, `LABEL_SHIFT_1`, dan `LABEL_SHIFT_2` belum terdaftar pada kamus `BUS_INPUT_MODAL`.
- **Dampak User:**
  - Inkonsistensi kata dan risiko label error tidak seragam jika terjadi pembaruan terminologi kamus sentral di masa mendatang.
- **Mitigasi:**
  - Daftarkan konstanta sentral pada `src/constants/texts/text_alerts.ts`:
    - `LABEL_TOA_S2: 'TOA Shift 2'`
    - `LABEL_SHIFT_1: 'Shift 1'`
    - `LABEL_SHIFT_2: 'Shift 2'`
  - Tambahkan unit test pada `src/constants/texts/texts.test.ts`.
  - Migrasikan seluruh pemanggilan literal di hook ke entri kamus pada **Fase 2 / 3**.

---

### R79-07 (ID Lanjutan: R80-07) — Diskrepansi Status Tooling pada Dokumen Historis
- **Status:** **CONFIRMED** (Klarifikasi Dokumentasi Historis)
- **Lokasi Kode:**
  - `roadmap-to-production-grade/roadmap-menuju-production-grade 1.md`
  - `graphify-out/GRAPH_REPORT.md:12`
- **Keparahan:** **RENDAH** (Dokumentasi & Navigasi)
- **Deskripsi Bukti:**
  1. Dokumen arsip lama menyebutkan belum adanya test runner resmi dan TypeScript belum strict mode.
  2. Fakta aktual codebase saat ini:
     - `tsconfig.app.json` mengaktifkan `strict: true`.
     - Proyek memiliki 74 test files dengan 524 test cases yang lulus 100% via Vitest.
     - Laporan `graphify-out/GRAPH_REPORT.md` mencantumkan commit lama (`67c14813`), berbeda dari baseline saat ini.
- **Dampak User:**
  - Berpotensi mengecoh analis atau developer baru yang membaca arsip lama.
- **Mitigasi:**
  - Menandai dokumen `roadmap-to-production-grade/` sebagai dokumen arsip historis.
  - Memperbarui baseline resmi pada seri laporan `refact_80` dan menjalankan `graphify update .` otomatis setelah perubahan kode aplikasi.

---

## 2. Temuan Tambahan Baru Refact 80 (R80-08 s.d. R80-10)

Berdasarkan audit mendalam atas 167 file komponen dan integrasi layout, ditemukan 3 temuan baru yang krusial untuk kestabilan aplikasi:

---

### R80-08 — God Component pada Modal Detail Rute Monitoring (831 Baris)
- **Status:** **CONFIRMED** (Arsitektur Hotspot Baru)
- **Lokasi Kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (831 baris fisik)
- **Keparahan:** **TINGGI** (Kompleksitas & Kerapuhan Fitur Monitoring)
- **Deskripsi Bukti:**
  1. File ini melebihi batas panduan arsitektur (maksimal 400-500 baris) dengan 831 baris.
  2. Komponen mencampuradukkan 5 ranah tanggung jawab sekaligus:
     - Logika state tab internal (3 tab: Operasional, Pelanggan, Produktivitas).
     - Derivasi agregasi angka operasional (`paxPerKm`, `ritasePerBus`, `paxPerBus`, `totalRitasePp`).
     - Render modal dialog & backdrop lokal.
     - Render tabel data armada bus rute beserta badge status dan highlight.
     - Render grafik visual indikator produktivitas.
- **Dampak User:**
  - Setiap penyesuaian tata letak kartu armada berisiko merusak kalkulasi tab ringkasan atau memicu kegagalan render modal secara keseluruhan.
- **Mitigasi:**
  - Jadwalkan dekomposisi pada **Fase 4**:
    - `MonitoringRouteDetailModal.tsx` (Orchestrator modal shell & tabs, < 180 baris).
    - `RouteDetailOperationalTab.tsx` (Tab Ringkasan Operasional & Tabel Armada).
    - `RouteDetailPaxShiftTab.tsx` (Tab Rincian Pelanggan & Pembagian Shift).
    - `RouteDetailProductivityTab.tsx` (Tab Produktivitas Ritase & KM).
    - `useRouteDetailMetrics.ts` (Hook murni derivasi metrik agregasi).

---

### R80-09 — Hotspot Single-Focus Odometer Input Modal (805 Baris)
- **Status:** **CONFIRMED** (Hotspot Form Input Bus)
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (805 baris fisik)
- **Keparahan:** **SEDANG** (Kompleksitas Komponen Mobile Form)
- **Deskripsi Bukti:**
  1. Menangani antarmuka khusus single-field input dengan tombol virtual numeric keypad, prefill guidance, rollover suggestion, dan navigasi Enter.
  2. Memiliki banyak logika inline styling dan duplikasi kode penanganan keypad numerik.
- **Dampak User:**
  - Sulit melakukan penyesuaian tata letak keypad pada layar HP kecil tanpa mengganggu logika fokus form.
- **Mitigasi:**
  - Dekomposisi pada **Fase 3**: Pisahkan perenderan keypad virtual numerik dan banner saran rollover menjadi komponen terisolasi (`VirtualKeypad`, `RolloverSuggestionBanner`).

---

### R80-10 — Nested Body Scroll Lock Leak pada Multiple Modals
- **Status:** **CONFIRMED** (Bug Perilaku Mobile Terverifikasi)
- **Lokasi Kode:**
  - `src/components/busCard/BusInputModal.tsx:77` (`document.body.style.overflow = ""`)
  - `src/components/dashboard/QueueModal.tsx:41` (`document.body.style.overflow = ""`)
- **Keparahan:** **SEDANG** (Kerapuhan UX Layar Sentuh Mobile)
- **Deskripsi Bukti:**
  1. Cleanup function `useEffect` saat modal ditutup langsung mengeksekusi `document.body.style.overflow = ""`.
  2. Skenario: Pengguna membuka `BusInputModal` (body terkunci `overflow: hidden`). Dari dalam modal tersebut, jika muncul modal dialog kedua (misal: modal antrean offline `QueueModal` atau modal bantuan), penutupan modal kedua akan mereset `overflow` body menjadi `""`. Akibatnya, `BusInputModal` yang masih aktif di layar kehilangan scroll lock-nya.
- **Dampak User:**
  - Di perangkat seluler layar sentuh, pengguna yang mengusap form secara tidak sengaja akan menggulir halaman dashboard di latar belakang, merusak orientasi visual pengguna di lapangan.
- **Mitigasi:**
  - Gunakan mekanisme stack-aware scroll lock pada modul modal foundation (**Fase 2**), atau gunakan pendekatan penyimpanan `prevOverflow` seperti pada `ReportModalLayout.tsx` yang mencatat status sebelumnya secara tepat.
