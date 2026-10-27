# Git Branching Strategy: Mandatory `devmode` Isolation

## Core Rule
1. **Pengerjaan Eksklusif di `devmode`:**
   Semua aktivitas pengembangan, modifikasi kode, debugging, penambahan fitur, audit, dan refactor **WAJIB** dilakukan di branch `devmode`.
2. **Inisialisasi Otomatis:**
   Jika branch `devmode` belum ada pada repositori/proyek yang sedang dikerjakan, agent **WAJIB** membuat branch tersebut terlebih dahulu (`git checkout -b devmode`) sebelum melakukan modifikasi file apa pun.
3. **Isolasi Penuh dari Branch Utama:**
   Agent **DILARANG KERAS** menyentuh, mengakses, mengubah, melakukan checkout, atau memodifikasi branch `main` / `master` / `production` kecuali ada instruksi eksplisit langsung dari pengguna.
4. **Push & Deploy:**
   Push ke remote `devmode` hanya dilakukan ketika diperintahkan secara spesifik oleh pengguna (*"push devmode"* atau *"PD"*).
5. **Perintah Cepat "PA" (Push All):**
   - Ketika pengguna mengatakan/memberikan perintah `"PA"`, itu artinya **Push All**.
   - Agent **WAJIB** secara otomatis menjalankan rangkaian tugas berurutan:
     `commit > push devmode > switch branch main > merge devmode ke main > push main` (lalu kembali checkout ke `devmode`).
   - **Klausul Keselamatan Wajib (Larangan Keputusan Mandiri):**
     Jika ditemukan kendala/permasalahan dalam proses tugas-tugas itu (seperti merge conflict, test gagal, build gagal, git rejection, atau anomali jaringan), agent **DILARANG KERAS mengambil keputusan sendiri**. Agent **WAJIB memberi konfirmasi kepada pengguna mengenai permasalahan yang ditemukan secara transparan dilengkapi dengan rekomendasi solusi**, lalu menunggu keputusan/arahan pengguna sebelum melanjutkan atau mengulangi tugas yang belum selesai/terganggu/terhenti.
6. **Perintah Cepat "PD" (Push Devmode Saja):**
   - Ketika pengguna mengatakan/memberikan perintah `"PD"`, itu artinya **Push Devmode Saja**.
   - Agent **WAJIB** hanya menjalankan perintah: `git push origin devmode` langsung dari branch `devmode`.
   - Agent **DILARANG KERAS menyentuh, merge, checkout, atau melakukan push ke branch `main` sama sekali**. Branch lokal dan seluruh pekerjaan tetap terisolasi di `devmode`.
