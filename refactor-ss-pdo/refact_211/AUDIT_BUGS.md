# AUDIT TEMUAN AKTIFKAN INPUT UNIT NON-OPERASIONAL: REFACTOR 211
**Modul:** Modal input unit (`BusInputModal.tsx`), form hook (`useBusInputForm.ts`), payload builder (`busInputPayload.ts`), modal trip (`bulkModals.ts`)
**Fokus Masalah:** Tombol "🔓 Aktifkan Input" pada unit terkunci (ritase kosong/0/OFF) masih memakai prompt 1 angka "target ritase" model lama, dan trip hasil aktivasi tidak tersimpan di mode Fokus Kolom.

---

### ID Temuan: BUG-UX-211-01
- **Lokasi Kode:** `src/components/busCard/BusInputModal.tsx` (`handlePromptActivateInput`), `useBusInputForm.ts` (`handleActivateInput`)
- **Keparahan:** High (salah data trip: 1 angka disalin ke 2 kolom)
- **Deskripsi:** Prompt SweetAlert `input: "text"` meminta satu angka "target ritase" (contoh "7.5") lalu `handleActivateInput` menyalin angka yang sama ke Trip Pergi **dan** Trip Pulang. Tidak konsisten dengan form "Set Jumlah Trip" (Trip Pergi + Trip Pulang terpisah, bilangan bulat 0–20).
- **Dampak User:** PDO mengetik 4 (maksud 4 rit) → tersimpan Trip Pergi 4 + Trip Pulang 4 = 8 trip (4 rit) — kebetulan benar; tetapi mengetik 7.5 → trip desimal 7.5/7.5 yang tidak mungkin terjadi di lapangan, dan rit ganjil-trip (mis. pergi 4, pulang 3) tidak bisa diinput sama sekali.
- **Mitigasi:** Pakai ulang `showBulkTripModal` (komponen "Set Jumlah Trip") dengan opsi `isActivation`: dua field trip, wajib keduanya terisi, total > 0, tanpa opsi "kosongkan". Hasil `{ tripPergi, tripPulang }` diteruskan apa adanya.

### ID Temuan: BUG-DATA-211-02
- **Lokasi Kode:** `src/components/busCard/modal/busInputPayload.ts` (`buildBusInputPayload`, cabang `isSingleMode`)
- **Keparahan:** High (input user hilang diam-diam)
- **Deskripsi:** Di mode Fokus Kolom, payload hanya memuat kolom kategori aktif. Bila unit diaktifkan dari fokus TOA/KM/Keterangan, trip hasil aktivasi tidak ikut dikirim ke sheet. Terbukti dengan test: payload hanya `{ toaShift1: '120' }`.
- **Dampak User:** Unit tetap tercatat tanpa ritase di sheet setelah disimpan; saat dibuka lagi form kembali terkunci dan PDO harus mengulang.
- **Mitigasi:** Parameter `includeTrip` (= `isInputUnlocked`) memaksa `tripPergi`/`tripPulang` ikut di payload mode fokus. Kolom berumus (TOA SHIFT 2) tetap tidak dikirim.
