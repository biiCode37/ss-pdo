# REPAIR REPORT: REFACTOR 212
**Modul:** Strip keterangan tanpa badge & warna status kartu hanya di garis tepi
**Tanggal:** 07 November 2026
**Status:** Selesai & lolos 4 quality gate. Belum diverifikasi visual di perangkat. Belum di-commit.

---

## 1. Implementasi Perbaikan
### A. Strip keterangan teks polos (BUG-UI-212-01)
- `src/components/FormattedNoteText.tsx`: cabang badge BA/OFF/NP/TO EVDAL dihapus; setiap item = bullet (`--color-text-secondary`) + teks apa adanya. Prefiks S1/S2 tetap ditampilkan sebagai label teks di depan item. Import `parseKeterangan` tidak lagi dipakai di komponen ini.
- `src/index.css`: blok `.note-badge-ba/off/np/to` dihapus (termasuk warna mentah `rgba`/`#fb923c`).
- Berlaku di semua pemakai: kartu Input SS (`BusCard`), kartu Unit (`UnitCard`), dan daftar "Unit Dengan Keterangan" (`CompletionStatusCard`).

### B. Warna status hanya di garis tepi (BUG-UI-212-02)
- `src/index.css`: `.bus-card` kini punya `border-right: 3.5px solid transparent` (pasangan `border-left` yang sudah ada); `.bus-card.unit-status-*` hanya mengatur `border-left-color` & `border-right-color` dari token `--color-unit-*-border`. Properti `background` dihapus.
- Token `--color-unit-*-bg/fg` tetap dipakai badge status di header kartu (tidak diubah).

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Keterangan "BA.02 PRAMUDI MERIANG" | Badge "BA.02" + "Pramudi Meriang" | • BA.02 PRAMUDI MERIANG |
| OFF / TO EVDAL / NP1 | Badge kuning/merah/oranye | • OFF, • TO EVDAL, • NP1 … (teks) |
| "S1: OFF \| S2: BA.02 BAN PECAH" | Label S1 + badge, label S2 + badge | • S1 OFF / • S2 BA.02 BAN PECAH |
| Latar kartu OFF/kendala/TO | Kuning/oranye/merah tipis penuh | Netral (sama dengan kartu normal) |
| Penanda status | Garis tepi kiri | Garis tepi kiri + kanan |

## 3. Case: Skenario Lapangan
### Case BUG-UI-212-01: Rute dengan banyak keterangan campuran
- **Situasi:** Satu rute berisi unit "OFF", "BA.01 AC MATI", "NP1 TELAT", dan "BAN BOCOR".
- **Before:** Sebagian tampil badge berwarna, sebagian teks berbullet; strip bawah kartu tidak seragam.
- **After:** Semua tampil sebagai teks berbullet dengan gaya yang sama, persis seperti tertulis di sheet.

### Case BUG-UI-212-02: Hari dengan 6 unit OFF dan 2 TO
- **Situasi:** PDO membuka Input SS saat banyak unit libur.
- **Before:** Separuh daftar berlatar kuning/merah, terlihat ramai.
- **After:** Semua kartu berlatar netral; unit OFF/TO/kendala dikenali dari garis tepi kiri-kanan berwarna dan badge status di header.

## 4. Verifikasi
07 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **158/158 lulus**.
2. `pnpm vitest run src/` → **140 file, 1336/1336 lulus**. Test baru: `FormattedNoteText.test.tsx` (6: tanpa badge, bullet per item, prefiks shift, teks kosong); `UnitStatusBadge.test.tsx` (aturan CSS hanya border kiri/kanan tanpa `background` — terbukti gagal pada CSS lama); `CompletionStatusCard.test.tsx` disesuaikan ke teks apa adanya.
3. `pnpm run build` → **exit 0**.
4. `graphify update .` → graf diperbarui.

Belum diverifikasi: tampilan di HP (terang & gelap) karena butuh login Google.
