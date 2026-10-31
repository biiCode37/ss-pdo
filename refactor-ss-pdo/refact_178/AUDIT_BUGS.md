# AUDIT BUGS — Refactor 178: Relokasi Badge Status [OFF] dan [T.O] ke Sisi Paling Kanan Header Kartu Bus

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/busCard/BusCard.tsx`, `src/components/busCard/BusCard.test.tsx`.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-178-01** | P2 (Sedang - Konsistensi UI & Layout Ergonomi) | `src/components/busCard/BusCard.tsx:90–136` | Pada komponen kartu unit armada (`BusCard`), badge status `[OFF]` dan `[T.O]` ditempatkan di sisi kiri header persis di sebelah nomor unit (`KWK 222161 [OFF]`), sementara sisi kanan header kosong (pada mode Semua Kolom) atau kosong setelah supresi badge `[Kosong]` (pada mode fokus kolom). Tata letak ini asimetris dan tidak konsisten dengan komponen kartu lain (seperti `UnitCard` di halaman Armada) yang menempatkan status badge di sisi paling kanan. | Tampilan antarmuka terasa tidak seimbang (*lopsided*), padat di sisi kiri dan kosong di sisi kanan. Pengawas dan operator melihat ketidakkonsistenan tata letak antara halaman "Input SS" dan "Armada", mengurangi kerapihan visual antarmuka di layar ponsel. | **TERATASI (Resolved)** — Badge `[OFF]` dan `[T.O]` dipindahkan dari container kiri ke container kanan header `bus-card-header`. Sisi kiri kini murni menampilkan identitas nomor bodi (`bus.unit`), sedangkan sisi paling kanan menampilkan badge status operasional (`[OFF]` / `[T.O]`), konsisten 100% dengan kartu armada. |

---

## Analisis Akar Masalah (Root Cause Analysis)

Pada `BusCard.tsx`, container kiri `bus-card-header` sebelumnya membungkus:
1. `bus.unit` (nomor unit bus)
2. `isNonSgo && (...)` (badge `[OFF]` atau `[T.O]`)
3. `status-queued` (indikator antrean sinkronisasi)

Sedangkan container kanan hanya membungkus:
1. `BusCardSummary` (hanya ada jika `activeCategory !== "ALL"`)
2. `isLoading` (spinner)

Hal ini menyebabkan:
- Pada mode `ALL`: Sisi kanan header selalu kosong, sementara sisi kiri memuat nomor unit dan badge status secara berdempetan.
- Pada mode filter fokus kolom (setelah Refactor 177): Unit `OFF`/`T.O` yang kosong mensupresi `BusCardSummary`, sehingga sisi kanan header kosong melompong sedangkan unit operasional (`SGO`) menampilkan badge metrik/kolom di sisi kanan.
- Pada halaman tab "Armada" (`UnitCard.tsx`), badge status `[OFF]`/`[T.O]` diletakkan di sisi kanan atas kartu. Penempatan badge di sisi kiri pada `BusCard.tsx` menyebabkan inkonsistensi desain antar halaman.
