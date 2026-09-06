# Git Branching Strategy: Mandatory `devmode` Isolation

## Core Rule
1. **Pengerjaan Eksklusif di `devmode`:**
   Semua aktivitas pengembangan, modifikasi kode, debugging, penambahan fitur, audit, dan refactor **WAJIB** dilakukan di branch `devmode`.
2. **Inisialisasi Otomatis:**
   Jika branch `devmode` belum ada pada repositori/proyek yang sedang dikerjakan, agent **WAJIB** membuat branch tersebut terlebih dahulu (`git checkout -b devmode`) sebelum melakukan modifikasi file apa pun.
3. **Isolasi Penuh dari Branch Utama:**
   Agent **DILARANG KERAS** menyentuh, mengakses, mengubah, melakukan checkout, atau memodifikasi branch `main` / `master` / `production` kecuali ada instruksi eksplisit langsung dari pengguna.
4. **Push & Deploy:**
   Push ke remote `devmode` hanya dilakukan ketika diperintahkan secara spesifik oleh pengguna (*"push devmode"*).
