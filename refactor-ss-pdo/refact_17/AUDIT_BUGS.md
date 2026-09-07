# AUDIT BUGS: TRAPPED IN ACCUMULATION MODE (REFACTOR 17)

Dokumen ini mencatat audit investigasi sistematis mengenai kegagalan deaktivasi mode "Rekap Akumulasi Lintas Periode" pada aplikasi SS_PDO.

---

## DAFTAR TEMUAN AUDIT

| ID Temuan | Komponen / File | Keparahan | Status |
| :--- | :--- | :---: | :---: |
| **ACC-17-01** | `src/components/RouteSelectorCard.tsx`<br>`src/components/Dashboard.tsx`<br>`src/components/BusList.tsx`<br>`src/components/AccumulationSheet.tsx` | 🔴 **Kritis** (UX Dead-End / Blocker) | Mengidentifikasi Akar Masalah |

---

## RINCIAN TEMUAN

### 🔴 ACC-17-01: User Terkunci pada Mode Rekap Akumulasi Tanpa Cara Menonaktifkan (Dropdown Tanggal Terkunci)

* **Lokasi Kode Utama:**
  1. `src/components/RouteSelectorCard.tsx` (baris 580–591):
     ```tsx
     <select
       className="input-field"
       value={isAccumulation ? '' : selectedTab}
       onChange={(e) => handleTabChange(e.target.value)}
       disabled={!dateEnabled || isAccumulation || days.length === 0}
       title={isAccumulation ? 'Nonaktif saat mode Rekap Akumulasi' : (!dateEnabled ? 'Pilih rute terlebih dahulu' : 'Pilih tanggal')}
     ...
     ```
  2. `src/components/RouteSelectorCard.tsx` (baris 283, 291, 302):
     ```tsx
     if (!isAccumulation) setSelectedTab('');
     // ...
     if (!isAccumulation) setSelectedTab(defaultDay);
     ```
  3. `src/components/Dashboard.tsx` (baris 978, 1003, 1031):
     Menyimpan `selectedTab = "AKUMULASI"`, `currentTabName = "AKUMULASI"`, dan objek `accRange`/`accRangeDetails`, namun tidak menyediakan fungsi exit/reset untuk kembali ke mode harian.
  4. `src/components/BusList.tsx` (baris 371–407):
     Banner peringatan akumulasi aktif menyuruh user *"Pilih tanggal harian spesifik untuk menginput data"*, namun tidak menyediakan tombol aksi (CTA) untuk beralih.
  5. `src/components/AccumulationSheet.tsx`:
     Hanya memiliki tombol "Terapkan Akumulasi Lintas Periode" tanpa opsi reset/nonaktifkan.

* **Keparahan:**
  🔴 **Kritis (Blocker)** — Begitu pengguna mengaktifkan mode Rekap Akumulasi Lintas Periode, pengguna terperangkap secara permanen dalam mode akumulasi. Pengguna tidak dapat memilih tanggal harian, tidak dapat menginput/memperbarui data armada bus, dan perubahan rute/bulan pun tetap mempertahankan status akumulasi. Satu-satunya cara keluar adalah me-refresh browser atau menghapus localStorage.

* **Dampak ke Pengguna Lapangan (User Impact):**
  Petugas operasional di lapangan yang ingin melihat data akumulasi beberapa hari tidak bisa kembali bekerja untuk menginput data harian bus hari ini. Hal ini menyebabkan penghentian operasional input KM/TOA.

* **Akar Masalah (Root Cause):**
  1. Dropdown tanggal secara sengaja diberi atribut `disabled` saat `isAccumulation === true`, sehingga user tidak bisa mengklik tanggal mana pun.
  2. Guard `if (!isAccumulation)` pada perubahan rute/bulan/tahun mencegah pergantian tab harian.
  3. Ketiadaan mekanisme tombol/opsi keluar dari mode akumulasi di `RouteSelectorCard`, `BusList`, maupun `AccumulationSheet`.

* **Mitigasi & Solusi Menyeluruh:**
  1. **Buka Dropdown Tanggal pada Mode Akumulasi (`RouteSelectorCard.tsx`):**
     Hapus `isAccumulation` dari kondisi `disabled`. Jadikan `AKUMULASI` sebagai salah satu opsi terpilih (`⚡ Rekap Akumulasi (Aktif)`). Jika pengguna memilih tanggal harian (misal: "Tgl 5"), sistem langsung keluar dari mode akumulasi dan memuat data tanggal tersebut.
  2. **Banner Interaktif dengan Tombol Keluar di Selector:**
     Tambahkan banner/chip status di dalam `RouteSelectorCard` ketika mode akumulasi aktif:
     `⚡ Mode Rekap Akumulasi Aktif` beserta tombol interaktif `[Kembali ke Harian ✕]`.
  3. **Handler Terpusat di `Dashboard.tsx`:**
     Buat fungsi `handleExitAccumulation(targetDay?: string)` yang mereset `accRange`, `accRangeDetails`, mengubah `selectedTab` ke tanggal target (atau hari ini), dan memuat data harian. Teruskan handler ini ke semua komponen terkait.
  4. **Tombol Aksi pada Banner `BusList.tsx`:**
     Ubah banner statis di `BusList` menjadi interaktif dengan tombol `[Kembali ke Mode Harian]`.
  5. **Tombol Reset pada `AccumulationSheet.tsx`:**
     Jika dibuka saat mode akumulasi aktif, sediakan tombol sekunder `[Matikan Mode Akumulasi (Kembali ke Harian)]`.
