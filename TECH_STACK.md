# 📋 Laporan Audit Tech Stack & Arsitektur SS_PDO

> **Tanggal Audit:** 1 November 2026  
> **Status:** Terverifikasi & Aktif  
> **Target Aplikasi:** PUSM - PDO Utara Spreadsheet Mobile (SS_PDO)  
> **Repositori:** `biiCode37/ss-pdo` | Branch: `devmode`

---

## 1. Ringkasan Eksekutif

**SS_PDO** adalah aplikasi web progresif (*Progressive Web App* / PWA) operasional berbasis **Mobile-First** dan **Offline-First**. Aplikasi ini dirancang khusus untuk mempermudah pencatatan dan sinkronisasi data shift operasional bus Transjakarta (KM Awal/Akhir, TOA, Ritase, Manual Shift) di lapangan dengan mengadopsi Google Sheets sebagai *Single Source of Truth* (SSOT) serta Supabase PostgreSQL sebagai basis data autentikasi, otorisasi peran (RBAC), dan *caching/state persistence*.

---

## 2. Rincian Lapisan Teknologi (Technology Stack Breakdown)

### A. Frontend Core & Runtime
* **Framework:** [React 19](file:///D:/MINE/SS_PDO/package.json) (`19.2.7`) & [React DOM](file:///D:/MINE/SS_PDO/package.json) (`19.2.7`).
* **Bahasa & Type System:** [TypeScript](file:///D:/MINE/SS_PDO/package.json) (`~6.0.2`) dengan konfigurasi `strict: true` (Zero `any` policy, proteksi *runtime* maksimal).
* **Build Tool & Bundler:** [Vite 8](file:///D:/MINE/SS_PDO/vite.config.ts) (`8.1.1`) menggunakan `@vitejs/plugin-react` (`6.0.3`).
* **Optimasi Bundle Rollup:** *Manual chunk splitting* untuk memisahkan vendor berat (`vendor-supabase`, `vendor-swal`, `vendor-react`) guna mempercepat waktu interaksi awal (*TTI*) pada koneksi seluler lambat.

### B. Mobile-First & Progressive Web App (PWA)
* **PWA Engine:** [vite-plugin-pwa](file:///D:/MINE/SS_PDO/vite.config.ts) (`1.3.0`) dengan Service Worker terdaftar (`registerType: "autoUpdate"`).
* **Manifest & Display:** Mode *standalone*, orientasi *portrait*, tema gelap (`#0f172a`), serta dukungan ikon *maskable*.
* **UX & Sentuh Lapangan:** Transisi fluida berbasis kurva pegas iOS (`cubic-bezier(0.32, 0.72, 0, 1)`), *morphing selector*, dan penyembunyian bilah gulir fisik (`.no-scrollbar`).

### C. Backend, Database & Keamanan (Supabase & Edge Functions)
* **BaaS / Database Client:** [@supabase/supabase-js](file:///D:/MINE/SS_PDO/package.json) (`2.112.0`).
* **Database Engine:** PostgreSQL dengan kebijakan keamanan ketat **Row-Level Security (RLS)** untuk seluruh tabel peran dan data operasional.
* **Anti-Privilege Escalation:** Operasi mutasi peran administratif dieksekusi melalui prosedur tersimpan PostgreSQL **`SECURITY DEFINER` (RPC)** di server.
* **Supabase Realtime:** Sinkronisasi multi-pengguna untuk status armada (*fleet status*) dan plotting rute.
* **Edge Functions (Deno):**
  * `sheets-proxy`: Proxy mutasi Google Sheets API via Google Service Account yang terisolasi dari browser client.
  * `sheet-sync-webhook`: Penanganan webhook dan orkestrasi sinkronisasi data terjadwal.

### D. Integrasi Spreadsheet & SSOT (Google Sheets API)
* **API Client:** Google Sheets API v4 (`@types/gapi.client.sheets`) & Google Identity Services (`@types/gapi.auth2`).
* **Prinsip SSOT:** Google Sheets berfungsi sebagai *Single Source of Truth*. Data kalkulasi operasional dibaca langsung dari formula spreadsheet.
* **Proteksi Kolom Berumus (*Strict Formula Protection*):** Sistem memfilter kolom berumus (seperti `TOA SHIFT 2 = TOTAL_TOA - TOA_SHIFT_1`, total ritase bus, akumulasi KM) agar **tidak pernah tertimpa** oleh nilai statis pada mutasi form penuh maupun bulk update.

### E. Arsitektur State Management & Offline-First Engine
* **State Management:** React Context API murni & Custom Hooks terisolasi (menghindari ketergantungan library state berat seperti Redux/Zustand sesuai prinsip KISS/YAGNI).
* **Atomic Queueing:** Antrean sinkronisasi offline disimpan secara atomik per-item pada `localStorage` (mencegah *head-of-line blocking*).
* **Exponential Backoff:** Algoritma percobaan ulang otomatis bertahap saat koneksi terputus (2 detik → 5 detik → 15 detik → 60 detik).
* **Optimistic Concurrency Control (OCC):** Deteksi tabrakan data sebelum menyimpan (*pre-flight check*) dengan opsi komparasi Server vs Lokal.
* **Smart Auto-Save:** Debounce input lokal (`useDebounce`) dengan pelacakan status perubahan (*dirty tracking*).

### F. UI/UX, Sistem Token Warna & Aksesibilitas
* **Pure CSS Design Tokens:** Tidak memakai framework CSS eksternal (Tailwind/Bootstrap). Seluruh styling menggunakan variabel semantik murni pada [semantic.css](file:///D:/MINE/SS_PDO/src/styles/tokens/semantic.css) dan [primitives.css](file:///D:/MINE/SS_PDO/src/styles/tokens/primitives.css).
* **Dual Theme (Light & Dark):** Kepatuhan aksesibilitas tinggi dengan verifikasi rasio kontras **WCAG AA (≥ 4.5:1)** dan **WCAG AAA (≥ 7.0:1)**.
* **Ikonografi:** [Lucide React](file:///D:/MINE/SS_PDO/package.json) (`1.24.0`).
* **Modal & Alert Dialog:** [SweetAlert2](file:///D:/MINE/SS_PDO/package.json) (`11.26.25`) dengan adapter tema custom (`pdoSwal`) dan sanitasi anti-XSS (`escapeHtml`).
* **Kamus Teks Sentral:** Seluruh teks antarmuka dikelola terpusat pada [src/constants/texts/](file:///D:/MINE/SS_PDO/src/constants/texts/) (bebas *hardcoded string*).

### G. Testing, Linting & Quality Assurance
* **Test Runner:** [Vitest](file:///D:/MINE/SS_PDO/package.json) (`4.1.10`) terintegrasi langsung dengan konfigurasi Vite.
* **Virtual DOM:** [Happy DOM](file:///D:/MINE/SS_PDO/package.json) (`20.11.1`) untuk pengujian DOM dan hook secara cepat dan hemat memori.
* **Linter:** [Oxlint](file:///D:/MINE/SS_PDO/package.json) (`1.71.0`) — Linter statis generasi baru berbasis Rust dengan kecepatan analisis ekstrem.
* **Uji Kontrak Warna Otomatis:** [color-contract.test.ts](file:///D:/MINE/SS_PDO/src/styles/tokens/color-contract.test.ts) untuk menjamin seluruh rasio kontras token warna memenuhi standar WCAG.
* **Knowledge Graph:** Graf pengetahuan berbasis AST via Graphify (`graphify-out/`).

### H. Tooling & Package Manager
* **Package Manager:** `pnpm` (wajib) dengan lockfile deterministik (`pnpm-lock.yaml`).
* **Runtime:** Node.js LTS.

---

## 3. Matriks Komponen & Versi Dependensi

| Kategori | Teknologi / Pustaka | Versi | Peran Utama |
| :--- | :--- | :--- | :--- |
| **Framework** | React & React DOM | `^19.2.7` | Inti UI komponen reaktif |
| **Bahasa** | TypeScript | `~6.0.2` | Tipe data statis & Strict Type Checking |
| **Bundler / Dev** | Vite | `^8.1.1` | Dev server & Rollup production bundler |
| **PWA** | vite-plugin-pwa | `^1.3.0` | Service Worker, offline cache, manifest |
| **BaaS / Database** | @supabase/supabase-js | `^2.112.0` | Postgres DB, Auth, RLS, RPC, Realtime |
| **Edge Functions** | Deno Runtime | *Internal Supabase* | Proxy Service Account & Webhooks |
| **Google API** | @types/gapi.client.sheets | `^4.0.20201031` | Tipe data integrasi Google Sheets v4 |
| **Ikonografi** | lucide-react | `^1.24.0` | Ikon UI modern & tree-shakeable |
| **Dialog / Modal** | sweetalert2 | `^11.26.25` | Modal input cepat & konfirmasi interaktif |
| **Styling** | Vanilla CSS Tokens | *Native CSS Vars* | Token tema semantik Light & Dark |
| **Test Runner** | Vitest | `^4.1.10` | Unit test & regression quality gates |
| **DOM Mock** | happy-dom | `^20.11.1` | Headless browser environment untuk testing |
| **Linter** | oxlint | `^1.71.0` | Static analysis & code linter berbasis Rust |
| **Package Tool** | pnpm | *Workspace Engine* | Package manager efisien & deterministik |

---

## 4. Prinsip Arsitektur Utama (*Golden Rules*)

1. **SSOT Spreadsheet:** Google Sheets adalah sumber data mutlak; dilarang melakukan pembulatan desimal sepihak atau mengubah formula sel asli.
2. **Strict No-Overwrite Formula:** Kolom hasil rumus spreadsheet tidak boleh disertakan dalam payload mutasi.
3. **Sentralisasi Kamus Teks:** Dilarang menggunakan string antarmuka hardcoded di komponen JSX/TSX; seluruh teks wajib merujuk ke `src/constants/texts/`.
4. **Kontras Aksesibilitas WCAG:** Dilarang menggunakan raw hex/rgb di styling komponen; wajib menggunakan token CSS semantik yang lolos uji rasio kontras 2 tema.
5. **Keamanan RLS & RPC:** Seluruh operasi sensitif diverifikasi ketat di server database PostgreSQL melalui fungsi `SECURITY DEFINER`.
