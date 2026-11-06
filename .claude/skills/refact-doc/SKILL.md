---
name: refact-doc
description: Buat dokumentasi audit/refactor SS_PDO di folder refactor-ss-pdo/refact_N berikutnya (AUDIT_BUGS.md + REPAIR_REPORT.md). Wajib dipakai setiap audit kode atau refactor.
---

# Dokumentasi Audit & Refactor

1. Tentukan N: angka terbesar dari folder `refactor-ss-pdo/refact_*` ditambah 1 (urutkan numerik, bukan leksikal). Jangan pernah mengubah folder `refact_N` yang sudah ada.
2. Buat `refactor-ss-pdo/refact_N/AUDIT_BUGS.md` dengan pola:

```markdown
# AUDIT TEMUAN <TOPIK>: REFACTOR N
**Modul:** ...
**Fokus Masalah:** ...

---

### ID Temuan: BUG-<KODE>-N-01
- **Lokasi Kode:** `path/file.tsx` (`namaFungsi`)
- **Keparahan:** Critical | High | Medium | Low (alasan singkat)
- **Deskripsi:** ...
- **Dampak User:** ...
- **Mitigasi:** ...
```

3. Buat `refactor-ss-pdo/refact_N/REPAIR_REPORT.md` dengan pola:

```markdown
# REPAIR REPORT: REFACTOR N
**Modul:** ...
**Tanggal:** DD Bulan YYYY
**Status:** ...

---

## 1. Implementasi Perbaikan
### A. <Bagian> (`path/file`)
- ...

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|

## 3. Case: Skenario Lapangan
### Case <ID Temuan>: <judul>
- **Situasi:** ...
- **Before:** ...
- **After:** ...

## 4. Verifikasi
(hasil 4 gate dari skill /verify, dengan angka nyata)
```

4. Setiap ID temuan di AUDIT_BUGS wajib punya implementasi, Before vs After, dan Case Skenario Lapangan di REPAIR_REPORT. Tulis dalam Bahasa Indonesia, mengikuti gaya `refact_199`.
5. Isi bagian Verifikasi hanya dengan hasil nyata dari skill `/verify`.
