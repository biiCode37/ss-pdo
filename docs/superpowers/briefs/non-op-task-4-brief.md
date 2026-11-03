# Task 4 Brief: Proteksi Kolom Angka, Banner, & Override Action pada Modal Form Input SS

## Global Constraints
- Strictdevmode: Bekerja pada branch `devmode`.
- Golden Rule Ritase: Unit dengan ritase = 0 atau kosong terkunci otomatis kolom angkanya.
- Pembersihan Bersyarat: Hanya bersihkan keterangan jika isinya murni "OFF" atau "LIBUR". Selain nilai itu, JANGAN dibersihkan.
- Kamus Teks Sentral: Gunakan `TEXT_ALERTS.BUS_INPUT_MODAL` untuk seluruh teks banner, tombol, dan pesan sukses/validasi.
- TDD: Perbarui `src/components/busCard/BusInputModal.test.tsx` terlebih dahulu.

## Files
- Modify: `src/components/busCard/modal/useBusInputForm.ts`
- Modify: `src/components/busCard/BusInputModal.tsx`
- Modify: `src/components/busCard/BusInputModal.test.tsx`

## Requirements
1. **Modifikasi `useBusInputForm.ts`:**
   - Import `isBusNonOperational`, `getNonOperationalBannerType`, `shouldClearKeteranganOnActivation` dari `@/utils/operationalStatusUtils`.
   - State `isInputUnlocked` (boolean, default false).
   - Nilai derivasi:
     - `isNonOp = isBusNonOperational(bus);`
     - `isLocked = isNonOp && !isInputUnlocked;`
     - `nonOpBannerType = isLocked ? getNonOperationalBannerType(bus) : 'NONE';`
   - Fungsi `handleActivateInput(targetRitase: number)`:
     - Jika `targetRitase > 0`:
       - `setIsInputUnlocked(true);`
       - Set `tripPergi` dan `tripPulang` ke nilai `String(targetRitase)`.
       - Cek `if (shouldClearKeteranganOnActivation(keterangan)) setKeterangan('');`
       - Tampilkan `showSuccessToast(TEXT_ALERTS.BUS_INPUT_MODAL.ACTIVATE_INPUT_SUCCESS);`
   - Kembalikan `isLocked`, `nonOpBannerType`, `handleActivateInput` pada return object hook.

2. **Modifikasi `BusInputModal.tsx`:**
   - Jika `form.isLocked === true`:
     - Render Banner Peringatan di atas tab navigasi form:
       - Latar: `var(--color-warning-bg, rgba(234, 179, 8, 0.12))`
       - Border: `1px solid var(--color-warning-border, rgba(234, 179, 8, 0.35))`
       - Teks banner:
         - Jika `form.nonOpBannerType === 'OFF_LIBUR'`: `TEXT_ALERTS.BUS_INPUT_MODAL.NON_OPERATIONAL_BANNER_OFF_LIBUR`
         - Jika `form.nonOpBannerType === 'EMPTY_RITASE'`: `TEXT_ALERTS.BUS_INPUT_MODAL.NON_OPERATIONAL_BANNER_EMPTY_RITASE`
       - Tombol `[ 🔓 Aktifkan Input ]` (data-testid="btn-activate-input"):
         - Saat ditekan, muncul prompt input ritase (bisa via Swal.fire prompt atau utilitas prompt).
         - Saat dimasukkan angka valid > 0, panggil `form.handleActivateInput(num)`.
     - Lewatkan prop `disabled={form.isLocked}` ke komponen form fields angka (Trip, KM, TOA). Kolom Keterangan tetap aktif.

3. **Pengujian Unit di `BusInputModal.test.tsx`:**
   - Memverifikasi render banner yang sesuai untuk unit OFF/LIBUR dan unit ritase kosong.
   - Memverifikasi input angka terkunci (`disabled`).
   - Memverifikasi aktivasi input membuka kunci dan membersihkan keterangan murni "OFF".

## Acceptance Criteria
- Seluruh pengujian di `BusInputModal.test.tsx` lulus 100%.
- Jalankan test `pnpm vitest run src/components/busCard/BusInputModal.test.tsx` dan pastikan 100% lulus.
- Commit dengan judul: `feat: proteksi form bus off dan override aktivasi input`.
