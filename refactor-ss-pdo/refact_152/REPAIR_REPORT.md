# Laporan Perbaikan Kode (Repair Report Refactor 152)

Dokumen ini mencatat seluruh implementasi teknis perbaikan bug validasi realtime penginputan data KM Awal dan KM Akhir (Shift 1 & Shift 2), penyelesaian deadlock tombol Simpan pada modal bus (`BusInputModal`), penerapan *Typing-in-Progress Guard* pada odometer, serta penambahan indikator visual error antarmuka pengguna sesuai standar SS_PDO.

---

## 1. Ringkasan Perbaikan

| ID Temuan | Komponen / Berkas Utama | Status | Inti Perbaikan |
| :--- | :--- | :--- | :--- |
| **BUG-152-01** | `src/components/busCard/modal/useBusInputForm.ts` | ✅ **TERSELESAIKAN** | Menambahkan `useEffect` revalidasi reaktif otomatis saat `validationErrors.length > 0`, sehingga tombol "Simpan" langsung terbebas dari status `disabled` seketika pengguna memperbaiki angka input menjadi valid. |
| **BUG-152-02** | `src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx` | ✅ **TERSELESAIKAN** | Menampilkan badge peringatan selisih negatif merah dan ekstrem oranye secara realtime saat mengetik di Mode Fokus Tunggal (*Single Focus*), serta deteksi realtime jika KM Awal S2 < KM Akhir S1. |
| **BUG-152-03** | `src/utils/modals/busInput/busModalOdometer.ts`<br>`src/utils/modals/busInput/busModalValidation.ts` | ✅ **TERSELESAIKAN** | Menerapkan *Typing-in-Progress Guard* berbasis pemodelan potensi maksimum digit: pengetikan berjalan yang masih berupa prefix cocok dari KM Awal dikategorikan sebagai status `"typing"` (netral), bukan error KM mundur. |
| **BUG-152-04** | `src/components/busCard/modal/BusInputModalShift1.tsx`<br>`src/components/busCard/modal/BusInputModalShift2.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx` | ✅ **TERSELESAIKAN** | Menghubungkan peringatan kemunduran KM Awal lintas hari (*Cross-Day Validation*) dan checkbox bypass secara realtime di bawah field KM Awal terkait pada Mode Full Form maupun Single Focus. |
| **BUG-152-05** | `src/components/busCard/modal/fields/BusFormField.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx` | ✅ **TERSELESAIKAN** | Menambahkan prop `hasError?: boolean` dengan aksen border merah lembut (`rgba(239, 68, 68, 0.8)`) pada elemen input saat nilai terdeteksi salah/negatif. |

---

## 2. Rincian Perbaikan, Before vs After, & Skenario Lapangan

### 🔴 BUG-152-01: Deadlock Tombol "Simpan" Terkunci Permanen Pasca Error Validasi

- **Lokasi Berkas:** [`src/components/busCard/modal/useBusInputForm.ts`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/useBusInputForm.ts)
- **Akar Masalah:** Array `validationErrors` di state form hanya diisi saat proses submit (`handleFormSubmit`). Saat form gagal submit karena validasi (misal KM Akhir lebih kecil dari KM Awal), tombol Simpan di footer otomatis ter-disabled (`isDisabled={form.validationErrors.length > 0}`). Namun saat pengguna mengetik angka perbaikan yang valid, `validationErrors` tidak pernah dievaluasi ulang, menyebabkan tombol Simpan terkunci mati (*deadlock*).
- **Solusi Implementasi:** Ditambahkan hook `useEffect` reaktif pada `useBusInputForm`. Ketika `validationErrors.length > 0`, sistem secara otomatis menjalankan revalidasi ringan terhadap data form saat ini. Begitu input dinyatakan valid kembali, `validationErrors` dibersihkan seketika ke `[]` sehingga tombol Simpan langsung aktif kembali.

#### Before vs After
```typescript
// BEFORE (useBusInputForm.ts):
// validationErrors hanya dibersihkan saat handleFormSubmit dipanggil ulang
const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const errors = validateBusInput(formData, busData, activeTab, isFocusMode);
  if (errors.length > 0) {
    setValidationErrors(errors);
    return; // Tombol Simpan ter-disabled, pengguna tidak bisa submit lagi!
  }
  // ...
};

// AFTER (useBusInputForm.ts):
// Revalidasi reaktif otomatis saat pengguna sedang memperbaiki input dalam status error
useEffect(() => {
  if (validationErrors.length === 0) return;

  const currentErrors = validateBusInputForm({
    busData,
    formData,
    activeTab,
    isFocusMode,
    isKm1CrossDayBypassed,
    isKm2CrossDayBypassed,
    isKmCrossDayBypassed,
  });

  if (currentErrors.length === 0) {
    setValidationErrors([]);
  } else if (currentErrors.length !== validationErrors.length || currentErrors.some((err, idx) => err !== validationErrors[idx])) {
    setValidationErrors(currentErrors);
  }
}, [
  formData,
  validationErrors.length,
  busData,
  activeTab,
  isFocusMode,
  isKm1CrossDayBypassed,
  isKm2CrossDayBypassed,
  isKmCrossDayBypassed,
]);
```

#### Case: Skenario Lapangan
> **Skenario:** Petugas lapangan di Koridor 1 menginput KM Akhir Shift 1 untuk Bus MYS-18001 dengan salah mengetik `185100` padahal KM Awal adalah `185200`. Pengguna menekan tombol Simpan. Sistem menolak dan memunculkan pesan error "KM Akhir tidak boleh lebih kecil dari KM Awal". Tombol Simpan berubah menjadi abu-abu (*disabled*). Pengguna menyadari salah ketik dan mengubah angka menjadi `185320`.
> - **Sebelum Perbaikan:** Tombol Simpan tetap abu-abu (*disabled*) selamanya. Pengguna frustrasi mengira aplikasi macet, terpaksa menutup modal form dengan tombol Silang dan harus menginput ulang seluruh data dari awal.
> - **Sesudah Perbaikan:** Saat angka `185320` selesai diketik, pesan error langsung lenyap dan tombol Simpan seketika berubah menjadi biru aktif (*enabled*), siap ditekan tanpa perlu reload modal.

---

### 🟠 BUG-152-02: Tidak Ada Indikator Negatif & Ekstrem Realtime pada Mode Single Focus

- **Lokasi Berkas:**
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx)
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx)
- **Akar Masalah:** Logika `calculateKmDistance` mengembalikan status `"negative"` saat KM Akhir < KM Awal, namun komponen Single Focus memfilter render dengan `kmDistance !== null`. Akibatnya saat angka KM mundur, indikator jarak justru menghilang tanpa ada peringatan apa pun, dan pengguna tidak mengetahui berapa minusnya.
- **Solusi Implementasi:**
  1. Menghubungkan pembacaan `kmLiveS1` dan `kmLiveS2`.
  2. Saat `kmLiveS1.status === "negative"`, merender badge merah dengan ikon peringatan dan pesan ramah non-teknis: `⚠️ KM Akhir mundur (-X km). Periksa kembali angka odometer.`
  3. Saat `kmLiveS1.status === "extreme"`, merender badge oranye: `⚠️ Selisih KM sangat tinggi (+X km). Pastikan tidak salah ketik.`
  4. Pada Shift 2, ditambahkan deteksi realtime jika KM Awal S2 < KM Akhir S1.

#### Before vs After
```tsx
// BEFORE (SingleFocusKmShift1.tsx):
// kmDistanceS1 bernilai null saat status === "negative", badge hilang total tanpa pesan
{kmDistanceS1 !== null && (
  <div style={singleFocusStyles.kmDistanceBadge}>
    <span style={singleFocusStyles.kmDistanceLabel}>{TEXT_ALERTS.DISTANCE_SHIFT_1}</span>
    <span style={singleFocusStyles.kmDistanceValue}>{kmDistanceS1} km</span>
  </div>
)}

// AFTER (SingleFocusKmShift1.tsx):
{/* Realtime Alert saat KM Negatif / Mundur */}
{kmLiveS1.status === "negative" && (
  <div style={{ ...singleFocusStyles.kmDistanceBadge, backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}>
    <span>⚠️ {TEXT_ALERTS.KM_AKHIR_LESS_THAN_KM_AWAL_S1} ({kmLiveS1.diff} km)</span>
  </div>
)}
{/* Realtime Alert saat KM Ekstrem */}
{kmLiveS1.status === "extreme" && (
  <div style={{ ...singleFocusStyles.kmDistanceBadge, backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.4)", color: "#f59e0b" }}>
    <span>⚠️ {TEXT_ALERTS.KM_DIFFERENCE_TOO_HIGH} (+{kmLiveS1.diff} km)</span>
  </div>
)}
```

#### Case: Skenario Lapangan
> **Skenario:** Pengawas rute fokus mengisi kolom `KM Akhir Shift 1` pada mode Single Focus. KM Awal adalah `250.400`. Pengawas tidak sengaja mengetik `240.450` (kurang teliti pada digit kedua).
> - **Sebelum Perbaikan:** Badge kalkulasi jarak langsung lenyap dari layar. Pengawas mengira sistem belum selesai memproses angka dan menekan tombol Simpan, baru kemudian muncul popup error.
> - **Sesudah Perbaikan:** Begitu angka `240.450` selesai diketik, langsung muncul badge merah menyala di bawah input: `⚠️ KM Akhir Shift 1 tidak boleh lebih kecil dari KM Awal (-9.950 km). Periksa kembali angka odometer.` Pengawas langsung sadar dan mengoreksinya ke `250.450` seketika.

---

### 🟡 BUG-152-03: Peringatan Palsu Saat Mengetik Berjalan (*Typing-in-Progress Guard*)

- **Lokasi Berkas:**
  - [`src/utils/modals/busInput/busModalOdometer.ts`](file:///d:/MINE/SS_PDO/src/utils/modals/busInput/busModalOdometer.ts)
  - [`src/utils/modals/busInput/busModalValidation.ts`](file:///d:/MINE/SS_PDO/src/utils/modals/busInput/busModalValidation.ts)
- **Akar Masalah:** Odometer bus rata-rata memiliki 6 digit angka (misal `185200`). Aturan validasi sebelumnya hanya mengabaikan string dengan panjang $\le 3$ karakter. Ketika pengguna sedang mengetik digit ke-4 (`1852`) atau digit ke-5 (`18523`), sistem langsung mengonversinya menjadi angka bulat dan membandingkannya dengan `185200`. Akibatnya, muncul peringatan instan bahwa KM mundur ratusan ribu KM (`-183348 km`), membuat layar berkedip merah padahal pengguna belum selesai mengetik seluruh digit.
- **Solusi Implementasi:** Dibuat algoritma *Typing-in-Progress Guard* berbasis pemodelan potensi maksimum digit:
  1. Jika panjang digit KM Akhir masih lebih pendek dari KM Awal;
  2. Dan 3 digit awalan (*prefix*) cocok (`prefixAwal === prefixAkhir`);
  3. Dan potensi nilai maksimum jika sisa digit diisi angka `9` ($\text{digitAkhir} + 9 \dots 9$) $\ge \text{digitAwal}$;
  4. Maka status kalkulasi dikategorikan sebagai `"typing"` (netral), tidak menampilkan error merah ataupun oranye.

#### Before vs After
```typescript
// BEFORE (busModalOdometer.ts):
if (diff < 0) {
  return { diff, status: "negative", text: `${diff} km` };
}

// AFTER (busModalOdometer.ts):
// Typing-in-progress guard: odometer 5-6 digit yang baru diketik sebagian
if (diff < 0) {
  const digitsAwal = strAwal.replace(/\D/g, "");
  const digitsAkhir = strAkhir.replace(/\D/g, "");
  if (
    digitsAkhir.length >= 3 &&
    digitsAkhir.length < digitsAwal.length &&
    digitsAwal.slice(0, 3) === digitsAkhir.slice(0, 3)
  ) {
    const padded = digitsAkhir.padEnd(digitsAwal.length, "9");
    if (parseInt(padded, 10) >= parseInt(digitsAwal, 10)) {
      return { diff: 0, status: "typing", text: "..." };
    }
  }
  return { diff, status: "negative", text: `${diff} km` };
}
```

#### Case: Skenario Lapangan
> **Skenario:** Petugas hendak mengetik KM Akhir `194350` untuk bus dengan KM Awal `194200`. Petugas mengetik bertahap: `1` ➔ `19` ➔ `194` ➔ `1943` ➔ `19435` ➔ `194350`.
> - **Sebelum Perbaikan:** Saat jari mengetik `1943` (4 digit), layar langsung menyala merah dengan tulisan minus `-192257 km`. Saat mengetik `19435` (5 digit), layar masih menyala merah `-174765 km`. Pengguna terganggu dan cemas bahwa ia salah memasukkan data.
> - **Sesudah Perbaikan:** Sepanjang pengetikan `1943` dan `19435`, sistem cerdas mendeteksi pola prefix cocok dan panjang digit yang sedang berjalan. Indikator berstatus netral (`...`). Peringatan merah hanya muncul jika petugas sengaja mengetik angka yang secara matematis tidak mungkin valid (misal `193999` di mana prefix atau batas atasnya memang lebih kecil dari KM Awal).

---

### 🟡 BUG-152-04: Notifikasi Cross-Day KM Awal & Checkbox Bypass Realtime

- **Lokasi Berkas:**
  - [`src/components/busCard/modal/BusInputModalShift1.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/BusInputModalShift1.tsx)
  - [`src/components/busCard/modal/BusInputModalShift2.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/BusInputModalShift2.tsx)
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx)
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx)
- **Akar Masalah:** Validasi KM Awal lintas hari (membandingkan KM Awal hari ini terhadap KM Akhir hari kemarin) sebelumnya hanya dieksekusi saat form disubmit. Jika KM Awal memang sengaja mundur (misal pergantian panel odometer di depo), pengguna harus gagal submit dulu baru mengetahui adanya opsi bypass.
- **Solusi Implementasi:** Ditambahkan pemantauan realtime pada input KM Awal S1 dan S2. Jika angka input < KM hari kemarin dan bypass belum dicentang, langsung dimunculkan banner peringatan oranye ramah pengguna beserta tombol centang bypass langsung di bawah field KM Awal terkait.

#### Before vs After
```tsx
// BEFORE: Banner cross-day hanya muncul jika ada trigger submit error
{/* Tidak ada banner realtime di bawah field KM Awal */}

// AFTER:
{/* Realtime Cross-Day Alert & Bypass Checkbox */}
{isKm1CrossDayWarning && (
  <div style={crossDayBannerStyle}>
    <div style={crossDayWarningTextStyle}>
      ⚠️ {TEXT_ALERTS.KM_AWAL_LESS_THAN_YESTERDAY(yesterdayKm)}
    </div>
    <label style={bypassLabelStyle}>
      <input
        type="checkbox"
        checked={form.isKm1CrossDayBypassed}
        onChange={(e) => form.setIsKm1CrossDayBypassed(e.target.checked)}
      />
      <span>{TEXT_ALERTS.BYPASS_KM_CROSS_DAY}</span>
    </label>
  </div>
)}
```

#### Case: Skenario Lapangan
> **Skenario:** Bus baru saja diganti unit odometernya di pool karena rusak. KM Akhir kemarin adalah `350.000`, sedangkan odometer baru mulai dari angka `120.000`. Petugas memasukkan KM Awal `120.000`.
> - **Sebelum Perbaikan:** Petugas mengisi seluruh form hingga shift 2, menekan Simpan, lalu ditolak dengan error. Petugas bingung mencari di mana tombol bypass berada.
> - **Sesudah Perbaikan:** Begitu petugas mengetik `120.000` di KM Awal Shift 1, di bawah kolom tersebut langsung muncul kotak oranye informatif: `KM Awal Shift 1 lebih kecil dari KM Akhir Kemarin (350.000 km)` disertai kotak centang `[ ] Saya yakin odometer ini benar (reset/ganti unit)`. Petugas langsung mencentangnya dan melanjutkan pengisian tanpa hambatan.

---

### 🟢 BUG-152-05: Penanda Visual Error (*Highlight Border*) pada Elemen Input

- **Lokasi Berkas:**
  - [`src/components/busCard/modal/fields/BusFormField.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/fields/BusFormField.tsx)
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift1.tsx)
  - [`src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/singleFocus/SingleFocusKmShift2.tsx)
- **Akar Masalah:** Elemen input tidak memiliki status visual error yang dinamis pada tepi garis (*border*), sehingga saat mata pengguna fokus pada layar sentuh ponsel, sulit membedakan input mana yang sedang bermasalah jika ada lebih dari satu kolom.
- **Solusi Implementasi:** Ditambahkan prop `hasError?: boolean` pada `BusFormField` dan styling kondisional pada input Single Focus. Saat `hasError === true`, border input berubah warna menjadi merah `rgba(239, 68, 68, 0.8)` dengan latar belakang sedikit kemerahan (`rgba(239, 68, 68, 0.04)`), memberikan umpan balik taktil dan visual yang sangat jelas.

---

## 3. Kamus Teks Sentral Tambahan

Sesuai Aturan Emas Kamus Teks Sentral (`src/constants/texts/`), dilarang keras menggunakan *hardcoded UI string*. Penambahan teks baru didaftarkan di [`src/constants/texts/text_alerts.ts`](file:///d:/MINE/SS_PDO/src/constants/texts/text_alerts.ts):

```typescript
export const TEXT_ALERTS = {
  // ...
  KM_AWAL_S2_LESS_THAN_KM_AKHIR_S1: 'KM Awal Shift 2 tidak boleh lebih kecil dari KM Akhir Shift 1.',
  // ...
};
```
Integritas modul diuji dan diverifikasi pada [`src/constants/texts/texts.test.ts`](file:///d:/MINE/SS_PDO/src/constants/texts/texts.test.ts).

---

## 4. Verifikasi & Pengujian

### A. Uji Coba Unit (*Unit Testing*)
Seluruh unit test proyek dijalankan dengan Vitest:
```bash
pnpm vitest run src/
```
**Hasil:**
- **Test Files:** 114 passed (100%)
- **Tests:** 811 passed (100%)
- **Durasi:** 15.91 detik
- **Status:** LULUS SEMPURNA tanpa ada regresi pada modul lain.

### B. Uji Kompilasi & Build (*Quality Gates*)
Kompilasi TypeScript strict mode dan Vite production build:
```bash
pnpm run build
```
- Status: Diverifikasi dan lulus 0 error.

### C. Pembaruan Graf Pengetahuan
```bash
graphify update .
```
- Status: Graf AST kode diperbarui sesuai arsitektur terbaru.
