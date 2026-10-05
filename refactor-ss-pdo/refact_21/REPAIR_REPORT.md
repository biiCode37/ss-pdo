# REPAIR REPORT: MODULAR LOGIN SCREEN & COMPLIANCE BOTTOM SHEET (REFACTOR 21)

Dokumen ini mencatat implementasi pembaruan layar autentikasi (`LoginScreen.tsx`), perbandingan Sebelum (*Before*) dan Sesudah (*After*), serta Skenario Lapangan nyata untuk perbaikan temuan `UI-21-01` dan `UI-21-02`.

---

## 1. Implementasi & Detail Solusi

### A. Restrukturisasi Modular Layar Masuk (`UI-21-01`)
1. **Pemisahan Tanggung Jawab (*Separation of Concerns*):**
   - **`src/components/login/LoginHeroCard.tsx`:** Fokus pada branding PUSM (logo tajam berbayang lembut, gradien judul), badge operasional mikrotrans, tombol masuk Google utama yang empuk dan jelas, hint akun, dan status error ramah pengguna.
   - **`src/components/login/LoginFeatureCards.tsx`:** Menampilkan 3 pilar fungsionalitas aplikasi (Dashboard Capaian, Pencarian Unit Cepat, dan Form Cepat & Presisi) dalam bentuk kartu kaca modern yang proporsional.
   - **`src/components/login/LoginFooter.tsx`:** Menjaga tautan penting kepatuhan Google (Kebijakan Privasi, Syarat Layanan, Kontak Pengembang) dan baris hak cipta di bagian bawah.
   - **`src/components/LoginScreen.tsx`:** Berubah dari god-file 1.132 baris menjadi orkestrator ramping (< 180 baris) yang mengelola alur login Google, autentikasi Supabase, dan event URL hash.

### B. Edukasi & Kepatuhan via Bottom Sheet (`UI-21-02`)
1. **Penyimpanan Dinding Teks ke `LoginInfoModal.tsx`:**
   - Seluruh teks panjang:
     - *Tentang PUSM & Digitalisasi Lapangan*
     - *Komparasi PUSM vs Google Spreadsheet HP*
     - *Transparansi Izin Akses Google Spreadsheet & Scope Resmi Google*
   - Kini disimpan secara rapi di dalam Bottom Sheet interaktif bergaya iOS yang muncul mulus saat tombol *"ℹ️ Pelajari Aplikasi & Izin Akses"* di-tap.
2. **Kepatuhan Verifikasi Google OAuth 100% Utuh:**
   - Navigasi URL Hash `#privacy`, `#terms`, `#developer`, dan `#info` tetap aktif dan langsung membuka modal dokumen terkait, menjamin kepatuhan penuh saat dievaluasi oleh sistem audit dan crawler Google Cloud Platform.
3. **Dukungan Navigasi Mobile Native:**
   - Terintegrasi dengan hook `useMobileBackHandler` sehingga tombol back fisik maupun gestur usap kembali pada smartphone dapat menutup modal informasi dan modal hukum secara intuitif.

---

## 2. Before vs After

### A. Kompleksitas & Struktur File `LoginScreen.tsx`

* **Before (God-File 1.132 Baris Monolithic):**
  ```tsx
  export function LoginScreen({ onLoginSuccess, isApiReady }: Props) {
    // 150 baris auth state & handler
    return (
      <div className="app-container">
        {/* Seksi 1: Hero Card (160 baris) */}
        {/* Seksi 2: Dinding Teks Tujuan Aplikasi (130 baris) */}
        {/* Seksi 3: Dinding Teks Perbandingan Spreadsheet (270 baris) */}
        {/* Seksi 4: Dinding Teks Izin Google & Scope Accordion (160 baris) */}
        {/* Seksi 5: Fitur Utama (150 baris) */}
        {/* Seksi 6: Footer & Modals (100 baris) */}
      </div>
    );
  }
  ```

* **After (Orkestrator Ramping & Bersih 177 Baris):**
  ```tsx
  export function LoginScreen({ onLoginSuccess, isApiReady }: Props) {
    // Auth state, hooks, & URL hash handler terisolasi rapi
    return (
      <div className="app-container login-page-container">
        <LoginHeroCard
          isLoading={isLoading}
          isApiReady={isApiReady}
          error={error}
          onLogin={handleLogin}
          onOpenInfo={() => setIsInfoModalOpen(true)}
        />
        <LoginFeatureCards />
        <LoginFooter onSelectModal={(modal) => setActiveModal(modal)} />
        <LoginInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        <LegalModals activeModal={activeModal} onClose={closeModal} />
      </div>
    );
  }
  ```

### B. Pengalaman Pengguna Layar HP (Mobile Viewport)

* **Before:** Petugas lapangan harus menggulir melewati tumpukan teks panjang dan perbandingan tabel yang memakan ruang hingga 4–5 kali tinggi layar smartphone.
* **After:** Area aksi login langsung tampak penuh di layar pertama (*above-the-fold*) tanpa perlu menggulir. Bagi pengguna baru atau auditor Google yang ingin membaca panduan, informasi lengkap tersedia dalam satu sentuhan pada tombol info.

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Lapangan Masuk Saat Pergantian Shift Terburu-Buru
* **Kondisi:** Petugas tiba di pool bus jam 05.45 WIB saat pergantian shift pagi dan harus segera mencatat data bus pertama yang berangkat.
* **Masalah Lama:** Petugas membuka aplikasi di HP dan disajikan teks panjang, tombol login berada di tengah keramaian visual yang membingungkan.
* **Hasil Perbaikan:** Layar login terbuka seketika dengan kartu hero bersih, tombol hijau "Masuk dengan Akun Google" langsung terpampang di tengah layar sentuh. Petugas menekan tombol dengan satu tap dan langsung masuk ke dashboard dalam hitungan detik.

### Skenario 2: Verifikasi Audit Keamanan Google Cloud Platform
* **Kondisi:** Crawler atau tim peninjau OAuth Google mengakses URL aplikasi dengan tautan `#privacy` atau `#terms`.
* **Masalah Lama:** Seluruh teks bercampur dalam file DOM yang sangat padat sehingga navigasi dialog rentan crash saat render.
* **Hasil Perbaikan:** Hash listener langsung mengenali parameter URL dan membuka modal dokumen hukum resmi dengan format teks yang rapi dan legalitas yang jelas, memenuhi standar verifikasi Google Cloud tanpa hambatan.
