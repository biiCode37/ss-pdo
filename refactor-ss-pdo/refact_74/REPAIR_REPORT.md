# Repair Report - Refactor 74

Laporan implementasi pemindahan menu profil ke bilah navigasi bawah (*Bottom Navigation*) pada halaman Monitoring Wilayah.

---

## 1. Ringkasan Perubahan

1. **Kamus Teks Sentral (`src/constants/texts/text_monitoring.ts`):**
   * Menambahkan kunci `PROFILE: 'Profil'` di dalam objek `TEXT_MONITORING.NAV`.
   * Menambahkan pengujian token di `src/constants/texts/texts.test.ts`.

2. **Monitoring Bottom Nav (`src/components/monitoring/MonitoringBottomNav.tsx`):**
   * Menambahkan prop `onOpenProfile?: () => void` ke dalam interface `MonitoringBottomNavProps`.
   * Menambahkan state avatar pengguna dengan sinkronisasi otomatis via `storage` event listener.
   * Menambahkan tombol item ke-5 pada nav bar dengan avatar mini 22px (atau ikon `User` bila tanpa avatar), label "Profil", dan respons interaksi sentuhan jempol yang halus.
   * Mengoptimalkan fleksibilitas tombol (`flex: 1`, `minWidth: 0`) agar 5 item navigasi muat secara seimbang dan proporsional di seluruh ukuran layar smartphone.

3. **Monitoring Header (`src/components/monitoring/MonitoringHeader.tsx`):**
   * Menghapus pemanggilan `UserProfileHeader` dan prop `onOpenProfile`.
   * Menghilangkan import komponen yang tidak lagi terpakai. Header monitoring kini lebih fokus, lapang, dan bersih.

4. **Monitoring Page Container (`src/components/monitoring/AllRouteMonitoringPage.tsx`):**
   * Meneruskan prop `onOpenProfile` ke `<MonitoringBottomNav />` dan melepaskannya dari `<MonitoringHeader />`.

5. **Unit Tests:**
   * Menambahkan pengujian unit komprehensif pada `src/components/monitoring/MonitoringBottomNav.test.tsx` untuk memastikan tombol profil muncul saat `onOpenProfile` tersedia dan memicu callback saat ditekan.

---

## 2. Before vs After

### A. Tampilan Header Monitoring
* **Before:**
  ```tsx
  {/* MonitoringHeader.tsx */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {/* Stepper tanggal, refresh, tarik 18 rute */}
    {onOpenProfile && (
      <div style={{ marginLeft: "4px" }}>
        <UserProfileHeader onOpenProfile={onOpenProfile} />
      </div>
    )}
  </div>
  ```
* **After:**
  ```tsx
  {/* MonitoringHeader.tsx */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {/* Stepper tanggal, refresh, dan tarik 18 rute leluasa tanpa terhimpit */}
  </div>
  ```

### B. Tampilan Bottom Navigation
* **Before:**
  * Hanya memiliki 4 tab: Dashboard, Rute, Status Armada, Laporan WA.
  * Navigasi profil tersembunyi di pojok kanan atas layar.
* **After:**
  * Memiliki 5 item navigasi ergonomis di bawah layar: Dashboard, Rute, Status Armada, Laporan WA, dan **Profil**.
  * Dilengkapi avatar foto bulat atau ikon `User` dengan feedback tap iOS-spring:
  ```tsx
  {onOpenProfile && (
    <button
      type="button"
      data-testid="monitoring-tab-profile"
      onClick={onOpenProfile}
      className="monitoring-tab-btn"
    >
      {avatarUrl && !avatarFailed ? (
        <div className="avatar-circle">
          <img src={avatarUrl} alt={TEXT_MONITORING.NAV.PROFILE} />
        </div>
      ) : (
        <User size={20} />
      )}
      <span>{TEXT_MONITORING.NAV.PROFILE}</span>
    </button>
  )}
  ```

---

## 3. Case: Skenario Lapangan

* **Skenario:** Pengawas atau Koordinator Wilayah sedang memantau 18 rute di lapangan menggunakan ponsel dengan satu tangan (posisi berdiri di halte atau terminal).
* **Kendala Sebelumnya:** Menjangkau menu profil di sudut kanan paling atas layar smartphone berukuran 6.5–6.7 inci membutuhkan perpindahan genggaman tangan yang berisiko ponsel terjatuh atau salah menekan tombol *Tarik 18 Rute*.
* **Solusi Sesudahnya:** Menu profil kini terletak di sudut kanan bawah bilah navigasi (zona jangkauan jempol / *natural thumb zone*), sehingga pengguna dapat mengakses menu pengaturan, ganti tema light/dark, dan logout dengan satu ketukan santai tanpa menggeser posisi tangan. Header di bagian atas pun menjadi sangat bersih dan nyaman dilihat.

---

## 4. Status Quality Gates

- [x] `pnpm vitest run src/constants/texts/` ➔ **17 passed**
- [x] `pnpm vitest run src/components/monitoring/` ➔ **7 test files, 32 passed**
- [x] `pnpm vitest run src/` ➔ **72 test files, 513 passed (100%)**
- [x] `pnpm run build` ➔ **Success in 4.45s (0 error)**
