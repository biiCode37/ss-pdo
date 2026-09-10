# Spesifikasi Desain: Generator Laporan WhatsApp Format 3 (Status Armada Per Shift)

- **Tanggal Dokumen:** 10 September 2026
- **Status:** Disetujui (Approved)
- **Branch:** `devmode`

---

## 1. Latar Belakang & Tujuan
Aplikasi SS_PDO telah memiliki fitur monitoring dan pembuatan laporan WhatsApp untuk 18 rute Wilayah Utara:
- **Format 1:** Laporan Capaian Jumlah Pelanggan & KM Harian (Komprehensif)
- **Format 2:** Laporan Pelanggan Rincian Shift (TOA + Manual)

Operasional lapangan Transjakarta Mikrotrans membutuhkan satu jenis laporan tambahan harian yang dikirimkan per pergantian shift (**Shift 1 Pagi** atau **Shift 2 Siang**), yaitu **Laporan Status Kesiapan Armada (SGO, Realisasi, Tidak Operasi, Rincian Kendala & Unit Libur)**.

Dokumen ini mendefinisikan arsitektur data, alur validasi, antarmuka pengguna, serta format pesan WhatsApp yang dirancang secara profesional dengan gaya *Executive Modern*.

---

## 2. Arsitektur & Penyimpanan Data

### 2.1 Skema Database Supabase (`daily_route_reports`)
Menambahkan kolom baru pada tabel `public.daily_route_reports` melalui file migrasi SQL:
```sql
ALTER TABLE public.daily_route_reports
ADD COLUMN IF NOT EXISTS fleet_status_shift1 jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fleet_status_shift2 jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s1 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_fleet_confirmed_s2 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fleet_confirmed_s1_at timestamptz,
ADD COLUMN IF NOT EXISTS fleet_confirmed_s2_at timestamptz;
```

### 2.2 Struktur Snapshot JSON per Unit (`FleetUnitStatusDetail`)
```typescript
export interface FleetUnitStatusDetail {
  unit: string;      // Nomor lambung / body bus (misal: "KLM_568", "KWK_449")
  note: string;      // Keterangan status (misal: "NP 1 & 2", "Per Patah", "TO.EVDAL⛔")
  isOff: boolean;    // true jika status murni OFF (libur terjadwal), false jika kendala operasional
}
```

### 2.3 Alur Penyimpanan Data (Saat Pengawas Konfirmasi Status Armada)
1. Di modal [FleetStatusModal.tsx](file:///d:/MINE/SS_PDO/src/components/fleetStatus/FleetStatusModal.tsx), saat tombol *"Konfirmasi & Terapkan Status Shift 1/2"* ditekan:
   - Handler `handleConfirmFleetStatus` di [Dashboard.tsx](file:///d:/MINE/SS_PDO/src/components/Dashboard.tsx) mengiterasi peta unit (`unitMap`).
   - Unit dengan catatan non-SGO dipilah:
     - Jika `cleanShiftNote` mengandung "OFF", ditandai `isOff: true`.
     - Jika berisi kendala lain (misal "NP", "TO", kendala teknis), ditandai `isOff: false`.
   - Snapshot array `FleetUnitStatusDetail[]` disimpan ke kolom `fleet_status_shift1` atau `fleet_status_shift2`.
   - Menandai `is_fleet_confirmed_s{shift} = true` dan `fleet_confirmed_s{shift}_at = now()`.
   - Memperbarui Google Sheets kolom `Keterangan` dan state lokal `busData`.

---

## 3. Aturan Validasi & Pemblokiran Ketat (Strict Blocking Rule)

1. **Aturan 100% Konfirmasi Wilayah**:
   - Untuk menghasilkan Laporan Format 3 (Status Armada), **seluruh 18 rute Wilayah Utara WAJIB telah mengonfirmasi status armada pada shift target** (`is_fleet_confirmed_s{shift} === true`).
   - Aturan ini berlaku mutlak, baik saat melihat tab "Semua 18 Rute" maupun tab Korlap.
2. **Keadaan Belum Lengkap (Unconfirmed)**:
   - Jika ada rute yang belum mengonfirmasi (misal: 2 dari 18 rute belum konfirmasi):
     - Kotak pratinjau pesan di modal digantikan oleh banner peringatan:
       > ⚠️ **Laporan Status Armada Shift {X} Belum Siap Dibuat**
       > Masih ada {N} rute yang belum mengonfirmasi status armada: **JAK.88, JAK.113**.
       > Harap pastikan seluruh pengawas rute telah mengonfirmasi status armada sebelum laporan digenerate.
     - Tombol **"Salin Teks"** dan tombol **"Buka WhatsApp"** dinonaktifkan (*disabled*).

---

## 4. Antarmuka Pengguna (UI/UX) di `WaReportModal.tsx`

1. **Segmented Button Tipe Format**:
   - `[ Format 1 (Komprehensif) ]`
   - `[ Format 2 (Rincian Shift) ]`
   - `[ Format 3 (Status Armada) ]`
2. **Sub-Selector Shift (Khusus Format 3)**:
   - Muncul di bawah pilihan format saat Format 3 aktif:
     - `[ ☀️ Shift 1 (Pagi) ]`
     - `[ 🌙 Shift 2 (Siang) ]`
   - *Default cerdas*: Otomatis memilih Shift 1 jika jam lokal < 14:00, dan Shift 2 jika jam lokal ≥ 14:00.
3. **Filter Korlap**:
   - Tab filter tetap tersedia (`Semua 18 Rute`, `Ranto 6 Rute`, `Abdul 6 Rute`, `Moamar 6 Rute`).
   - Setelah validasi 18 rute terpenuhi, pengguna dapat menyalin laporan untuk seluruh wilayah atau hanya untuk rute binaan Korlap tertentu.

---

## 5. Standar Format Pesan WhatsApp ("Executive Modern")

```text
*LAPORAN STATUS OPERASIONAL ARMADA MIKROTRANS*
*WILAYAH UTARA — TRANSJAKARTA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗓️ *HARI / TANGGAL :* {HARI}, {DD} {BULAN} {YYYY}
⏱️ *SHIFT OPERASI :* SHIFT {N} ({PAGI / SIANG})
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *RINGKASAN WILAYAH ({TOTAL_RUTE} RUTE)*
```
• Target SGO  : {totalSgo} Unit
• Realisasi   : {totalRealisasi} Unit
• Tidak Ops   : {totalTidakOps} Unit
• Ketercapaian: {persentase}%
• Status Rute : {jumlahLengkap} Lengkap ✅ | {jumlahKurang} Kurang ✖️
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━

*RINCIAN STATUS ARMADA PER RUTE :*

*{noPadded}. {routeCode} | {routeName}{loopingSuffix}*
_- {operatorFullName}_
```
SGO        : {sgo} Unit
Realisasi  : {realisasi} Unit
Tidak Ops. : {tidakOps} Unit
Keterangan : {LENGKAP ✅ / TIDAK LENGKAP ✖️}
{bulletUnitKendala}
```
{seksiUnitLiburJikaAda}
───────────────────────────

_Demikian laporan status kesiapan armada dibuat untuk diketahui pimpinan. Terima kasih._
```

### Detail Pembentukan Seksi:
- **Format Nama Operator**:
  - `KOLAMAS` ➔ `KOLAMAS (KLM)`
  - `KWK` ➔ `KOPERASI WAHANA KALPIKA (KWK)`
  - `KMJ` ➔ `KOPERASI KOMILET JAYA (KMJ)`
  - `KMJ/KLM` ➔ `KOLAMAS (KLM) & KOPERASI KOMILET JAYA (KMJ)`
  - `LSG` ➔ `LESTARI SURYA GEMAPERSADA (LSG)`
  - `KWK AC` ➔ `KOPERASI WAHANA KALPIKA (KWK) AC`
- **Seksi Unit Libur (OFF)**:
  Hanya dimunculkan jika terdapat unit berstatus OFF pada rute tersebut:
  ```text
  *Unit Libur (OFF):*
  ```
  • {unit} : OFF
  ```
  ```

---

## 6. Kamus Teks Sentral (`src/constants/texts/`)
Seluruh teks UI, judul, tooltip, template pembuka dan penutup WA didefinisikan dalam [text_wa_report.ts](file:///d:/MINE/SS_PDO/src/constants/texts/text_wa_report.ts) dan diuji pada [texts.test.ts](file:///d:/MINE/SS_PDO/src/constants/texts/texts.test.ts).

---

## 7. Rencana Verifikasi & Quality Gates
1. **Unit Test**:
   - `waReportGenerator.test.ts`: Uji generator Format 3 (rute lengkap, rute kendala, rute ada unit OFF, kalkulasi ringkasan wilayah).
   - `WaReportModal.test.tsx`: Uji tombol format 3, toggle shift, pemblokiran saat rute belum 100% konfirmasi, tombol salin dan buka WA.
   - `texts.test.ts`: Uji kamus teks sentral baru.
   - `vitest run src/`: 100% kelulusan test suite.
2. **Build**:
   - `pnpm run build` (`tsc -b && vite build`) lolos 0 error.
3. **Graphify**:
   - `graphify update .` diperbarui.
