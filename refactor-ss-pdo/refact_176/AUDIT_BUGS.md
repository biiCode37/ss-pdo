# AUDIT BUGS — Refactor 176: Sinkronisasi Status Badge [OFF] & [T.O] pada Halaman Armada

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/UnitCard.tsx`, `src/utils/unitAnalytics.ts`, `src/components/__tests__/UnitCard.test.tsx`.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-176-01** | P1 (Tinggi) | `src/components/UnitCard.tsx:24–128`, `src/utils/unitAnalytics.ts:70–88` | Pada halaman tab "Armada" (`UnitSummaryDashboard`), armada berstatus `OFF` atau `T.O` yang tidak beroperasi (nilai ritase/KM kosong) secara otomatis menampilkan badge `[✖ Belum Terisi]`. Halaman tidak menyelaraskan status operasional `OFF` / `T.O` seperti yang tampil pada halaman "Input SS". | Petugas operasional dan pengawas melihat badge "Belum Terisi" pada bus yang memang sengaja libur (`OFF`) atau tidak operasi (`T.O`), menimbulkan kebingungan seolah-olah data armada tersebut belum diinput atau terlewat. | **TERATASI (Resolved)** — Komponen `UnitCard` kini memeriksa catatan armada menggunakan `isUnitOff()` dan `isUnitTo()`. Jika unit berstatus `OFF`, badge "Belum Terisi" diganti dengan badge `[OFF]` kuning. Jika unit berstatus `T.O`, diganti dengan badge `[T.O]` merah (identik dengan tampilan kartu di halaman Input SS). Kartu armada juga diberi kelas styling `.bus-card-non-sgo`. |

---

## Analisis Akar Masalah (Root Cause Analysis)

Fungsi `renderStatusBadge` pada `UnitCard.tsx` hanya membaca properti `status: UnitShiftStatus` yang dikalkulasi dari pengisian field numerik (`toaShift1`, `kmAkhir1`, dll.). Karena armada non-operasional (`OFF` atau `T.O`) tidak mengisi ritase dan KM, fungsi `getUnitShiftStatus` mengembalikan `'EMPTY'`, yang kemudian menghasilkan badge fallback `[✖ Belum Terisi]`. `UnitCard` sebelumnya tidak membaca field `keterangan` atau `notes` untuk mengecek apakah unit tersebut berstatus non-SGO (`OFF` / `T.O`).
