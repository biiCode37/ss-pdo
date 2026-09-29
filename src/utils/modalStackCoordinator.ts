/**
 * modalStackCoordinator.ts
 *
 * Koordinator stack LIFO terpusat untuk penutupan Escape tombol keyboard pada dialog bertumpuk.
 * Menjamin hanya dialog paling atas (topmost) yang menerima event Escape.
 */

export interface ModalDismissEntry {
  id: string;
  onDismiss: () => void;
  zIndex?: number;
}

const activeModalStack: ModalDismissEntry[] = [];

/**
 * Mendaftarkan modal ke dalam active modal stack saat dibuka.
 * Mengembalikan fungsi unregister untuk cleanup saat ditutup/unmount.
 * 
 * MITIGASI R97-01: Jika modal dengan id yang sama sudah terdaftar (misal update callback),
 * perbarui secara in-place tanpa mengubah urutan stack LIFO.
 */
export function registerModalDismiss(entry: ModalDismissEntry): () => void {
  const existingIdx = activeModalStack.findIndex((m) => m.id === entry.id);
  if (existingIdx !== -1) {
    activeModalStack[existingIdx] = entry;
    return () => {
      const idx = activeModalStack.findIndex((m) => m.id === entry.id);
      if (idx !== -1) {
        activeModalStack.splice(idx, 1);
      }
    };
  }

  activeModalStack.push(entry);

  let unregistered = false;
  return () => {
    if (unregistered) return;
    unregistered = true;
    const idx = activeModalStack.lastIndexOf(entry);
    if (idx !== -1) {
      activeModalStack.splice(idx, 1);
    }
  };
}

/**
 * Memeriksa apakah modal dengan id yang diberikan merupakan modal teratas (topmost) di stack.
 */
export function isTopmostModal(id: string): boolean {
  if (activeModalStack.length === 0) return false;
  return activeModalStack[activeModalStack.length - 1].id === id;
}

/**
 * Mendapatkan entri modal teratas (topmost) di stack.
 */
export function getTopmostModal(excludeId?: string): ModalDismissEntry | undefined {
  return getTopmostModalExcluding(excludeId);
}

/**
 * Mendapatkan entri modal teratas (topmost) di stack, dengan mengecualikan ID tertentu jika sedang dalam proses penutupan.
 */
export function getTopmostModalExcluding(excludeId?: string): ModalDismissEntry | undefined {
  if (activeModalStack.length === 0) return undefined;
  if (!excludeId) return activeModalStack[activeModalStack.length - 1];

  for (let i = activeModalStack.length - 1; i >= 0; i--) {
    if (activeModalStack[i].id !== excludeId) {
      return activeModalStack[i];
    }
  }
  return undefined;
}

/**
 * Memeriksa apakah masih ada modal lain yang aktif selain ID yang diberikan.
 */
export function hasOtherActiveModals(currentId: string): boolean {
  return activeModalStack.some((m) => m.id !== currentId);
}

/**
 * Mendapatkan nilai z-index tertinggi dari seluruh modal yang sedang aktif di stack.
 */
export function getHighestActiveZIndex(): number {
  if (activeModalStack.length === 0) return 0;
  let maxZ = 0;
  for (const item of activeModalStack) {
    if (typeof item.zIndex === "number" && item.zIndex > maxZ) {
      maxZ = item.zIndex;
    }
  }
  return maxZ;
}

/**
 * Mengambil jumlah modal aktif dalam stack terkoordinasi (untuk pengujian & diagnostik).
 */
export function getActiveModalStackCount(): number {
  return activeModalStack.length;
}

/**
 * Reset modal stack untuk isolasi pengujian.
 * @internal
 */
export function _resetModalStackForTest(): void {
  activeModalStack.length = 0;
}
