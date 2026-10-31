// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageAccessProvider, usePageAccess, type PageAccessContextType } from './PageAccessContext';

vi.mock('@/services/pageManagementService', () => ({
  fetchPageSettings: vi.fn().mockResolvedValue([
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap'],
      allowed_user_emails: ['budi@transjakarta.co.id'],
      denied_user_emails: [],
    },
    {
      page_key: 'input',
      page_name: 'Input SS',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
      allowed_user_emails: [],
      denied_user_emails: ['baduser@transjakarta.co.id'],
    },
    {
      page_key: 'analytics',
      page_name: 'Analitik',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin'],
      allowed_user_emails: ['pdo_special@transjakarta.co.id'],
      denied_user_emails: [],
    },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap'],
      allowed_user_emails: ['budi@transjakarta.co.id'],
      denied_user_emails: [],
    },
    {
      page_key: 'input',
      page_name: 'Input SS',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
      allowed_user_emails: [],
      denied_user_emails: ['baduser@transjakarta.co.id'],
    },
    {
      page_key: 'analytics',
      page_name: 'Analitik',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin'],
      allowed_user_emails: ['pdo_special@transjakarta.co.id'],
      denied_user_emails: [],
    },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
  updatePagePermissions: vi.fn().mockResolvedValue(true),
  bulkUpdatePageSettings: vi.fn().mockResolvedValue(true),
  fetchActiveSuperadmins: vi.fn().mockResolvedValue([
    { email: 'super1@transjakarta.co.id', full_name: 'Bpk. Superadmin' },
  ]),
  subscribeToPageSettings: vi.fn().mockReturnValue(() => {}),
}));

describe('PageAccessContext', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('mengizinkan akses untuk superadmin meskipun halaman disabled (bypass)', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    // Superadmin bypass
    expect(contextValue.canAccessPage('regional_monitoring', 'superadmin')).toBe(true);
    // Non-superadmin blocked
    expect(contextValue.canAccessPage('regional_monitoring', 'admin')).toBe(false);
    expect(contextValue.canAccessPage('regional_monitoring', 'korwil')).toBe(false);
    expect(contextValue.canAccessPage('regional_monitoring', 'pdo')).toBe(false);
    // Non-superadmin allowed on enabled page
    expect(contextValue.canAccessPage('input', 'pdo')).toBe(true);

    // Identifikasi maintenance
    expect(contextValue.isUnderMaintenance('regional_monitoring')).toBe(true);
    expect(contextValue.isUnderMaintenance('input')).toBe(false);
  });

  it('togglePageStatus memperbarui state optimistik', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    await act(async () => {
      const success = await contextValue.togglePageStatus('input', false);
      expect(success).toBe(true);
    });

    expect(contextValue.isUnderMaintenance('input')).toBe(true);
  });
  it('melarang akses regional_monitoring untuk pdo meskipun halaman aktif', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    // Enabled tab 'input' can be accessed by pdo
    expect(contextValue.canAccessPage('input', 'pdo')).toBe(true);

    // regional_monitoring is strictly blocked for pdo and petugas
    expect(contextValue.canAccessPage('regional_monitoring', 'pdo')).toBe(false);
    expect(contextValue.canAccessPage('regional_monitoring', 'petugas')).toBe(false);
  });

  it('mengevaluasi hak akses hierarkis: whitelist, blacklist, dan role baseline', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    // 1. Blacklist Test: baduser@transjakarta.co.id diblokir dari 'input' meski rolenya 'pdo' (yang secara role diizinkan)
    expect(contextValue.canAccessPage('input', 'pdo', 'baduser@transjakarta.co.id')).toBe(false);

    // User lain dengan role 'pdo' tetap diizinkan di 'input'
    expect(contextValue.canAccessPage('input', 'pdo', 'gooduser@transjakarta.co.id')).toBe(true);

    // 2. Whitelist Test: pdo_special@transjakarta.co.id diizinkan di 'analytics' meski role 'pdo' tidak diizinkan di role baseline
    expect(contextValue.canAccessPage('analytics', 'pdo', 'pdo_special@transjakarta.co.id')).toBe(true);

    // pdo biasa ditolak di 'analytics'
    expect(contextValue.canAccessPage('analytics', 'pdo', 'regular_pdo@transjakarta.co.id')).toBe(false);

    // 3. Fallback ke localStorage jika userEmail tidak dioper
    localStorage.setItem('PDO_USER_EMAIL', 'baduser@transjakarta.co.id');
    expect(contextValue.canAccessPage('input', 'pdo')).toBe(false);

    localStorage.setItem('PDO_USER_EMAIL', 'pdo_special@transjakarta.co.id');
    expect(contextValue.canAccessPage('analytics', 'pdo')).toBe(true);
  });

  it('updatePermissions dan bulkUpdate memperbarui state dan memanggil servis', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    await act(async () => {
      const ok = await contextValue.updatePermissions(
        'input',
        ['superadmin', 'admin'],
        ['custom@transjakarta.co.id'],
        []
      );
      expect(ok).toBe(true);
    });

    const setting = contextValue.pageSettings['input'];
    expect(setting.allowed_roles).toContain('admin');
    expect(setting.allowed_user_emails).toContain('custom@transjakarta.co.id');

    await act(async () => {
      const okBulk = await contextValue.bulkUpdate(
        ['input', 'analytics'],
        'set_status',
        { is_enabled: true }
      );
      expect(okBulk).toBe(true);
    });
  });

  it('memuat daftar activeSuperadmins', async () => {
    let contextValue!: PageAccessContextType;

    function TestConsumer() {
      contextValue = usePageAccess();
      return <div>Loaded</div>;
    }

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <TestConsumer />
        </PageAccessProvider>
      );
    });

    expect(contextValue.activeSuperadmins).toHaveLength(1);
    expect(contextValue.activeSuperadmins[0].full_name).toBe('Bpk. Superadmin');
  });
});
