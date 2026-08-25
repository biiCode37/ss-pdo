export type UserRole = 'superadmin' | 'admin' | 'petugas';

const VALID_ROLES: UserRole[] = ['superadmin', 'admin', 'petugas'];

/**
 * Membaca & memvalidasi role user dari localStorage.
 * Nilai tidak valid / rusak (misal hasil manipulasi manual) fallback ke
 * 'petugas' agar guard RBAC tidak terlewati oleh string arbitrer.
 */
export function getStoredUserRole(): UserRole {
  try {
    const raw = localStorage.getItem('PDO_USER_ROLE');
    return VALID_ROLES.includes(raw as UserRole) ? (raw as UserRole) : 'petugas';
  } catch {
    return 'petugas';
  }
}
