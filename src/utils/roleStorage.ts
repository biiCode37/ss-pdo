export type UserRole = 'superadmin' | 'admin' | 'korwil' | 'korlap' | 'pdo';

export const VALID_ROLES: UserRole[] = ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'];

/**
 * Membaca & memvalidasi role user dari localStorage.
 * Nilai tidak valid / rusak (misal hasil manipulasi manual) fallback ke
 * 'pdo' agar guard RBAC tidak terlewati oleh string arbitrer.
 * Mendukung migrasi dari string warisan 'petugas' -> 'pdo'.
 */
export function getStoredUserRole(): UserRole {
  try {
    const raw = localStorage.getItem('PDO_USER_ROLE');
    if (raw === 'petugas') return 'pdo';
    return VALID_ROLES.includes(raw as UserRole) ? (raw as UserRole) : 'pdo';
  } catch {
    return 'pdo';
  }
}

