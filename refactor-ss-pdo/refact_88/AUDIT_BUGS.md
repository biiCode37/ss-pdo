# Audit Bugs & Koreksi Batch 2.1 Penutupan (Refact 88)

Dokumen ini mendokumentasikan temuan audit dan perbaikan teknis penutupan untuk **Fase 2, Batch 2.1** pada proyek SS_PDO berdasarkan ketetapan `AGENTS.md`, `.agents/AGENTS.md`, serta audit review orchestrator Codex pada `refact_87/AUDIT_BUGS.md`.

---

## Daftar Temuan & Status Audit

| ID Temuan | Lokasi Kode / Dokumen | Keparahan | Status | Rujukan Asal |
| :--- | :--- | :--- | :--- | :--- |
| **R87-01** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:441,515,556` | **Medium** | **RESOLVED** | `refact_87` (Label subteks realops, target/capaian KM, dan persen capaian pax) |

---

## Rincian Temuan & Solusi

### R87-01: Label UI Masih Hardcoded di Modal MonitoringRouteDetailModal

- **Lokasi Kode:**
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (baris 441, 515, 556)
- **Keparahan:** **Medium** (Konsistensi UI & Kepatuhan Kamus Teks Sentral)
- **Deskripsi:**
  Modal detail rute operasional masih merender teks antarmuka langsung (*hardcoded string literal*) di dalam JSX:
  1. Baris 441: `S1: {route.realopsShift1 ?? "-"} • S2: {route.realopsShift2 ?? "-"}` (subteks realisasi operasi per shift).
  2. Baris 515: `Target: {targetPaxPerKm} • Cap: {paxPerKmPct}%` (subteks rasio pelanggan per KM).
  3. Baris 556: `Capaian: {paxPct}%` (ketercapaian target pelanggan).
  
  Sesuai `AGENTS.md` (Aturan Standar Kamus Teks Sentral) dan `.agents/AGENTS.md` (Poin 10), seluruh teks antarmuka yang dilihat pengguna wajib ditempatkan di dalam modul kamus domain terkait (`src/constants/texts/text_monitoring.ts`), dan teks dinamis dengan variabel wajib dibuat dalam bentuk fungsi template murni.

- **Dampak User:**
  Perubahan istilah atau lokalisasi di masa mendatang dapat menghasilkan label yang tidak konsisten pada modal yang sama. Pengguna operasional di lapangan dapat melihat inkonsistensi copy atau pemisahan format antarmuka.

- **Mitigasi:**
  1. Tambahkan 3 fungsi template murni pada `TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS` di `src/constants/texts/text_monitoring.ts`:
     - `REALOPS_SHIFT_SUBTEXT: (s1: string | number, s2: string | number) => \`S1: ${s1} • S2: ${s2}\``
     - `TARGET_CAP_SUBTEXT: (target: string | number, cap: string | number) => \`Target: ${target} • Cap: ${cap}%\``
     - `ACHIEVEMENT_PCT: (pct: string | number) => \`Capaian: ${pct}%\``
  2. Gantikan pemanggilan JSX hardcoded di `MonitoringRouteDetailModal.tsx` dengan memanggil ketiga fungsi template murni tersebut melalui variabel `tMetrics`.
  3. Pertahankan susunan kata, tanda baca (titik tengah `•`, titik dua `:`, persen `%`), spasi, urutan, dan format visual persis sama seperti tampilan awal.
  4. Tambahkan uji integritas di `src/constants/texts/texts.test.ts` untuk memastikan ketiga entri kamus baru tervalidasi.
  5. Pastikan seluruh perhitungan ritase PP murni dan nonritase tetap utuh tanpa perubahan rumus matematika domain.
