# Design Specification: Executive SSOT Analytics Dashboard (SS_PDO)

**Tanggal:** 31 Juli 2026  
**Status:** Disetujui (Approved)  
**Fokus Utama:** Google Sheets Single Source of Truth (SSOT), Executive Formatting Standard, & Presisi Rumus Excel  

---

## 1. Ringkasan Fitur (Feature Overview)

Aplikasi **SS_PDO** mengadopsi konsep **Single Source of Truth (SSOT)** penuh dari dokumen Google Sheets resmi operasional (`contoh_file_ss`). Halaman Dashboard Analitik menyajikan 12 metrik rangkuman utama yang dibaca langsung dari sel rumus Google Sheets API, dengan *fallback* kalkulasi lokal berbasis **12 Rumus Baku Excel** (`AVERAGEIF(KM > 0)`, `SUM`, dll).

Seluruh tampilan disesuaikan dengan **Standar Formatting Eksekutif Mobile-First**:
- Format angka Indonesia (`id-ID` locale dengan titik ribuan dan koma desimal).
- Pembulatan **1 digit desimal** untuk `KM/Bus` (misal: `192,7 KM/Bus`).
- Pembulatan **2 digit desimal** untuk `Pelanggan/KM` (misal: `0,84 Pnp/KM`).
- Penekanan indikator visual (*Highlight Amber/Red*) jika terdapat **Tiket Manual > 0** sebagai penanda adanya potensi kendala mesin Tap-In TOA di lapangan.

---

## 2. Arsitektur Data & Rumus Baku Excel

### 2.1 Peta Rumus Baku Excel
| Metrik Rangkuman | Rumus Baku Excel | Logika Kalkulasi |
|---|---|---|
| **Total Pelanggan** | `=SUM(M:M)` | Penjumlahan kolom Total Pelanggan per bus |
| **Total KM** | `=SUM(Q:Q)` | Penjumlahan total kilometer armada |
| **Total Pelanggan/KM** | `=Total Pelanggan / Total KM` | Kepadatan penumpang per kilometer perjalanan |
| **KM/BUS** | `=AVERAGEIF(Q:Q, ">0", Q:Q)` | Rata-rata KM armada yang **aktif berjalan** (bus mogok/KM 0 diabaikan) |
| **TOTAL TOA SHIFT 1** | `=SUM(G:G)` | Sum TOA Shift 1 |
| **TOTAL MANUAL SHIFT 1** | `=SUM(H:H)` | Sum Tiket Manual Shift 1 |
| **TOTAL SHIFT 1** | `=Manual S1 + TOA S1` | Total penumpang Shift 1 |
| **TOTAL TOA SHIFT 2** | `=SUM(I:I)` | Sum TOA Shift 2 |
| **TOTAL MANUAL SHIFT 2** | `=SUM(J:J)` | Sum Tiket Manual Shift 2 |
| **TOTAL SHIFT 2** | `=Manual S2 + TOA S2` | Total penumpang Shift 2 |
| **TOTAL TOA** | `=TOA S1 + TOA S2` | Total TOA elektronik seluruh shift |
| **TOTAL MANUAL** | `=Manual S1 + Manual S2` | Total Tiket Manual seluruh shift |

### 2.2 Alur Data Hybrid SSOT
1. **Google Sheets Parser (`googleSheets.ts`):**
   - Setelah membaca baris bus, `getBusData` memindai baris di bawah tabel untuk menemukan pasangan label rangkuman (misal `"Total Pelanggan"`, `"Total KM"`, `"KM/BUS"`, dll).
   - Menyimpan hasil pembacaan sel rumus tersebut dalam `sheetSummary?: Record<string, number>`.
2. **Kalkulator Analitik (`analytics.ts`):**
   - Menerima `busData` dan `sheetSummary`.
   - Menggunakan nilai `sheetSummary` dari Google Sheets jika tersedia.
   - Jika `sheetSummary` tidak tersedia (offline / draft lokal), melakukan kalkulasi *in-memory* secara presisi mengemulasi **12 Rumus Baku Excel** di atas.
3. **Executive Presentation (`KPICard`, `ShiftComparisonCard`, `CompletionStatusCard`):**
   - Format angka bersih (`192,7 KM/Bus`, `0,84 Pnp/KM`, `5.589 KM`).
   - Menampilkan badge peringatan jika `totalManual > 0`.

---

## 3. Rencana Verifikasi (Verification Plan)

1. **Automated Unit Test (`src/utils/analytics.test.ts`):**
   - Menguji bahwa `calculateAnalytics` menghasilkan `KM/BUS` sesuai `=AVERAGEIF(Q:Q, ">0")` dan mengabaikan unit bus dengan KM 0.
   - Menguji formatting 1-digit desimal `kmPerBus` dan 2-digit desimal `passengersPerKm`.
2. **Verifikasi Build Production:**
   - Menjalankan `pnpm run build` untuk memastikan tidak ada kesalahan TypeScript.
3. **Verifikasi UI Light/Dark:**
   - Menguji kartu analitik di mode Gelap & Terang untuk kenyamanan visual pimpinan operasional.
