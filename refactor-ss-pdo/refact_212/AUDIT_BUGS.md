# AUDIT TEMUAN TAMPILAN KETERANGAN & WARNA KARTU UNIT: REFACTOR 212
**Modul:** `FormattedNoteText.tsx` (strip keterangan bawah kartu: Input SS, Unit, Unit Dengan Keterangan), `index.css` (`.bus-card.unit-status-*`, `.note-badge-*`)
**Fokus Masalah:** Strip keterangan bercampur badge dan teks sehingga tidak rapi; kartu berstatus OFF/kendala/TO diberi latar berwarna penuh sehingga mencolok.

---

### ID Temuan: BUG-UI-212-01
- **Lokasi Kode:** `src/components/FormattedNoteText.tsx` (`renderItem`), `src/index.css` (`.note-badge-ba/off/np/to`)
- **Keparahan:** Low (konsistensi visual)
- **Deskripsi:** Keterangan BA.01–04, OFF, NP1/NP2, dan TO EVDAL dirender sebagai badge berwarna, sedangkan keterangan lain berupa teks dengan bullet. Badge NP juga memakai warna mentah (`rgba`, `#fb923c`) dan bullet memakai `rgba` mentah. Detail BA diubah ke huruf kapital awal sehingga berbeda dari teks di sheet.
- **Dampak User:** Strip bawah kartu tampak tidak seragam dan ramai.
- **Mitigasi:** Semua item dirender sebagai teks polos + bullet pemisah (token `--color-text-secondary`); prefiks S1/S2 tetap sebagai label teks; CSS `.note-badge-*` dihapus. Teks tampil apa adanya dari sheet.

### ID Temuan: BUG-UI-212-02
- **Lokasi Kode:** `src/index.css` (`.bus-card.unit-status-off/kendala/to`)
- **Keparahan:** Medium (keterbacaan & kesan profesional)
- **Deskripsi:** refact_209 mewarnai **latar seluruh kartu** (`--color-unit-*-bg`) selain garis tepi kiri. Pengguna menegaskan kesepakatannya hanya garis tepi.
- **Dampak User:** Daftar unit dengan banyak OFF/TO tampak mencolok dan tidak elegan.
- **Mitigasi:** Latar kartu kembali netral; warna status hanya di garis tepi kiri **dan** kanan (3.5px, token `--color-unit-*-border`). Badge status di header kartu tidak diubah.
