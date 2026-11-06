# REPAIR REPORT: REFACTOR 211
**Modul:** Aktifkan Input Unit Non-Operasional (form trip Pergi/Pulang + simpan di mode Fokus Kolom)
**Tanggal:** 07 November 2026
**Status:** Selesai. Verifikasi gate di bagian 4. Belum diverifikasi visual di perangkat. Belum di-commit.

---

## 1. Implementasi Perbaikan
### A. Form aktivasi = form "Set Jumlah Trip" (BUG-UX-211-01)
- `src/utils/modals/bulkModals.ts`: opsi baru `isActivation` pada `showBulkTripModal` — judul `ACTIVATE_INPUT_PROMPT_TITLE`, deskripsi `ACTIVATE_INPUT_PROMPT_LABEL`, petunjuk "kosongkan" disembunyikan, validasi: kedua trip wajib diisi, ≥ 0, total > 0 (`ACTIVATE_INPUT_INVALID_RITASE`). Validasi bawaan (maks 20, dibulatkan ke bawah) tetap berlaku.
- `BusInputModal.tsx`: prompt `input: "text"` lama dihapus, diganti `showBulkTripModal({ unitCount: 1, headerMap, isActivation: true })`; label field mengikuti header sheet (`headerMap.tripPergiLabel/tripPulangLabel`).
- `useBusInputForm.ts`: `handleActivateInput(tripPergi, tripPulang)` mengisi masing-masing kolom (bukan satu angka disalin ke dua kolom).

### B. Trip aktivasi ikut tersimpan di mode Fokus Kolom (BUG-DATA-211-02)
- `busInputPayload.ts`: parameter `includeTrip`; bila true, `tripPergi`/`tripPulang` disertakan di payload mode fokus.
- `useBusInputForm.ts`: `includeTrip: isInputUnlocked` saat submit. Mode Semua Kolom sudah selalu mengirim trip.
- Analisis dampak kolom berumus: hanya kolom input Trip Pergi/Trip Pulang yang ditambahkan; `toaShift2` tetap tidak dikirim (diuji).

### C. Kamus teks
- `ACTIVATE_INPUT_PROMPT_LABEL` dan `ACTIVATE_INPUT_INVALID_RITASE` diperbarui ke istilah trip (1 ritase = 2 trip); `texts.test.ts` disesuaikan.

## 2. Before vs After
| Aspek | Before | After |
|---|---|---|
| Form "Aktifkan Input" | 1 kolom teks "target ritase" (contoh 7.5) | 2 kolom Trip Pergi & Trip Pulang, sama dengan "Set Jumlah Trip" |
| Nilai tersimpan saat input "4" | Pergi 4, Pulang 4 (disalin) | Sesuai input per arah, mis. Pergi 4, Pulang 3 |
| Trip desimal (7.5) | Lolos | Dibulatkan ke bilangan bulat trip seperti Set Jumlah Trip |
| Kosong / 0 & 0 | Ditolak (1 kolom) | Ditolak, pesan "Isi Trip Pergi dan Trip Pulang…" |
| Simpan dari mode Fokus Kolom (TOA/KM/Ket) | Trip aktivasi **tidak terkirim** ke sheet | Trip ikut terkirim bersama kolom fokus |

## 3. Case: Skenario Lapangan
### Case BUG-UX-211-01: Unit cadangan masuk jalur siang
- **Situasi:** Unit JAK.15-09 kosong ritasenya (cadangan), siang hari diturunkan ke jalur dan sudah jalan 4 kali pergi, 3 kali pulang.
- **Before:** Prompt meminta "target ritase" satu angka; PDO bingung antara 3.5 atau 7, hasilnya trip pergi & pulang disamakan.
- **After:** Form sama persis dengan "Set Jumlah Trip": Trip Pergi 4, Trip Pulang 3 → tersimpan apa adanya (3,5 rit).

### Case BUG-DATA-211-02: Aktivasi dari mode Fokus TOA S1
- **Situasi:** PDO sedang Fokus Kolom "TOA S1", membuka unit OFF yang ternyata beroperasi, tap "Aktifkan Input", isi trip 4/3, isi TOA, simpan.
- **Before:** Hanya TOA S1 yang terkirim; trip tidak masuk sheet, unit tetap terkunci saat dibuka lagi.
- **After:** Payload `{ tripPergi: "4", tripPulang: "3", toaShift1: "120" }` → trip dan TOA tersimpan; unit tidak lagi terkunci.

## 4. Verifikasi
07 November 2026:
1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` → **158/158 lulus**.
2. `pnpm vitest run src/` → **139 file, 1329/1329 lulus**. Test baru/ubah: aktivasi memakai form trip (judul, 2 field, tanpa petunjuk kosongkan), batal aktivasi tetap terkunci, simpan mode Fokus TOA S1 mengirim trip 4/3 tanpa `toaShift2`, `includeTrip` di payload builder (2), validasi preConfirm mode aktivasi (4).
   Bukti bug BUG-DATA-211-02: dengan `includeTrip: false` sementara, test mode fokus gagal — payload hanya `{ toaShift1: '120' }`.
3. `pnpm run build` → **exit 0**.
4. `graphify update .` → graf diperbarui.

Belum diverifikasi: tampilan form di HP (terang/gelap) dan penulisan nyata ke sheet rute (butuh login Google). Jalur simpan sama dengan input trip biasa (`onSave` → kolom Trip Pergi/Trip Pulang), bukan kolom berumus.
