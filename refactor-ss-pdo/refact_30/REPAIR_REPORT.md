# REPAIR REPORT: UI/UX DE-CLUTTERING, ANTI-SLOP & FLUID RESPONSIVE UNITS (REFACTOR 30)

Laporan ini merangkum perbaikan visual, de-cluttering layout sticky header, penyederhanaan data strip kartu bus, eliminasi animasi flashing, serta modernisasi unit viewport CSS ke standar `dvh` dan fluid `clamp()` di SS_PDO.

---

## 1. DAFTAR PERUBAHAN & IMPLEMENTASI

### 🔹 1.1 Transformasi Hairline Progress Bar pada `BusList.tsx` (BUG-30-01)
- **Lokasi File:** `src/components/BusList.tsx`
- **Rincian Implementasi:**
  - Menghapus card progress setinggi 72px (`progress-section glass`) yang sebelumnya menyita area sticky.
  - Memasang **Hairline Progress Bar setinggi 3px** dengan transisi pegas halus `cubic-bezier(0.32, 0.72, 0, 1)`.
  - Menampilkan metrik progres harian ringkas (`Progres Harian` & `X/Y Unit (Z%)`) dalam baris tipografi elegan 12px.
  - Menghemat **>60px ruang vertikal layar** seketika, memungkinkan 3–4 kartu bus tampil sekaligus di layar HP.
  - Mengoptimalkan row kontrol menjadi height 38px dengan `gap: clamp(6px, 1.5vw, 8px)`.

### 🔹 1.2 Clean Data Strip pada Kartu Bus (`BusCard.tsx`) (BUG-30-02)
- **Lokasi File:** `src/components/BusCard.tsx`
- **Rincian Implementasi:**
  - Mengeliminasi 3 badge kotak tebal terpisah (Trip, KM, Pnp) yang memicu wrapping berantakan.
  - Mengubahnya menjadi **Clean Data Strip** satu kapsul tipis dengan pembatas titik halus (`•`):
    `8/8 rit • 124.5 KM • 382 Pnp`
  - Tombol trip tetap mempertahankan class `bus-card-badge-trip` dan handler interaktif `onClick` untuk membuka modal trip tanpa mengganggu event click kartu utama.
  - Menggunakan `font-variant-numeric: tabular-nums` agar angka tidak bergetar (*jitter-free*).

### 🔹 1.3 Eliminasi Animasi Flashing Offline & Fluid Layout (`index.css`) (BUG-30-03)
- **Lokasi File:** `src/index.css`
- **Rincian Implementasi:**
  - Menghapus `@keyframes pulse-warning` dan neon glow `box-shadow: 0 0 10px rgba(234, 179, 8, 0.4)`.
  - Mengubah `.status-queued` menjadi badge flat dengan background amber lembut (`rgba(249, 115, 22, 0.12)`), teks amber tajam (`var(--warning-text, #f59e0b)`), dan border 1px lembut.
  - Menerapkan fluid padding pada `.app-container`: `padding: clamp(12px, 2.5vw, 16px) ...`.

### 🔹 1.4 Modernisasi Viewport Unit `dvh` di Seluruh Modal & Sheet (BUG-30-05)
- **Lokasi File:**
  - `src/components/fleetStatus/FleetStatusModal.tsx`
  - `src/components/RouteOperationalReportCard.tsx`
  - `src/components/AccumulationSheet.tsx`
  - `src/components/UnitDetailModal.tsx`
  - `src/components/ProfileMenuSheet.tsx`
  - `src/components/QueueModal.tsx`
  - `src/components/routeSelector/AddRouteModal.tsx`
  - `src/components/routeSelector/RouteSelectorSheet.tsx`
  - `src/components/login/LegalModals.tsx`
  - `src/components/login/LoginInfoModal.tsx`
  - `src/components/WaReportModal.tsx`
  - `src/components/AllRouteMonitoringPage.tsx`
  - `src/components/UserManagementPage.tsx`
  - `src/components/Skeletons.tsx`
  - `src/index.css`
- **Rincian Implementasi:**
  - Mengganti seluruh raw `vh` statis (`85vh`, `88vh`, `90vh`, `92vh`, `100vh`) menjadi `dvh` dinamis dengan batas aman: `max-height: min(XXdvh, YYpx)`.
  - Menjamin tombol aksi bawah (Simpan, Tutup, Konfirmasi) tidak pernah terpotong di balik navigasi browser Android atau Safari iOS.

### 🔹 1.5 Pembersihan Gradien Norak & Tipografi Tren (`DailyToaTrendCard.tsx`) (BUG-30-04)
- **Lokasi File:** `src/components/DailyToaTrendCard.tsx`
- **Rincian Implementasi:**
  - Mengganti kotak gradien vertikal 90-an pada legend chart dengan dot indikator semantik bundar (hijau, oranye, merah solid).
  - Meningkatkan ukuran font mini dari 9.5px menjadi 11px dengan `tabular-nums` untuk kenyamanan visual di luar ruangan.

---

## 2. BEFORE VS AFTER COMPARISON

### 📊 Area Sticky Header Input SS
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Card Progres** | Card tebal 72px (`progress-section glass`) dengan border & padding 16px | Hairline 3px terintegrasi rapi dengan counter tipografis 12px |
| **Tinggi Sticky Total** | ~300px (menyita 45%–50% viewport ponsel) | ~190px (hemat >60px ruang vertikal) |
| **Visibilitas Bus** | Hanya 1–2 kartu bus terlihat di layar awal | 3–4 kartu bus terlihat sekaligus |

### 📊 Metrik Kartu Armada Bus
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Bentuk Metrik** | 3 kotak badge terpisah dengan background & border sendiri | Satu data strip tipografis berpemisah titik halus (`•`) |
| **Wrapping di HP 360px** | Patah baris berantakan, membuat kartu tebal dan sempit | Tetap berada dalam 1 baris ramping dan elegan |
| **Interaktivitas Trip** | Tetap aktif dengan tap target nyaman | Tetap aktif dengan tap target nyaman |

### 📊 Status Antrean Offline
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Animasi** | `pulse-warning` 2s infinite berkedip-kedip | Statis, tenang, tidak ada animasi berulang |
| **Pencahayaan** | Neon glow `box-shadow 10px` warna kuning | Background amber lembut semi-transparan |

### 📊 Modal & Bottom Sheet
| Aspek | Sebelum (Before) | Sesudah (After) |
| :--- | :--- | :--- |
| **Unit Tinggi** | `92vh`, `90vh`, `88vh` statis | `min(92dvh, 760px)`, `min(90dvh, 760px)` |
| **Respon Browser HP** | Melompat saat address bar muncul/hilang | Mulus dan adaptif terhadap browser chrome |

---

## 3. CASE: SKENARIO LAPANGAN RELEVAN

### 🚌 Kasus 1: Input Data Lapangan di Bawah Terik Matahari pada Ponsel Layar 375px
- **Skenario:** Petugas lapangan menggunakan ponsel dengan tinggi 667px (misal iPhone SE / Android 5.5 inci) untuk menginput ritase dan KM unit bus.
- **Sebelum Refactor:** Hampir separuh layar tertutup oleh sticky header (Profile + Pill + Card Progress besar 72px + 2 row tombol). Petugas hanya bisa melihat 1 kartu bus di bagian bawah, harus scroll berkali-kali untuk pindah unit.
- **Setelah Refactor:** Card progress tebal digantikan hairline indicator 3px. Petugas dapat melihat 3 bus sekaligus di layar, mempercepat penginputan data hingga 2x lipat tanpa scrolling berlebih.

### 📱 Kasus 2: Penutupan Keyboard Virtual dan Munculnya Address Bar Browser
- **Skenario:** Petugas membuka form status armada atau laporan operasional dan mengetik catatan kendala. Ketika keyboard tertutup, address bar browser Safari/Chrome muncul kembali.
- **Sebelum Refactor:** Modal berukuran `92vh` terdorong ke bawah, menyebabkan tombol "Simpan & Terapkan" tertutup di balik navigasi browser.
- **Setelah Refactor:** Modal dengan `min(92dvh, 760px)` secara cerdas menghitung dynamic viewport height, menjaga tombol aksi tetap terlihat dan dapat ditekan dengan mudah.

---

## 4. VERIFIKASI QUALITY GATES

1. **Unit Test Coverage:**
   - Command: `pnpm vitest run src/`
   - Hasil: **39 test files passed, 294 tests passed (100% success)**.
2. **TypeScript Strict Mode & Production Build:**
   - Command: `pnpm run build` (`tsc -b && vite build`)
   - Hasil: **0 errors, bundle berhasil dibuat dalam 2.86 detik**.
3. **Knowledge Graph Synchronized:**
   - Command: `graphify update .`
   - Hasil: **2852 nodes, 3910 edges, 247 communities terbarui**.
