export type UserRole = 'superadmin' | 'admin' | 'korwil' | 'korlap' | 'pdo';

export const VALID_ROLES: UserRole[] = ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'];

/**
 * Membaca & memvalidasi role user dari localStorage.
 * Nilai tidak valid / rusak (misal hasil manipulasi manual) fallback ke
 * 'pdo' agar guard RBAC tidak terlewati oleh string arbitrer.
 * Mendukung migrasi dari string warisan 'petugas' -> 'pdo'.
 *
 * SEC-154-03: Anti-Spoofing Guard
 * Mencegah manipulasi localStorage.setItem('PDO_USER_ROLE', 'superadmin')
 * dengan memvalidasi keselarasan peran terhadap profil terverifikasi.
 */
export function getStoredUserRole(): UserRole {
  try {
    const raw = localStorage.getItem('PDO_USER_ROLE');
    if (raw === 'petugas') return 'pdo';
    const role = VALID_ROLES.includes(raw as UserRole) ? (raw as UserRole) : 'pdo';

    // Anti-Spoofing Guard: Jika peran yang diklaim adalah administratif (admin/superadmin)
    // dan terdapat email aktif di perangkat, pastikan selaras dengan cache profil terverifikasi.
    if (role === 'admin' || role === 'superadmin') {
      const email = localStorage.getItem('PDO_USER_EMAIL');
      if (email && email.trim()) {
        const normalized = email.trim().toLowerCase();
        const cachedRaw = localStorage.getItem(`PDO_LAST_VERIFIED_PROFILE_${normalized}`);
        if (cachedRaw) {
          try {
            const { profile } = JSON.parse(cachedRaw);
            if (profile && profile.role && profile.role !== role) {
              console.warn(`[RoleStorage] Deteksi manipulasi RBAC: klaim '${role}', profil sah '${profile.role}'. Mengembalikan ke peran sah.`);
              return (VALID_ROLES.includes(profile.role) ? profile.role : 'pdo') as UserRole;
            }
          } catch {
            return 'pdo';
          }
        }
      }
    }

    return role;
  } catch {
    return 'pdo';
  }
}
