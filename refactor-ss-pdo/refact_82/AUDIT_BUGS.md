# Audit Arsitektur, Bug Domain, dan Standar Kontrak UI — Refact 82

- **Tanggal Audit:** 27 September 2026
- **Auditor:** AntiGravity / Gemini (Executor)
- **Status Review:** Revisi Hasil Review Codex `refact_81` (R81-01 s.d. R81-06)
- **Branch:** `devmode` (Terisolasi dari branch utama)
- **HEAD Komit:** `1fb52a63db24788af7f87a0a6a02e708f8928e20`
- **Metode Pemeriksaan:** Static Code Analysis, AST Caller Mapping, Grep Verifikasi Global, Penelusuran Alur Kode (Call Graph), dan Baseline Gate Verification.

---

## 1. Validasi Temuan Codex & Koreksi Terarah (R79 / R81)

Seluruh temuan kode di bawah diperiksa secara mendalam terhadap file sumber aktual, dengan membedakan secara tegas antara **bukti kode statis terkonfirmasi**, **risiko struktural/pemeliharaan**, dan **dampak runtime yang memerlukan reproduksi lapangan**.

---

### R79-01 (Tinjauan R81-06) — Hook Form Memusatkan Banyak Tanggung Jawab
- **Status:** **CONFIRMED (Risiko Struktural & Beban Pemeliharaan)**
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts` (970 baris fisik)
- **Pemanggil Aktif:**
  - `src/components/busCard/BusInputModal.tsx` (baris 81)
  - `src/components/busCard/modal/BusInputModalShift1.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalShift2.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalTrip.tsx` (baris 9, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalNotes.tsx` (baris 8, menerima `BusInputFormReturn`)
  - `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (baris 10, menerima `BusInputFormReturn`)
- **Keparahan:** **TINGGI** (Risiko Regresi Kode pada Form Input)
- **Deskripsi Bukti Statis:**
  1. Satu file hook menangani 8 ranah tanggung jawab sekaligus:
     - State draft nilai input (TOA S1, TOA S2, Total TOA, Manual S1, Manual S2, KM Awal/Akhir S1, KM Awal/Akhir S2, Keterangan).
     - Logika prefill odometer 3-digit dari hari kemarin (`previousDayKmAkhir2`) atau antar-shift.
     - Penanganan event keyboard & fokus navigasi Enter (`handleInputKeyDown`, `handleInputFocus`).
     - Deteksi rollover odometer 6-digit dan kalkulasi saran perbaikan.
     - Derivasi kalkulasi jarak KM tempuh (`kmDistanceS1`, `kmDistanceS2`, `kmLiveS1`, `kmLiveS2`).
     - Validasi form menyeluruh (cross-shift, cross-day, batas wajar jarak tempuh, TOA $\le$ 999).
     - Penyusunan payload bus dan eksekusi penyimpanan ke Google Sheets / antrean offline.
     - Penanganan reset/pergantian bus target saat modal tetap terbuka.
  2. Seluruh subkomponen presentasional menerima satu objek raksasa `BusInputFormReturn`. Setiap pembaruan state lokal (misal ketikan karakter catatan) memicu evaluasi ulang pada cabang komponen modal.
- **Dampak User & Batas Bukti:**
  - *Dampak Terkonfirmasi:* Tingginya risiko regresi saat pengembang memodifikasi salah satu alur validasi atau navigasi keyboard.
  - *Perkiraan Risiko (Unmeasured):* Potensi beban re-render yang tidak perlu pada perangkat seluler berspesifikasi rendah. Belum ada profil waktu eksekusi/benchmark milidetik resmi yang mengukur lag ketikan secara kuantitatif.
- **Mitigasi:**
  - Dekomposisi terencana pada **Fase 3**: Memecah hook menjadi modul terfokus (`useBusDraftState`, `useBusOdometerPrefill`, `useBusFormValidation`, `useBusFormKeyboardNav`) dan mempersempit props sub-komponen `Shift1` dan `Shift2`.

---

### R79-02 (Tinjauan R81-05) — Duplikasi Aturan Gaya Kontrol Shift 1 dan Shift 2
- **Status:** **CONFIRMED (Duplikasi Gaya Terverifikasi)**
- **Lokasi Kode:**
  - `src/components/busCard/modal/BusInputModalShift1.tsx:43-76`
  - `src/components/busCard/modal/BusInputModalShift2.tsx:49-80`
- **Keparahan:** **SEDANG** (Inkonsistensi Pemeliharaan Antarmuka)
- **Deskripsi Bukti Statis:**
  Tiga blok objek inline style diduplikasi 100% karakter per karakter antara Shift 1 dan Shift 2:
  ```ts
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
  Konsumen nyata dari `getChipStyle` pada kedua file adalah **tombol toggle Manual dan Keterangan/Catatan** (`BusInputModalShift1.tsx:402, 412` dan `BusInputModalShift2.tsx:404, 414`), bukan status armada SGO/AP/AC.
- **Dampak User:**
  - Perubahan token warna, kontras teks, atau ukuran kontrol pada Shift 1 berpotensi tertinggal di Shift 2.
- **Mitigasi:**
  - Pilot bersama pada **Fase 2 (Batch 2.2)**: Ekstrak `BusFormField` (hero & secondary) serta `ShiftOptionChip` (untuk tombol toggle Manual & Keterangan) dengan props sempit dan eksplisit. Menjaga domain armada tetap terpisah di fiturnya sendiri.

---

### R79-03 (Tinjauan R81-04) — Kontrak Implementasi Modal Belum Seragam
- **Status:** **CONFIRMED (Inkonsistensi Arsitektur Dialog)**
- **Lokasi Kode:**
  - `src/components/busCard/BusInputModal.tsx:59-79` (Portal `document.body`, Escape event listener, body overflow `""`, z-index 99999).
  - `src/components/pdoReport/ReportModalLayout.tsx:30-45` (Portal `document.body`, `useMobileBackHandler`, simpan `prevOverflow`, tanpa Escape event listener).
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:94-110` (Inline DOM non-portal, tanpa Escape listener, tanpa scroll lock, tanpa mobile back handler, z-index lokal 1000).
  - `src/components/dashboard/QueueModal.tsx:30-43` (Inline DOM non-portal, Escape listener, body overflow `""`, z-index 100).
- **Keparahan:** **SEDANG** (Inkonsistensi Navigasi & Tumpukan Layer)
- **Deskripsi Bukti Statis:**
  Terdapat variasi arsitektur antar-dialog dalam menangani mounting portal, penutupan via tombol Escape, dan dukungan tombol Back fisik Android.
- **Dampak User:**
  - Di perangkat Android, menekan tombol kembali pada modal yang belum mengintegrasikan `useMobileBackHandler` dapat memicu navigasi browser alih-alih menutup dialog.
- **Mitigasi:**
  - Menyusun kontrak dialog terkoordinasi pada Fase 2 yang mencakup portal, penanganan Escape, dan tombol kembali Android.

---

### R79-04 (Tinjauan R81-06) — CSS Global Besar dan Inline Styles Tersebar
- **Status:** **CONFIRMED (Beban Pemeliharaan & Enkapsulasi Gaya)**
- **Lokasi Kode:** `src/index.css` (2.166 baris fisik) dan 1.472 inline `style={` di komponen TSX.
- **Keparahan:** **SEDANG** (Tantangan Maintainability)
- **Deskripsi Bukti Statis:**
  1. `src/index.css` menggabungkan token CSS variabel global, utility classes, reset layout, hingga aturan spesifik fitur (.bus-card, .monitoring-table).
  2. Inline styles banyak digunakan untuk mendefinisikan layout berulang di samping pemakaian CSS variables.
- **Dampak User & Batas Bukti:**
  - *Dampak Terkonfirmasi:* Sulit menjaga isolasi styling antar-fitur dan rawan konflik cascade jika ada penyesuaian kelas global.
  - *Perkiraan Risiko (Unmeasured):* Hipotesis perlambatan parse/render awal akibat ukuran CSS tunggal belum dibuktikan dengan metrik Lighthouse / DevTools coverage.
- **Mitigasi:**
  - Memisahkan CSS secara bertahap menurut domain fitur pada **Fase 5**, dengan tetap menjaga working tree `src/index.css` yang memiliki modifikasi lokal chart monitoring aktif.

---

### R79-05 (Tinjauan R81-02) — Fallback Ritase Membulatkan Trip Ganjil
- **Status:** **CONFIRMED (Aritmatika Domain Tak Tepat)**
- **Lokasi Kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:73`
  ```ts
  const totalRitasePp = route.totalRitasePp !== undefined
    ? route.totalRitasePp
    : route.totalTrips
    ? Math.round(route.totalTrips / 2) // <-- Pembulatan integer sepihak
    : 0;
  ```
- **Keparahan:** **TINGGI** (Penyimpangan Data SSOT Operasional)
- **Deskripsi Bukti Statis:**
  1. Berdasarkan aturan proyek di `.agents/AGENTS.md`:
     - *1 Ritase = 1 Putaran Penuh (PP) = 2 Trip.*
     - *Dilarang memotong atau membulatkan angka desimal secara sepihak.*
  2. Jika data spreadsheet tidak menyertakan `totalRitasePp`, sistem melakukan fallback dari `totalTrips`. Pada kondisi `totalTrips = 101`, eksekusi `Math.round(101 / 2)` menghasilkan `51` ritase PP, padahal nilai eksak pembagian adalah `50,5` ritase PP.
  3. Kesalahan ini merambat ke metrik turunan `ritasePerBus` pada baris 80-82 (`(totalRitasePp / realops).toFixed(1)`).
  4. Ruang lingkup pencarian: Penelusuran teks global (`grep_search`) pada folder `src/components/` dan `src/services/` memastikan bahwa baris 73 `MonitoringRouteDetailModal.tsx` adalah lokasi implementasi fallback ritase yang menggunakan `Math.round`. Komponen lain (`BusInputModalTrip.tsx` dan `regionalIngestionService.ts`) menggunakan pembagian murni `/ 2`.
- **Dampak User:**
  - Pengawas melihat kelebihan 0,5 ritase PP pada rute dengan total trip ganjil ketika fallback aktif.
- **Mitigasi Presisi Tanpa Pembulatan Tambahan (Koreksi R81-02):**
  - Formula revisi murni tanpa `Math.round` dan tanpa `.toFixed(1)`:
    ```ts
    const totalRitasePp = route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.totalTrips
      ? route.totalTrips / 2
      : 0;
    ```
  - Memisahkan data angka domain dari pemformatan tampilan.
  - Kasus uji wajib pada **Fase 2 (Batch 2.1)**:
    - 101 trip $\rightarrow$ `50.5`
    - 100 trip $\rightarrow$ `50`
    - 0 trip $\rightarrow$ `0`
    - Prioritas sumber eksplisit: jika `totalRitasePp` terdefinisi, nilainya mutlak digunakan.

---

### R79-06 — Label Validasi Error Hardcoded di Hook
- **Status:** **CONFIRMED (Pelanggaran Standar Kamus Teks Sentral)**
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusInputForm.ts:757` (`"TOA Shift 2"`)
  - `src/components/busCard/modal/useBusInputForm.ts:767` (`"Shift 2"`)
  - `src/components/busCard/modal/useBusInputForm.ts:724, 730` (`"Shift 1"`)
- **Keparahan:** **SEDANG** (Kerapuhan Lokalisasi Kamus)
- **Deskripsi Bukti Statis:**
  String literal disuntikkan ke fungsi template error `TEXT_ALERTS.BUS_INPUT_MODAL` karena entri kamus terkait belum terdaftar di `src/constants/texts/text_alerts.ts`.
- **Mitigasi:**
  - Mendaftarkan entri sentral `LABEL_TOA_S2`, `LABEL_SHIFT_1`, dan `LABEL_SHIFT_2` pada kamus `text_alerts.ts` dan menambahkan test integritas pada `texts.test.ts` di **Batch 2.1**.

---

### R79-07 — Diskrepansi Status Tooling pada Dokumen Historis
- **Status:** **CONFIRMED (Klarifikasi Dokumentasi Historis)**
- **Lokasi Kode:** `roadmap-to-production-grade/` dan `graphify-out/GRAPH_REPORT.md:12`.
- **Keparahan:** **RENDAH** (Dokumentasi)
- **Mitigasi:**
  - Menandai dokumen lama sebagai arsip historis; baseline aktif resmi mengacu pada `refact_82` dan eksekusi `graphify update .` berkala.

---

## 2. Temuan Lanjutan & Koreksi R81-04 (R80-08 s.d. R80-10)

---

### R80-08 — God Component pada Modal Detail Rute Monitoring (831 Baris)
- **Status:** **CONFIRMED (Hotspot Kompleksitas)**
- **Lokasi Kode:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (831 baris fisik)
- **Keparahan:** **TINGGI** (Struktur Monolitik Fitur Monitoring)
- **Deskripsi Bukti Statis:**
  Menggabungkan state internal tab, kalkulasi derivasi metrik agregasi, render backdrop, render tabel unit bus, dan visual indikator produktivitas.
- **Mitigasi:**
  - Dekomposisi pada **Fase 4** menjadi shell orchestrator dan 3 sub-tab mandiri (`RouteDetailOperationalTab`, `RouteDetailPaxShiftTab`, `RouteDetailProductivityTab`).

---

### R80-09 — Hotspot Single-Focus Odometer Input Modal (805 Baris)
- **Status:** **CONFIRMED (Hotspot Form Input Bus)**
- **Lokasi Kode:** `src/components/busCard/modal/BusInputModalSingleFocus.tsx` (805 baris fisik)
- **Keparahan:** **SEDANG** (Beban Pemeliharaan Komponen Mobile)
- **Mitigasi:**
  - Dekomposisi sub-komponen keypad virtual dan rollover banner pada **Fase 3**.

---

### R80-10 (Tinjauan R81-04) — Potensi Konflik Body Scroll Lock pada Dialog Bersarang
- **Status:** **CONFIRMED CONDITIONAL (Risiko Kode Terkonfirmasi, Dampak Overlap UI Belum Direproduksi di Runtime)**
- **Lokasi Kode:**
  - `src/components/busCard/BusInputModal.tsx:77` (`document.body.style.overflow = ""`)
  - `src/components/dashboard/QueueModal.tsx:41` (`document.body.style.overflow = ""`)
- **Keparahan:** **SEDANG (Kerapuhan Perilaku Penguncian Scroll)**
- **Hasil Penelusuran Alur Kode (Koreksi R81-04):**
  1. *Jalur Pemicu Aktual:* `BusInputModal` dibuka dari kartu bus di `BusList.tsx`. Di sisi lain, `QueueModal` dikendalikan oleh state `isQueueModalOpen` di `Dashboard.tsx:270` yang dipicu dari banner sinkronisasi atas pada halaman dashboard.
  2. *Tidak Ada Jalur Pembuka Langsung:* `BusInputModal` tidak mengimpor atau memicu `QueueModal`. Dengan demikian, skenario petugas membuka `QueueModal` dari dalam `BusInputModal` bukan merupakan jalur UI langsung aplikasi saat ini.
  3. *Kelemahan Penyimpanan `prevOverflow` Lokal pada Urutan Tutup Terbalik:*
     Jika Dialog A dibuka lebih dulu (menyimpan `prevOverflow = ""` dan menyetel `"hidden"`), lalu Dialog B dibuka (menyimpan `prevOverflow = "hidden"`):
     - Bila B ditutup sebelum A: B mengembalikan `"hidden"`, A masih terbuka dan terkunci (Aman).
     - Bila A ditutup sebelum B: A mengembalikan `""` (nilai awalnya), sehingga body terbuka kembali padahal Dialog B masih aktif di layar (Bocor).
- **Dampak User & Batas Bukti:**
  - *Dampak Kode:* Reset `""` secara langsung berisiko membuka scroll lock sebelum seluruh dialog selesai tertutup bila terjadi tumpukan modal.
  - *Batas Bukti:* Belum ada bukti reproduksi lapangan yang menunjukkan overlap langsung antara `BusInputModal` dan `QueueModal`.
- **Mitigasi:**
  - Menerapkan penguncian scroll berbasis **Reference Counter terpusat** (`activeModalCount`) daripada sekadar menyimpan `prevOverflow` lokal, dengan pengujian eksplisit terhadap dua urutan penutupan (A tutup sebelum B dan B tutup sebelum A).
