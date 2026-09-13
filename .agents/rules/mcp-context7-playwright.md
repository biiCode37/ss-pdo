---
trigger: model_decision
description: Gunakan context7 untuk dokumentasi library terkini dan playwright untuk automasi pengujian browser.
---

# MCP Tools: Context7 & Playwright

## 1. Context7 MCP
- **Fungsi:** Mengambil dokumentasi resmi, contoh kode, dan referensi API versi terbaru (React, Supabase, Vitest, Vite, Tailwind, dll.) langsung dari sumber terverifikasi.
- **Kapan Digunakan:**
  - Saat memerlukan referensi API terbaru dari dependensi proyek.
  - Saat memeriksa best practice integrasi library baru atau memverifikasi signature fungsi.

## 2. Playwright MCP
- **Fungsi:** Automasi browser terpadu untuk pengujian end-to-end (E2E), verifikasi UI secara visual, navigasi interaktif, dan pengambilan tangkapan layar (*screenshot/snapshot*).
- **Kapan Digunakan:**
  - Saat melakukan verifikasi alur aplikasi di browser lokal (`npm run dev`).
  - Saat memvalidasi layout mobile-first dan memastikan tidak ada elemen yang terpotong di berbagai resolusi layar.
