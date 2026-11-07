# REPAIR REPORT: REFACTOR 225
**Modul:** Status "Wajar" untuk unit jalan satu shift
**Tanggal:** 08 November 2026
**Status:** Selesai di `devmode` (belum di-push). `sheet-sync-webhook` v4 (aturan baru) sudah di-deploy pemilik. Aturan & perbaikan header oleh Claude; tampilan oleh Antigravity (brief `ag-siap-kirim-wajar`, review 24/25).

---

## 1. Implementasi Perbaikan

### A. Aturan (Claude, `7027a2a`) — BUG-SUB-225-01
- `UnitCompletenessStatus` + `'WAJAR'`; `counts.WAJAR`; `UnitIssue.note?` (≤ 40 karakter, hanya untuk WAJAR).
- `classifyUnitRow`: setelah aturan JANGGAL, bila yang kosong **hanya** kolom TOA (S1 atau Total) **dan** `isExemptingKeterangan(keterangan)` → `WAJAR`. Trip yang kosong tidak pernah dimaklumi.
- `countCompletenessIssues` tidak berubah (BELUM_DIISI + JANGGAL + SEBAGIAN), jadi `route-confirmation` tidak perlu di-deploy ulang.
- Spesifikasi §2 diperbarui dengan catatan revisi.

### B. Tampilan (Antigravity, merge `4ff7375`)
- Kartu: unit WAJAR dihitung lengkap (`?? 0` untuk data lama).
- Dialog: masalah lebih dulu, lalu baris WAJAR bernada netral: `Wajar · {kolom} kosong · {cuplikan keterangan}`. "Semua unit lengkap." tampil bila tidak ada masalah.
- Teks `SUBMISSION.ISSUE_WAJAR` + test.

### C. Header dialog (Claude, `563bd42`) — BUG-UI-225-02
- `.submission-modal__heading` (kolom: judul di atas, status di bawah); `.submission-issue__unit` `nowrap`.

---

## 2. Before vs After (data nyata JAK.115, 7 Nov 2026)

| Aspek | Before | After |
|---|---|---|
| KWK 222179 (keterangan "Program Keur/ Renops", TOA S1 kosong, Total 166) | Sebagian, "TOA S1 kosong" (nada error/warning) | **Wajar** · TOA S1 kosong · Program keur/ Renops (nada netral) |
| Status rute JAK.115 | Sebagian, 29/30 unit lengkap | **Lengkap, belum dikonfirmasi**, 30/30 |
| Konfirmasi JAK.115 | Wajib alasan (1 masalah) | Tanpa alasan |
| Header dialog di 375 px | Label status menimpa judul | Judul utuh, status di bawahnya |

---

## 3. Case: Skenario Lapangan

### Case BUG-SUB-225-01: Unit keur di pagi hari, renops di siang hari
- **Situasi:** KWK 222179 tidak jalan di shift 1 (keur), lalu jalan di shift 2. Petugas mengisi trip dan Total TOA; TOA S1 dibiarkan kosong.
- **Before:** Rute dicap Sebagian; korlap menghubungi petugas tanpa perlu dan konfirmasi meminta alasan.
- **After:** Rute Lengkap. Detail tetap mencantumkan unit itu sebagai "Wajar" beserta keterangannya.

### Case BUG-SUB-225-01: Unit NP2 (tidak jalan shift 2)
- **Situasi:** TOA S1 terisi; Total TOA tidak diisi (kebiasaan lapangan); keterangan "NP2" atau "S1: NP2".
- **After:** Wajar, apa pun prefiksnya. Unit **tanpa** keterangan dengan Total TOA kosong tetap "Sebagian".

---

## 4. Verifikasi

| Gate | Status | Hasil |
|---|---|---|
| 1. Kontrak warna | Lulus | bagian dari suite penuh |
| 2. `pnpm vitest run src/` | Lulus | 151 file, 1.464/1.464 |
| 3. `pnpm run build` | Lulus | exit 0 |
| 4. `graphify update .` | Lulus | dijalankan sebelum commit dokumentasi |
| `deno check` `sheet-sync-webhook`, `route-confirmation` | Lulus | tanpa `deno.lock` |

**Produksi:** `sheet-sync-webhook` v4. Tombol Cek ulang JAK.115 → DB `counts {LENGKAP 21, WAJAR 1, DIKECUALIKAN 8, masalah 0}` pada 18:17:45 UTC, lalu kartu dan dialog berubah lewat Realtime tanpa muat ulang. Ini sekaligus membuktikan alur Cek ulang → webhook → Realtime → tampilan ujung-ke-ujung.

**Belum diverifikasi:** konfirmasi ujung-ke-ujung (menyimpan konfirmasi) dan PA.
