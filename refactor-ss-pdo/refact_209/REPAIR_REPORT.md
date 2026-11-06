# REPAIR REPORT: REFACTOR 209
**Modul:** Warna Kartu Unit Berdasarkan Keterangan (Pengganti Target Ritase)
**Tanggal:** 07 November 2026
**Status:** Selesai & lolos 4 quality gate. Belum diverifikasi visual di perangkat (butuh login Google + data rute). Belum di-commit.

---

## 1. Implementasi Perbaikan
### A. Klasifikasi keterangan (BUG-UI-209-02, BUG-DATA-209-03) — `src/utils/keteranganUtils.ts`
- `isUnitOff`: `/\b(?:OFF|LIBUR)\b/i`. `hasMeaningfulNote`: `LIBUR` masuk `PURE_STATUS_REGEX`.
- Baru: `UnitKeteranganStatus`, `classifyUnitKeterangan(raw)` (per bagian `|`, prioritas TO > KENDALA > OFF_LIBUR > NORMAL; SO/SGO = NORMAL), `shouldShowKeteranganStrip(raw)` (bermakna **atau** berprefiks S1:/S2:).
- Dampak `isUnitOff` ke pemakai `isUnitOffOrToEvdal`: Set Jumlah Trip & Set Trip Terpilih (LIBUR dikosongkan/dilewati), `isBusFilled` (LIBUR dianggap selesai), `detectTargetTrip` (LIBUR diabaikan), `busModalPreConfirm` (simpan unit LIBUR = trip kosong), `BusCardSummary` (sembunyikan badge "Kosong").

### B. Token & CSS (BUG-UI-209-02) — `src/styles/tokens/semantic.css`, `src/index.css`
- Token `--color-unit-{off,kendala,to}-{bg,fg,border}` light (amber-100/800, orange-200/800, red-100/800/700) & dark (amber/orange/red-950 + -300).
- `.bus-card.unit-status-{off,kendala,to}`: latar + garis tepi kiri; badge `.unit-status-badge-{off,to,kendala}` solid terbalik (fg sebagai latar).
- Dihapus: `.bus-card.status-kendala/-warning/-achieved` (hex mentah + `!important`), `.bus-card.bus-card-non-sgo`.
- `color-contract.test.ts`: kontrak `unit-*-fg/bg` (4.5), `text-primary/secondary` di atas `unit-*-bg` (4.5), `unit-*-border` vs 4 surface (3) — 42 kontrak baru.

### C. Badge kategori — `src/components/ui/UnitStatusBadge.tsx`, `src/components/ui/unitStatusClass.ts`
- `UnitStatusBadge({ keterangan })`: OFF / LIBUR (kuning), T.O (merah), KENDALA (oranye); teks dari `TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_LABEL`.
- `UNIT_STATUS_CARD_CLASS` di file terpisah (menghindari peringatan lint fast-refresh).

### D. Kartu Input SS — `src/components/busCard/BusCard.tsx`
- Kelas & badge dari `classifyUnitKeterangan(formData.keterangan ?? bus.keterangan)` — tidak lagi `activeShiftStatus`.
- Strip keterangan memakai `shouldShowKeteranganStrip`; warna mentah strip (`--warning-text`, `rgba(245,158,11,.04)`, `--orange-color`) diganti token.
- `busCardStyles.ts` dihapus; `useBusCardModal` tidak diubah (kunci input per shift tetap).

### E. Ritase netral (BUG-UI-209-01, BUG-UI-209-04)
- `BusCardSummary.tsx`: ritase `(pergi+pulang)/2`, warna `--color-text-primary`, tanpa ⚠️; badge fokus trip netral ("Trip: 8/7"), kosong tetap merah "Kosong".
- Prop `targetTrip` dihapus dari `BusCardProps`, `BusCard`, `BusList`, `UnitCard`, `UnitDetailModal`, `UnitSummaryDashboard`; `useBulkOperations` tidak lagi mengembalikan `targetTrip` (tetap dipakai internal untuk isian awal modal).
- `evaluateTripStatus`/`TripStatus` (refact_208) dihapus beserta test-nya; teks target (`RITASE_DEFICIT_*`, `FULL_TARGET_TOOLTIP`, `RITASE_TARGET_*`, `TRIP_BADGE_DEFICIT/ACHIEVED`, `RITASE_IMBALANCED_CARD`, `TARGET_ACHIEVED`) dihapus.
- `UnitCard.tsx`: kelas & badge status sepanjang hari; badge kelengkapan shift tetap tampil untuk NORMAL/KENDALA; ritase PP.

### F. Prefiks shift di strip (BUG-UI-209-05) — `src/components/FormattedNoteText.tsx`
- Bagian berpola `S1:`/`S2:` dirender sebagai label `S1`/`S2` + isi (rekursif), bukan dibuang.

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Warna ritase | Hijau/kuning ⚠️ vs target tebakan | Satu warna netral |
| Penanda unit bermasalah | Abu-abu + badge OFF/T.O, hanya shift aktif | Latar + garis tepi + badge, keterangan sepanjang hari |
| Kendala BA02/NP/Service | Tanpa badge di kepala kartu | Oranye + badge KENDALA |
| "S1: OFF" saat shift 2 | Tampil normal | Kuning + badge OFF + strip "S1 OFF" |
| "S1: NP1 \| S2: T.O" | Tergantung shift aktif | Merah (prioritas TO) |
| Set Jumlah Trip ke unit LIBUR | Trip terisi | Trip dikosongkan (seperti OFF) |
| Kartu Armada ritase | "8/7 rit" (trip mentah) | "7.5 rit" (ritase PP) |
| Warna mentah hex/rgba | Di BusCard, BusCardSummary, UnitCard, UnitDetailModal, CSS status | Token semantik |

## 3. Case: Skenario Lapangan
### Case BUG-UI-209-01: JAK.89 pola rolling
- **Situasi:** 10 unit 10/10, 3 unit 9/9, 6 unit 8/9 (semua normal, baris putih di sheet).
- **Before:** Target tebakan 10/10 → 9 unit tampil kuning ⚠️ "kurang".
- **After:** Semua angka ritase netral; hanya unit berketerangan yang menonjol.

### Case BUG-UI-209-02: Unit OFF di shift 1, dicek petugas shift 2
- **Situasi:** Keterangan "S1: OFF", petugas shift 2 membuka Input SS.
- **Before:** Kartu tampil normal (status shift 2 kosong).
- **After:** Kartu kuning, badge OFF, strip "S1 OFF" — riwayat hari itu terlihat.

### Case BUG-DATA-209-03: Set Jumlah Trip di rute yang memakai "LIBUR"
- **Situasi:** JAK.15 punya 15 unit "Libur"; PDO menerapkan 7/7.
- **Before:** 15 unit libur ikut terisi 7/7 di SS.
- **After:** Unit libur dikirim kosong; hanya unit beroperasi terisi.

### Case BUG-UI-209-04: Halaman Armada
- **Situasi:** Unit 8/7 trip.
- **Before:** "8/7 rit".
- **After:** "7.5 rit".

### Case BUG-UI-209-05: Strip keterangan per shift
- **Situasi:** "S1: OFF | S2: BA02 Service".
- **Before:** Strip "OFF" + "BA.02 Service" tanpa penanda shift.
- **After:** "S1 OFF" / "S2 BA.02 Service"; kartu oranye (prioritas KENDALA).

## 4. Verifikasi
07 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **158/158 lulus** (42 kontrak baru).
2. `pnpm vitest run src/` → **138 file, 1306/1306 lulus**. Test baru/diubah: `keteranganUtils` (LIBUR, klasifikasi, prioritas, strip), `UnitStatusBadge`, `BusCard` (5 skenario sepanjang hari), `BusCardSummary` (ritase netral), `UnitCard` (kelas status, KENDALA + badge shift, ritase PP), `UnitDetailModal`, `BusList` (LIBUR di Set Jumlah Trip & progres), kamus teks.
3. `pnpm run build` → **exit 0**; `tsc -b` exit 0; `oxlint` file tersentuh tanpa peringatan.
4. `graphify update .` → 7809 node, 13333 edge, 622 komunitas.
- Bukti regresi LIBUR: test "Set Jumlah Trip mengosongkan trip unit LIBUR" **gagal** saat `isUnitOff` dikembalikan ke `/\bOFF\b/i`, lulus dengan regex baru. Test progres LIBUR lulus di kedua versi (lihat koreksi klaim di AUDIT_BUGS).

Belum diverifikasi: tampilan di browser/HP (mode terang & gelap) karena butuh login Google + data rute; unit libur yang di sheet hanya diwarnai tanpa teks keterangan tetap tampil normal (kesepakatan lapangan: tulis "LIBUR").
