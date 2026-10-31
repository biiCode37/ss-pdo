import { pdoSwal, escapeHtml } from '../alertUtils';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface UserTarget {
  email: string;
  full_name?: string;
  role?: string;
}

/**
 * Menampilkan dialog konfirmasi keselamatan sebelum menambahkan akun ke daftar Whitelist
 * jika peran akun tersebut secara default tidak memiliki akses ke halaman.
 */
export async function confirmWhitelistOverride(
  user: UserTarget,
  pageName: string
): Promise<boolean> {
  const safeName = escapeHtml(user.full_name || user.email);
  const safeRole = escapeHtml((user.role || 'petugas').toUpperCase());
  const safePage = escapeHtml(pageName);

  const result = await pdoSwal.fire({
    title: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.WHITELIST_WARNING_TITLE,
    html: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.WHITELIST_WARNING_MSG(safeName, safeRole, safePage),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.WHITELIST_CONFIRM_BTN,
    cancelButtonText: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.CANCEL_BTN,
    confirmButtonColor: 'var(--color-warning-border, #f59e0b)',
    cancelButtonColor: 'var(--color-surface-subtle, #475569)',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed === true;
}

/**
 * Menampilkan dialog konfirmasi keselamatan sebelum menambahkan akun ke daftar Blacklist
 * jika peran akun tersebut secara default berhak mengakses halaman.
 */
export async function confirmBlacklistOverride(
  user: UserTarget,
  pageName: string
): Promise<boolean> {
  const safeName = escapeHtml(user.full_name || user.email);
  const safeRole = escapeHtml((user.role || 'admin').toUpperCase());
  const safePage = escapeHtml(pageName);

  const result = await pdoSwal.fire({
    title: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.BLACKLIST_WARNING_TITLE,
    html: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.BLACKLIST_WARNING_MSG(safeName, safeRole, safePage),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.BLACKLIST_CONFIRM_BTN,
    cancelButtonText: TEXT_PAGE_MANAGEMENT.SAFETY_DIALOGS.CANCEL_BTN,
    confirmButtonColor: 'var(--color-error-border, #ef4444)',
    cancelButtonColor: 'var(--color-surface-subtle, #475569)',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed === true;
}

/**
 * Menampilkan dialog konfirmasi sebelum mereset pengaturan beberapa halaman terpilih ke aturan standar.
 */
export async function confirmResetPageSettings(count: number): Promise<boolean> {
  const result = await pdoSwal.fire({
    title: TEXT_PAGE_MANAGEMENT.BULK_ACTION.RESET_CONFIRM_TITLE,
    html: TEXT_PAGE_MANAGEMENT.BULK_ACTION.RESET_CONFIRM_MSG(count),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: TEXT_PAGE_MANAGEMENT.BULK_ACTION.RESET_CONFIRM_BTN,
    cancelButtonText: TEXT_PAGE_MANAGEMENT.BULK_ACTION.RESET_CANCEL_BTN,
    confirmButtonColor: 'var(--color-error-border, #ef4444)',
    cancelButtonColor: 'var(--color-surface-subtle, #475569)',
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed === true;
}
