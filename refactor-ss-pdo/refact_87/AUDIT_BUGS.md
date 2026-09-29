# Audit review revisi Batch 2.1 — Refact 87

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`. Sumber: diff source dan laporan `refact_86`; arsip terdahulu tidak diubah.

## R87-01 — Label UI lain masih hardcoded di modal yang diubah

- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:441,515,556`.
- **Keparahan:** Sedang untuk konsistensi UI dan kepatuhan kamus teks.
- **Deskripsi:** Baris operasional masih merender `S1:` dan `S2:` langsung dalam JSX; baris pelanggan per KM masih merender `Target:` dan `Cap:`; baris target pelanggan masih merender `Capaian:`. Semuanya teks yang dilihat pengguna. `AGENTS.md` mewajibkan seluruh teks antarmuka dalam komponen yang dimodifikasi berasal dari modul domain di `src/constants/texts/`. Paket `refact_85` juga meminta pencarian ulang literal UI lain pada dua file target.
- **Dampak user:** perubahan istilah atau lokalisasi di kamus dapat menghasilkan label yang berbeda pada bagian lain dalam modal yang sama.
- **Mitigasi:** pindahkan tiga kelompok label ini ke `TEXT_MONITORING.ROUTE_DETAIL_MODAL` dengan fungsi template murni bila menyisipkan angka/variabel. Pertahankan copy yang terlihat dan nilai metrik saat ini; tambahkan uji integritas untuk entri kamus baru di `texts.test.ts`.

## Hasil pemeriksaan R85-01 sampai R85-03

- **R85-01 lulus:** `getMetricCardValue` membaca kartu total ritase secara spesifik; asersi `toBe("0 Rit")` akan gagal untuk `50 Rit`.
- **R85-02 sebagian lulus:** seluruh literal yang terdaftar di `refact_85` telah dipindah ke kamus dan diuji. R87-01 adalah literal tampilan lain dalam modal yang sama, sehingga klaim seluruh UI target telah bersih belum dapat diterima.
- **R85-03 lulus:** `refact_86` memetakan R79-06 ke label validasi dan R83-02 ke presisi ritase per bus secara benar.
- **R79-05/R83-02 lulus secara kode:** pembagian PP murni dan prioritas angka eksplisit dipertahankan; tiga cabang ritase per bus tidak dibulatkan.

## Verifikasi mandiri

- Full suite: `pnpm run test --dir src` menghasilkan **74 file / 531 tes lulus**, exit 0. Peringatan Happy DOM tentang pemuatan skrip Google muncul di output, tetapi suite lulus.
- Build: `pnpm run build` exit 0; Vite memperingatkan chunk di atas 500 kB.
- Lint: `pnpm run lint` exit 0; laporan executor menunjukkan 72 warning, sama dengan baseline. Percobaan awal tanpa pengaturan TEMP/TMP lokal gagal karena EPERM lingkungan; pengulangan dengan TEMP/TMP workspace lulus.
- Graph report yang dihasilkan menunjukkan 4615 nodes dan 5823 edges. Tidak dijalankan ulang karena review ini tidak mengubah source.
