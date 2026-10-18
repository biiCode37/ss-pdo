# REPAIR REPORT: Bottom Dock Clearance & Standarisasi Perintah "PA" (Push All)

## Informasi Refactor
- **ID Refactor:** `refact_138`
- **Tanggal:** 18 Oktober 2026
- **Branch:** `devmode`
- **Terkait Temuan:** BUG-138-01, BUG-138-02

---

## Implementasi Perbaikan

### 1. Eliminasi Double Padding & Harmonisasi Bottom Dock Clearance
Tinggi fisik floating dock capsule adalah ~48–50px dengan offset dasar `bottom: calc(14px + env(safe-area-inset-bottom, 0px))`, sehingga puncak dock berada pada ~64px dari tepi bawah layar ponsel.
Jarak clearance ideal dan ergonomis dari konten paling bawah ke puncak dock adalah 12px–16px (total 76px–80px).

**Langkah Perbaikan:**
1. Mengubah clearance container `<main>` pada `AllRouteMonitoringPage.tsx`:
   - Nilai baru: `paddingBottom: "calc(76px + env(safe-area-inset-bottom, 12px))"`.
2. Menghapus deklarasi `paddingBottom: "84px"` pada:
   - `src/components/monitoring/tabs/MonitoringRoutesTab.tsx`
   - `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`
   - `src/components/monitoring/tabs/MonitoringWaReportTab.tsx`
3. Menghapus inline `paddingBottom: "calc(96px + env(...))"` pada:
   - `src/components/monitoring/tabs/MonitoringKorwilTab.tsx`
4. Menghapus duplikasi padding pada CSS di `src/index.css`:
   - `.monitoring-dashboard-tab`: Mereset padding bottom ke `0` (margin bottom diatur `<main>`).
   - `.monitoring-korwil-tab`: Mereset padding bottom ke `0`.
   - `.app-container` (Dashboard Single Route): Menstandarkan clearance menjadi `calc(76px + env(safe-area-inset-bottom, 12px))` (sebelumnya `calc(92px + env(...))`).

---

### 2. Standarisasi Perintah Cepat "PA" (Push All) & Klausul Keselamatan
Menambahkan klausul resmi pada `AGENTS.md`, `.agents/AGENTS.md`, dan `.agents/rules/git-branch-devmode.md`:
- Perintah `"PA"` = Rangkaian 6 tugas berurutan:
  `commit > push devmode > switch branch main > merge devmode ke main > push main > kembali ke devmode`.
- **Klausul Keselamatan Wajib:** Dilarang keras mengambil keputusan sepihak jika terjadi hambatan/error (seperti conflict merge, gagal test, dll). Wajib melapor ke pengguna disertai rekomendasi solusi dan menunggu instruksi.

---

## Perbandingan Before vs After

### 1. Spacing Layout Monitoring Wilayah
| Parameter | Sebelum Refactor (Before) | Sesudah Refactor (After) |
|---|---|---|
| **Parent `<main>` Padding** | `calc(96px + env(...))` | `calc(76px + env(safe-area-inset-bottom, 12px))` |
| **Child Tabs Padding Bottom** | `84px` – `100px` (redundant) | `0` (diatur terpusat oleh parent `<main>`) |
| **Total Ruang Kosong Bawah** | **180px – 200px** (menganga) | **~76px** (hanya ~12px di atas capsule dock) |
| **Single Route Container** | `calc(92px + env(...))` | `calc(76px + env(safe-area-inset-bottom, 12px))` |

### 2. Efisiensi Perintah Operasional Git
| Skenario | Sebelum Refactor (Before) | Sesudah Refactor (After) |
|---|---|---|
| **Perintah Pengguna** | Harus mengetik lengkap: *"commit > push devmode > switch branch main > merge devmode ke main > push main"* | Cukup mengetik singkat: **`"PA"`** |
| **Penanganan Error** | Bergantung pada asumsi sesi saat itu | Dilindungi aturan tertulis wajib lapor kendala + rekomendasi solusi |

---

## Case: Skenario Lapangan

### Skenario 1: Petugas Memeriksa Daftar Rute / Rekap Wilayah hingga Kartu Terakhir
- **Sebelum:** Saat petugas mengusap (*scroll*) layar ponsel hingga daftar rute ke-18 atau kartu korwil paling bawah, muncul ruang hitam/kosong raksasa selebar ~200px di bawah kartu. Pengguna mengira ada data yang gagal dimuat atau tampilan rusak.
- **Sesudah:** Saat scroll mentok ke bawah, kartu terakhir berhenti secara elegan dan presisi tepat ~12px di atas capsule floating dock. Tampilan terasa kompak, padat, dan premium tanpa ruang hampa yang mengganggu.

### Skenario 2: Alur Rilis Cepat dengan Perintah "PA"
- **Sebelum:** Setelah selesai menguji fitur di preview devmode, pengguna harus mengetik instruksi merge dan push yang panjang ke chat.
- **Sesudah:** Pengguna cukup mengetik `"PA"`. AI langsung mengeksekusi commit, push devmode, checkout main, merge, push main, lalu kembali ke devmode. Jika ada git hook atau remote error, AI segera berhenti dan meminta konfirmasi.
