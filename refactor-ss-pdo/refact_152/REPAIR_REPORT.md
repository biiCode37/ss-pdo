# Laporan Perbaikan (Refactor 152)

Laporan ini mendokumentasikan implementasi pembatasan akses (*access control & UI removal*) halaman Monitoring Wilayah untuk pengguna dengan peran `pdo` (Petugas Data Operasional).

---

## 1. Rincian Implementasi

### 1.1 Penyembunyian Tombol Navigasi di UI Menu Profil
- Memperbarui `src/components/profileMenu/ProfileFeaturesSection.tsx` dan `src/components/profileMenu/ProfileMenuSheet.tsx` untuk menerima prop `role`.
- Menambahkan pemeriksaan `const isPdo = role === "pdo" || role === "petugas";`.
- Tombol navigasi *"Monitoring Wilayah & Laporan WA"* hanya dirender jika `!isPdo && onOpenRegionalMonitoring`. Petugas PDO tidak lagi melihat tombol ini di antarmuka.

### 1.2 Proteksi Handler Navigasi di `src/components/Dashboard.tsx`
- Memperbarui prop `onOpenRegionalMonitoring` pada `Dashboard.tsx` agar mengembalikan `undefined` saat `currentUserRole === "pdo"`.
- Memperbarui antarmuka `src/components/dashboard/DashboardModals.tsx` agar mendukung prop `onOpenRegionalMonitoring?: () => void`.

### 1.3 Penguatan Guard RBAC di `src/context/PageAccessContext.tsx`
- Pada fungsi `canAccessPage(pageKey, userRole)`, ditambahkan pengecekan eksplisit:
  ```ts
  if (
    (pageKey === 'regional_monitoring' ||
      pageKey === 'regional_summary' ||
      pageKey === 'regional_wa_report') &&
    (userRole === 'pdo' || userRole === 'petugas')
  ) {
    return false;
  }
  ```
- Jika ada upaya akses langsung melalui manipulasi state atau riwayat navigasi, router tampilan di `Dashboard.tsx` akan otomatis mencegat dan menampilkan `PageDisabledState` dengan pesan ramah non-teknis:
  `TEXT_PAGE_MANAGEMENT.ACCESS_RESTRICTED_DESC` (*"Akses terbatas. Halaman ini hanya dapat diakses oleh Koordinator / Pimpinan."*).

### 1.4 Standar Kamus Teks Sentral
- Menambahkan teks sentral `ACCESS_RESTRICTED_DESC` ke dalam `src/constants/texts/text_page_management.ts`.
- Menambahkan unit test integritas pada `src/constants/texts/texts.test.ts`.

---

## 2. Before vs After

### 2.1 Tampilan Menu Profil (Profile Menu Sheet)

#### Before:
- Pengguna dengan role `pdo` membuka menu profil.
- Tombol "Monitoring Wilayah & Laporan WA" tampil di bagian Fitur & Utilitas.
- Petugas dapat menekan tombol dan membuka dashboard pengawasan 18 rute wilayah.

#### After:
- Pengguna dengan role `pdo` membuka menu profil.
- Tombol "Monitoring Wilayah & Laporan WA" **sama sekali tidak tampil** di daftar fitur.
- Hanya fitur yang relevan untuk PDO (seperti Rekap Akumulasi, Format Sheet, Tema Tampilan, Logout) yang tersedia.

### 2.2 Guard Tingkat Halaman (Direct Access Prevention)

#### Before:
- Jika state `currentView` bernilai `regional_monitoring`, fungsi `canAccessPage` mengembalikan nilai `true` untuk PDO selama halaman berstatus `is_enabled` di database.

#### After:
- `canAccessPage('regional_monitoring', 'pdo')` selalu mengembalikan nilai `false`.
- Pengguna PDO yang diarahkan ke tampilan tersebut langsung disajikan layar proteksi akses ramah pengguna tanpa kebocoran data operasional wilayah.

---

## 3. Case: Skenario Lapangan

### Skenario: Petugas Lapangan (PDO) Mengoperasikan Aplikasi
- **Kondisi:** Petugas PDO membuka menu profil di smartphone untuk berganti tema atau melihat akumulasi ritase bus rutenya.
- **Sebelum Perbaikan:** Petugas melihat tombol "Monitoring Wilayah & Laporan WA". Jika ditekan, aplikasi memuat data seluruh 18 rute se-koridor, menambah beban kuota internet lapangan dan membuka data manajerial koridor.
- **Sesudah Perbaikan:** Menu profil bersih dari tombol monitoring wilayah. Petugas fokus pada form pencatatan rute operasionalnya sendiri.

---

## 4. Status Quality Gates

1. **Unit Test (Vitest):**
   - Perintah: `pnpm vitest run src/`
   - Hasil: 114 test files passed (100%), 813 tests passed, 0 error.
2. **TypeScript Strict Mode & Production Build:**
   - Perintah: `pnpm run build`
   - Hasil: `tsc -b && vite build` lulus 0 error.
3. **Knowledge Graph (Graphify):**
   - Perintah: `graphify update .`
   - Hasil: Pengetahuan arsitektur terbarui dan tersinkronisasi.
