# AUDIT BUGS — Refactor 175: Perbaikan Logika Deteksi Badge [T.O] & Sinkronisasi Warna Badge [T.O] / [OFF]

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/busCard/BusCard.tsx`, `src/utils/keteranganUtils.ts`, `src/index.css`, `src/components/monitoring/monitoringUtils.ts`, dan file pengujian terkait.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-175-01** | P0 (Kritis) | `src/components/busCard/BusCard.tsx:100` | Logika deteksi status shift menggunakan pencarian substring naif `activeShiftStatus.toUpperCase().includes("TO")`. String apa pun yang memuat huruf "TO" (seperti kata operasional "RADIATOR", "TEMPERATUR", "MOTOR", "TOKO", "OTOMATIS", "FOTO", "TOA") secara keliru terpicu sebagai status T.O. | Unit armada dengan kendala teknis murni (contoh pada unit KWK 222180 dengan catatan `BA.02 KENDALA MESIN (TEMPERATUR RADIATOR MENYALA)`) menampilkan badge palsu `[T.O]` di header kartu, membingungkan petugas operasional dan koordinator lapangan. | **TERATASI (Resolved)** — Dibuat utilitas domain `isUnitTo()` dan `isUnitOff()` di `keteranganUtils.ts` yang secara ketat hanya mencocokkan format resmi `[T.O EVDAL/TO EVDAL/TO/T.O]` dengan *word-boundary* dan *regex token guard*. |
| **BUG-175-02** | P1 (Tinggi) | `src/index.css:2295–2305`, `src/components/monitoring/monitoringUtils.ts:166–187` | Warna badge status `.unit-status-badge-to` dan `.unit-status-badge-off` terbalik secara semantik: badge `[T.O]` menggunakan warna kuning/peringatan (`var(--color-warning-*)`), sedangkan badge `[OFF]` menggunakan warna merah/bahaya (`var(--color-error-*)`). | Inkonsistensi dengan standar visual operasional dan konvensi spreadsheet SSOT Transjakarta (di mana `TO / TO EVDAL` adalah merah sebagai armada tidak beroperasi karena sanksi/evaluasi, sedangkan `OFF` adalah kuning sebagai libur terjadwal). | **TERATASI (Resolved)** — Ditukar secara presisi: `[T.O]` menjadi warna merah (`var(--color-error-*)`), sedangkan `[OFF]` menjadi warna kuning (`var(--color-warning-*)`) pada seluruh komponen badge status dan token semantik yang adaptif. |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Akar Masalah BUG-175-01:**  
   Pemeriksaan status non-SGO pada `BusCard.tsx` sebelumnya mengandalkan `.includes("TO")` dan `.includes("OFF")`. Karena sifat pencarian substring tanpa batas kata (*word boundary*), kata-kata bahasa Indonesia yang umum dalam konteks perbaikan mekanis (seperti `TEMPERATUR` dan `RADIATOR`) memicu `includes("TO") === true`.
2. **Akar Masalah BUG-175-02:**  
   Di `src/index.css`, kelas `.unit-status-badge-off` dipetakan ke `--color-error-*` dan `.unit-status-badge-to` dipetakan ke `--color-warning-*`. Hal ini bertolak belakang dengan panduan operasional pada `src/constants/texts/text_alerts.ts` yang menyatakan `Kuning untuk OFF` dan `Merah untuk TO EVDAL`, serta tombol preset di `KeteranganPresetBar.tsx`.
