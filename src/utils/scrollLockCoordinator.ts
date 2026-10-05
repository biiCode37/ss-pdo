/**
 * scrollLockCoordinator.ts
 *
 * Koordinator penguncian body scroll terpusat berbasis reference counting.
 * Menjamin body.style.overflow tidak bocor saat dialog bertumpuk atau ditutup dalam urutan berbeda (A/B).
 * Idempotent untuk unmount/mount StrictMode dan mempertahankan nilai overflow awal non-kosong.
 */

let lockCount = 0;
let originalOverflow: string | null = null;

/**
 * Mengunci scroll body dokumen dan mengembalikan fungsi pelepasan (release) yang idempotent.
 * Nilai document.body.style.overflow sebelum penguncian pertama disimpan dan dipulihkan
 * persis seperti semula hanya setelah seluruh kunci dilepas (lockCount kembali ke 0).
 */
export function acquireScrollLock(): () => void {
  if (typeof document === "undefined" || !document.body) {
    return () => {};
  }

  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return; // Idempotent: mencegah pelepasan ganda dari satu pemanggil
    released = true;

    if (lockCount > 0) {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow ?? "";
        originalOverflow = null;
      }
    }
  };
}

/**
 * Mengembalikan jumlah kunci aktif saat ini (berguna untuk pengujian & diagnostik).
 */
export function getActiveScrollLockCount(): number {
  return lockCount;
}

/**
 * Reset status internal koordinator untuk isolasi antartes.
 * @internal
 */
export function _resetScrollLockCoordinatorForTest(): void {
  lockCount = 0;
  originalOverflow = null;
}
