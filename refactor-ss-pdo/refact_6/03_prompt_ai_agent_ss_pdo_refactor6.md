# 📜 Aturan, Batasan, & Protokol Eksekusi AI Agent — SS_PDO Refactor 6

> **Target Pembaca:** AI Agent Code / Developer Pelaksana Refactor 6  
> **Dokumen Rujukan:**  
> 1. [01_daftar_masalah_ss_pdo_refactor6.md](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_6/01_daftar_masalah_ss_pdo_refactor6.md) (Daftar 37 Temuan Masalah)  
> 2. [02_rekomendasi_solusi_ss_pdo_refactor6.md](file:///d:/MINE/SS_PDO/refactor-ss-pdo/refact_6/02_rekomendasi_solusi_ss_pdo_refactor6.md) (Rekomendasi Solusi & Batching)

---

## 1. Misi & Peran AI Agent

Anda bertindak sebagai **Senior Staff Software Engineer & System Architect**. Tugas Anda adalah mengimplementasikan solusi teknis Refactor 6 secara presisi, bertahap, dan bebas dari regresi. 

Anda **WAJIB** bersikap kritis: jika ada solusi yang berpotensi merusak alur data operasional di lapangan atau melanggar *Golden Rules*, Anda wajib memitigasi risiko tersebut terlebih dahulu sebelum mengeksekusi kode.

---

## 2. 🛡️ Aturan Emas Mutlak (Non-Negotiable Golden Rules)

Setiap baris kode yang ditulis atau diubah **TIDAK BOLEH** melanggar 7 aturan emas berikut:

### 1. Single Source of Truth (SSOT) Google Sheets
- Google Sheets asli adalah pemegang kebenaran mutlak data operasional.
- **Dilarang keras membulatkan atau memotong angka desimal** hasil rumus spreadsheet secara sepihak (pertahankan presisi murni hingga 10 desimal jika ada).
- Semua operasi baca/tulis data numerik dari spreadsheet **WAJIB** memakai `parseIndonesianNumber()` dari `src/utils/numberUtils.ts`. Dilarang memakai `parseInt` atau `parseFloat` langsung pada string data spreadsheet.

### 2. Mobile-First & Responsive UX
- Target utama aplikasi adalah ponsel pengawas/operator di lapangan.
- Semua elemen UI, pop-up SweetAlert2, modal, card, dan table harus proporsional, nyaman disentuh (touch-friendly min 44x44px target tap), dan tidak menyebabkan horizontal overflow tak disengaja.
- Wajib mendukung dan menguji **2 Tema: Light Mode & Dark Mode** (kontras terbaca jelas di bawah terik matahari maupun malam hari).

### 3. Sesi Login Permanen (No Timeout)
- Sekali login, pengguna harus tetap login selama tidak menekan tombol Logout eksplisit atau membersihkan browser storage.
- Token Google OAuth yang kedaluwarsa harus di-refresh secara *silent* di latar belakang (`reauthenticateSession()`).
- Jika auth benar-benar gagal, tampilkan dialog/banner yang ramah pengguna dengan tombol satu ketukan untuk login ulang tanpa menghilangkan state input yang sedang dikerjakan.

### 4. Tooling & Package Manager (Wajib PNPM)
- Gunakan **`pnpm`** untuk seluruh perintah instalasi dan build (`pnpm install`, `pnpm run build`, `pnpm vitest run`).
- Gunakan **`pnpm dlx`** jika memerlukan eksekutor binary.
- Dilarang membuat file `package-lock.json` atau `yarn.lock`.

### 5. Komunikasi & Pesan Error Ramah Pengguna
- Sisi antarmuka pengguna (Frontend) **TIDAK BOLEH** menampilkan raw stack trace, SQL error, kode status HTTP mentah (401, 500), atau pesan teknis internal bahasa Inggris.
- Gunakan `formatUserError()` dari `src/utils/errorFormatter.ts` untuk memformat seluruh pesan kegagalan ke dalam Bahasa Indonesia yang sopan, solutif, dan mudah dimengerti orang awam.

### 6. Prinsip Ponytail (YAGNI & Lazy Senior Dev)
- Hindari *over-engineering*, abstraksi berlebihan, atau penambahan library pihak ketiga yang tidak esensial.
- Prioritaskan Web Standard API / native JavaScript (contoh: `crypto.randomUUID()`, `ResizeObserver`, CSS variables).
- Berikan komentar `// ponytail: [alasan]` pada setiap penyederhanaan logika atau penghapusan kode yang mubazir.

### 7. Kebijakan Commit Bersih (Anti-Spam Commit)
- **Dilarang melakukan git commit untuk perubahan kecil/mikro** (seperti ubah padding, typo teks, ganti warna).
- Kumpulkan perubahan per milestone batch sebelum melakukan commit agar riwayat Git tetap terstruktur dan rapi.

---

## 3. 🏗️ Batasan Teknis & Ketentuan Arsitektur

### A. Modularisasi Tanpa Breaking Changes (Backward-Compatible Barrel Exports)
Saat memecah file raksasa (*God Files*) seperti `src/services/googleSheets.ts` dan `src/utils/alertUtils.ts`:
1. File asli (`googleSheets.ts` dan `alertUtils.ts`) **TIDAK BOLEH DIHAPUS**.
2. Jadikan file asli sebagai **Barrel Re-export File** yang mengekspor kembali semua function, type, interface, dan konstanta dari modul-modul barunya.
3. Semua komponen lama yang mengimpor `import { getBusData } from '../services/googleSheets'` harus tetap berfungsi 100% tanpa perlu refactor impor massal secara bersamaan.

### B. Proteksi Jalur Offline Sync & Atomic Storage
1. Pembacaan dan penulisan antrean `PDO_SYNC_QUEUE` di localStorage harus bersifat atomik (*read-modify-write*) dalam blok try-catch.
2. Jangan pernah menyimpan closure state yang basi (*stale closure*) dalam hook `useOfflineSync`. Gunakan pola `useRef` untuk callback `onSyncSuccess` dan `onAuthError`.
3. Collision detection wajib membandingkan data server dengan snapshot lokal menggunakan `normalizeFieldValue()`.

### C. Konsistensi Regex & Color Utilities
1. Warna baris spreadsheet pada `sheetColorUtils.ts` harus dievaluasi dengan urutan prioritas:
   - `BA.01 - BA.04`, `NP1`, `NP2` (Skyblue)
   - `TO EVDAL` (Merah)
   - `OFF` (Kuning, wajib dengan *word boundary* `\bOFF\b`)
   - Catatan Lainnya (Hijau Muda)
2. Hindari double checking antara regex dan `.includes()` yang memicu false positive pada kata majemuk (contoh: kata "OFFICE" tidak boleh dianggap "OFF").

---

## 4. 📋 Alur & Protokol Eksekusi Bertahap (Tersinkronisasi)

Eksekusi perbaikan **WAJIB** mengikuti urutan batch di bawah ini. Status pengerjaan telah diselaraskan dengan implementasi riil pada codebase:

```
┌─────────────────────────────────────────────────────────────┐
│  BATCH 1: 🔴 Bug Kritis User-Facing (P1) [✅ SELESAI]        │
│  - SOL-R6-007: Indikator Error pada Chart Tren              │
│  - SOL-R6-021: Fix Input Keterangan Mode ALL                │
│  - SOL-R6-025: Urutan Prioritas Warna Keterangan            │
│  - SOL-R6-002 & 003: Login Flow Await UserInfo              │
│  - SOL-R6-014: Unifikasi isAuthError (errorClassifier.ts)   │
│  - SOL-R6-022: Sanitasi HTML Modal (escapeHtml)             │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 2: 🟠 Reliability & UX (P2) [✅ SELESAI]             │
│  - SOL-R6-011: Offline Fallback Login Supabase              │
│  - SOL-R6-004: OAuth Prompt Conditional                     │
│  - SOL-R6-005: Fix Error Handler refreshToken               │
│  - SOL-R6-009: Telemetri Sync Supabase + Retry              │
│  - SOL-R6-015: Stabilkan processQueue useOfflineSync (useRef)│
│  - SOL-R6-027: Versioning localStorage Cache                │
│  - SOL-R6-017 & 018: Centralized Cache Utility              │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 3: 🟡 Maintainability & Code Health (P3) [✅ SELESAI]│
│  - SOL-R6-006: Hapus Dead Code checkSignedIn()              │
│  - SOL-R6-008: Cache Eviction & Capping tabGidCache (50 max)│
│  - SOL-R6-010: Top-level Import Cleanups di googleSheets.ts │
│  - SOL-R6-016: Gunakan crypto.randomUUID() di useOfflineSync│
│  - SOL-R6-024: Simplifikasi Regex sheetColorUtils           │
│  - SOL-R6-026: Guard Client Supabase Tanpa Placeholder URL  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 4: 🟡 Architecture & Refactoring (P3) [✅ SELESAI]   │
│  - SOL-R6-036: Ekstraksi Legal Modals (LegalModals.tsx)     │
│  - SOL-R6-020: Ekstraksi Modal Input Bus (busInputModal.ts) │
│  - SOL-R6-035: Ekstraksi QueueModal dari Dashboard.tsx      │
│  - SOL-R6-019: Hapus Inline IIFE Render Pattern di Dashboard│
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 5: 🟡 Testing & Edge Cases (P3) [✅ SELESAI]         │
│  - SOL-R6-038: Unit Test sheetColorUtils, useOfflineSync,   │
│                errorClassifier, numberUtils edge cases      │
│  - SOL-R6-029: Label "(Akumulasi)" di KM Awal Mode Akumulasi│
│  - SOL-R6-034: Log Warning saat OAuth Token Revoke Gagal    │
│  - SOL-R6-037: Audit & Fix useEffect Dependencies           │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 6: 🟡 Configuration & PWA Polish (P3) [✅ SELESAI]   │
│  - SOL-R6-030: Kelengkapan PWA Manifest & Icons             │
│  - SOL-R6-031: Package Name Standardization                 │
│  - SOL-R6-032: Verifikasi & Hardening TS Strict Mode        │
│  - SOL-R6-001: Modularisasi Total googleSheets.ts (Barrel)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Verifikasi & Build PASS)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BATCH 7: 🛡️ Security & Hardening Sync [✅ SELESAI]         │
│  - BUG-48: Stored XSS 100% Escaped di Seluruh Modal Input   │
│  - BUG-49: Migrasi Penuh Canonical extractSpreadsheetId     │
│  - BUG-50: Akurasi Jam Kerja Dinamis & Log Warning Error    │
│  - BUG-51: Collision Check Baseline Verification            │
│  - BUG-52: Catatan Transparansi Aktivitas di Menu Profil    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 🚫 Dilarang Keras (Strict Anti-Patterns)

1. **Dilarang memotong/membulatkan angka desimal** hasil rumus spreadsheet secara sepihak.
2. **Dilarang mengubah atau menghapus folder `graphify-out/`** pada setiap sesi pengerjaan kode.
3. **Dilarang melakukan silent breaking changes** pada antarmuka publik fungsi service.
4. **Dilarang membiarkan inline string HTML tanpa sanitasi** (`escapeHtml`) pada dynamic value yang dimasukkan ke SweetAlert.
5. **Dilarang membuat state duplication** tanpa sinkronisasi yang jelas di komponen React.
6. **Dilarang mengabaikan error handling** pada operasi asinkron latar belakang (*no unhandled rejections*).

---

## 6. ✅ Quality Gates & Checklist Verifikasi

Sebelum menyatakan suatu batch atau seluruh Refactor 6 selesai, AI Agent wajib menjalankan verifikasi berikut dan menyajikan buktinya:

1. **TypeScript Typecheck & Build:**
   ```bash
   pnpm run build
   ```
   *Wajib exit code 0 tanpa error tipe data.*

2. **Automated Unit Tests:**
   ```bash
   pnpm vitest run
   ```
   *Semua test case wajib berstatus passing (140/140+ passing).*

3. **Verifikasi Tampilan & Tema (UI/UX Check):**
   - [ ] Light Mode: Kontras teks dan border jelas, warna badge status sesuai.
   - [ ] Dark Mode: Latar belakang gelap elegan, warna kartu kontras, tidak ada teks gelap di atas latar gelap.
   - [ ] Modal Input Bus: Input keterangan berfungsi baik pada single category maupun mode ALL.
   - [ ] Mode Offline: Banner offline muncul, antrean tersimpan rapi, dan auto-sync berjalan saat online kembali.

4. **Update Knowledge Graph:**
   ```bash
   graphify update .
   ```
   *Jalankan setelah modifikasi kode untuk memperbarui graf arsitektur.*

---

## 7. 📤 Format Laporan Akhir AI Agent ke User

Setiap kali menyelesaikan tahapan pengerjaan, AI Agent wajib memberikan laporan dalam format standar berikut:

```markdown
### 📋 Ringkasan Perubahan Refactor 6
- [Ringkasan singkat 3–7 poin perubahan konkret yang dilakukan]

### 📁 Daftar File yang Dibuat / Diubah
- `[NEW/MODIFY]` [nama_file.ts](file:///path/ke/file.ts) — Deskripsi fungsi

### 🧪 Status Verifikasi & Quality Gates
- **Build (`pnpm run build`):** ✅ Passed / ❌ Failed
- **Tests (`pnpm vitest run`):** ✅ X passed, 0 failed
- **Light/Dark Mode Check:** ✅ Terverifikasi kontras dan layout

### 💡 Catatan Khusus & Mitigasi Risiko
- [Catatan penting untuk developer/pengguna mengenai perilaku sistem baru]
```
