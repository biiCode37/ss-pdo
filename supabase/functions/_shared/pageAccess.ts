// Satu sumber aturan akses halaman: dipakai PageAccessContext (klien) dan Edge Function (server).

export interface PageAccessSettingLike {
  is_enabled: boolean;
  allowed_roles?: string[] | null;
  allowed_user_emails?: string[] | null;
  denied_user_emails?: string[] | null;
}

const LEGACY_PDO_BLOCKED_PAGES = new Set(['regional_monitoring', 'regional_summary', 'regional_wa_report']);

export function evaluatePageAccess(
  pageKey: string,
  setting: PageAccessSettingLike | null | undefined,
  userRole?: string | null,
  userEmail?: string | null,
): boolean {
  const role = userRole ? userRole.toLowerCase().trim() : null;

  // 1. Superadmin memiliki kuasa penuh (master bypass)
  if (role === 'superadmin') return true;

  if (!setting) return true;

  // 2. Master switch: halaman nonaktif (mode perbaikan)
  if (!setting.is_enabled) return false;

  const email = (userEmail || '').toLowerCase().trim();

  // 3. Blacklist personil (prioritas tertinggi)
  const denied = Array.isArray(setting.denied_user_emails) ? setting.denied_user_emails : [];
  if (email && denied.some((e) => e.toLowerCase().trim() === email)) return false;

  // 4. Whitelist personil
  const allowed = Array.isArray(setting.allowed_user_emails) ? setting.allowed_user_emails : [];
  if (email && allowed.some((e) => e.toLowerCase().trim() === email)) return true;

  // 5. Role baseline (petugas dinormalisasi menjadi pdo)
  if (Array.isArray(setting.allowed_roles) && setting.allowed_roles.length > 0) {
    if (!role) return false;
    const normalizedRole = role === 'petugas' ? 'pdo' : role;
    return setting.allowed_roles.some((r) => r.toLowerCase().trim() === normalizedRole);
  }

  // Fallback legacy guard bila konfigurasi peran belum terisi
  if (LEGACY_PDO_BLOCKED_PAGES.has(pageKey) && (role === 'pdo' || role === 'petugas')) return false;
  return true;
}
