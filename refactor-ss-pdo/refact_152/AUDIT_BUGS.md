# Audit Temuan Bug (Refactor 152)

## Ringkasan Eksekutif

Audit ini difokuskan pada sistem validasi penginputan data KM Awal dan KM Akhir (Shift 1 & Shift 2) pada modal bus (`BusInputModal`), baik pada Mode Fokus Tunggal (*Single-Column Focus*) maupun Mode Form Penuh (*All Columns / Tabs*).
Ditemukan bug kritis di mana tombol "Simpan" terkunci secara permanen (*deadlock disabled state*) setelah terjadi kesalahan validasi meskipun pengguna telah memperbaiki data dengan benar. Selain itu, ditemukan beberapa kondisi di mana hasil validasi tidak ditampilkan secara realtime saat pengguna sedang mengetikkan angka.

---

## Tabel Temuan

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-152-01** | `src/components/busCard/modal/useBusInputForm.ts`<br>`src/components/busCard/BusInputModal.tsx` | 🔴 **CRITICAL** | Tombol "Simpan" tetap dalam status `disabled` permanen setelah terjadi kesalahan validasi, meskipun pengguna telah mengoreksi angka input menjadi data yang valid. | Pengguna terjebak (*deadlock*); tidak dapat menyimpan formulir bus setelah memperbaiki kesalahan input tanpa harus menutup modal secara paksa. | Tambahkan evaluasi revalidasi reaktif pada saat state input berubah ketika sedang dalam kondisi error, sehingga tombol Simpan otomatis ter-unlock (*enabled*) saat data sudah valid. |
| **BUG-152-02** | `src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx` | 🟠 **HIGH** | Pada Mode Single Focus, saat pengguna mengetik KM Akhir lebih kecil dari KM Awal, badge jarak hilang tanpa memunculkan pesan/indikator error realtime. | Pengguna di lapangan tidak mengetahui bahwa angka KM yang sedang diketik mundur atau salah; tidak ada umpan balik visual instan. | Tampilkan indikator selisih negatif merah dan ekstrem oranye secara realtime pada Single Focus menggunakan data `kmLiveS1` / `kmLiveS2`. |
| **BUG-152-03** | `src/utils/modals/busInput/busModalOdometer.ts`<br>`src/utils/modals/busInput/busModalValidation.ts` | 🟡 **MEDIUM** | *False Positive* saat mengetik digit berjalan (*incomplete typing*): ketika input KM Akhir masih berupa prefix dari KM Awal namun panjangnya > 3 digit (misal digit ke-4 dari 6 digit), sistem langsung menilainya sebagai error KM mundur ratusan ribu KM. | Teks peringatan merah berkedip mengagetkan pengguna di tengah pengetikan normal (*alert fatigue*). | Terapkan *Typing-in-Progress Guard*: jika input KM Akhir masih merupakan prefix cocok dari KM Awal dan panjangnya belum mencapai digit penuh KM Awal, anggap sebagai status pengetikan aktif (*typing*), bukan error kemunduran. |
| **BUG-152-04** | `src/components/busCard/modal/busInputValidation.ts`<br>`src/components/busCard/modal/useBusInputForm.ts` | 🟡 **MEDIUM** | Validasi kemunduran KM Awal lintas hari (*Cross-Day Validation*) dan checkbox bypass hanya muncul pasca-submit; tidak tampil realtime saat pengguna mengetik KM Awal. | Pengguna tidak mendapat peringatan dini bahwa KM Awal hari ini mundur dari KM hari sebelumnya, dan tidak dapat mengaktifkan bypass sebelum submit gagal. | Tampilkan notifikasi cross-day dan kontrol bypass secara realtime di bawah field KM Awal terkait saat angka input terdeteksi mundur. |
| **BUG-152-05** | `src/components/busCard/modal/fields/BusFormField.tsx`<br>`src/components/busCard/modal/singleFocus/singleFocusStyles.ts` | 🟢 **LOW** | Elemen input tidak memiliki penanda visual error (*error border / highlight*) saat data yang diketik tidak valid. | Umpan balik visual kurang fokus pada titik mata pengguna di ponsel saat mengetik. | Tambahkan prop `hasError` dengan aksen border merah pada `BusFormField` dan input Single Focus. |

---

## Analisis Akar Masalah (Root Cause Analysis)

1. **Deadlock Tombol Simpan (BUG-152-01):**
   State `validationErrors` di [`useBusInputForm.ts`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/useBusInputForm.ts) hanya diperbarui saat submit form (`handleFormSubmit`). Ketika submit menghasilkan error, `form.validationErrors` berisi array error, menyebabkan `isDisabled={form.validationErrors.length > 0}` di [`BusInputModalFooter.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/BusInputModalFooter.tsx) menjadi `true`. Ketika pengguna mengoreksi nilai pada input, event `onChange` memperbarui nilai field, namun tidak ada fungsi yang mengevaluasi ulang `validationErrors`. Akibatnya tombol "Simpan" tetap berstatus `disabled` dan pengguna tidak dapat mengklik tombol tersebut lagi.

2. **Hilangnya Feedback Negatif di Single Focus (BUG-152-02):**
   Nilai `kmDistanceS1` dan `kmDistanceS2` diatur mengembalikan `null` jika status kalkulasi adalah `"negative"`. Komponen [`SingleFocusKmShift1.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx) dan [`SingleFocusKmShift2.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx) hanya merender badge jika `kmDistance !== null`. Ketika KM mundur, badge menghilang tanpa ada elemen pengganti untuk menampilkan pesan kesalahan.

3. **Incomplete Typing Trigger (BUG-152-03):**
   Fungsi `isDraftPrefill` pada [`busModalValidation.ts`](file:///d:/MINE/SS_PDO/src/utils/modals/busInput/busModalValidation.ts) hanya mengecek batas `length <= 3`. Ketika pengguna sedang mengetik digit ke-4 atau ke-5 pada odometer 6 digit (misal mengetik "1852" untuk KM Awal "185200"), sistem langsung menghitung `1852 - 185200 = -183348 KM` dan memunculkan peringatan kemunduran ekstrem padahal pengetikan belum selesai.
