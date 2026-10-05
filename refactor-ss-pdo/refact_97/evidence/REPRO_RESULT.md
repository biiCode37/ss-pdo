# Reproduksi R97-01

Probe sementara dibuat sebagai `stack-order-reproduction.test.tsx`, dijalankan dengan:

```text
pnpm run test refactor-ss-pdo/refact_97/evidence/stack-order-reproduction.test.tsx
```

Hasil: `Test Files 1 passed (1)`, `Tests 1 passed (1)`, exit code 0. Setelah dijalankan, file diganti nama menjadi `stack-order-reproduction.case.tsx` agar tidak otomatis ikut suite aplikasi.

Asersi yang lulus menunjukkan kondisi salah yang dihasilkan kode sekarang:

```text
zIndex(Report) > zIndex(Queue)
isTopmostModal("queue-modal") === true
isTopmostModal("route-operational-report-modal") === false
```

Urutan probe: Queue terbuka pada render pertama; render kedua membuka Report dan menciptakan callback `onClose` baru untuk kedua modal, sesuai pola callback inline di `Dashboard.tsx`.
