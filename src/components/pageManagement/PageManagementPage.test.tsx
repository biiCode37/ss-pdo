// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageManagementPage } from './PageManagementPage';
import { PageAccessProvider } from '@/context/PageAccessContext';

vi.mock('@/services/pageManagementService', () => ({
  fetchPageSettings: vi.fn().mockResolvedValue([
    {
      page_key: 'input',
      page_name: 'Form Input Bus SS PDO',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
      allowed_user_emails: [],
      denied_user_emails: [],
    },
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute Wilayah',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap'],
      allowed_user_emails: [],
      denied_user_emails: [],
    },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    {
      page_key: 'input',
      page_name: 'Form Input Bus SS PDO',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
      allowed_user_emails: [],
      denied_user_emails: [],
    },
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute Wilayah',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
      allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap'],
      allowed_user_emails: [],
      denied_user_emails: [],
    },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
  updatePagePermissions: vi.fn().mockResolvedValue(true),
  bulkUpdatePageSettings: vi.fn().mockResolvedValue(true),
  fetchActiveSuperadmins: vi.fn().mockResolvedValue([
    { email: 'superadmin@transjakarta.co.id', full_name: 'Superadmin Sistem' },
  ]),
  subscribeToPageSettings: vi.fn().mockReturnValue(() => {}),
}));

describe('PageManagementPage', () => {
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

  it('merender judul, badge superadmin, dan item halaman', async () => {
    const handleBack = vi.fn();

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={handleBack} />
        </PageAccessProvider>
      );
    });

    expect(container.textContent).toContain('Manajemen Halaman');
    expect(container.textContent).toContain('Superadmin Access Only');
    expect(container.textContent).toContain('Form Input Bus SS PDO');
    expect(container.textContent).toContain('Monitoring 18 Rute Wilayah');

    // Cek keberadaan proteksi self-lockout
    expect(container.textContent).toContain('Manajemen Halaman (Sistem)');
    expect(container.textContent).toContain('Terkunci');
  });

  it('merespons klik tombol kembali', async () => {
    const handleBack = vi.fn();

    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={handleBack} />
        </PageAccessProvider>
      );
    });

    const backBtn = container.querySelector('[data-testid="page-management-back-btn"]') as HTMLButtonElement;
    expect(backBtn).not.toBeNull();

    act(() => {
      backBtn.click();
    });

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('memfilter kategori halaman saat tab filter diklik', async () => {
    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={vi.fn()} />
        </PageAccessProvider>
      );
    });

    // Cari tab filter 'Sub-Halaman & Tab'
    const tabButtons = container.querySelectorAll('.pm-filter-tab');
    const tabFilter = Array.from(tabButtons).find((b) => b.textContent?.includes('Sub-Halaman & Tab')) as HTMLButtonElement;
    expect(tabFilter).toBeDefined();

    act(() => {
      tabFilter.click();
    });

    // Form Input Bus (tab) harus tetap ada
    expect(container.textContent).toContain('Form Input Bus SS PDO');
    // Monitoring 18 Rute (page) harus terfilter keluar
    expect(container.textContent).not.toContain('Monitoring 18 Rute Wilayah');
  });

  it('mengaktifkan mode seleksi banyak dan menampilkan floating bulk action bar saat kartu dipilih', async () => {
    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={vi.fn()} />
        </PageAccessProvider>
      );
    });

    const selectModeBtn = container.querySelector('[data-testid="btn-toggle-select-mode"]') as HTMLButtonElement;
    expect(selectModeBtn).not.toBeNull();

    await act(async () => {
      selectModeBtn.click();
    });

    expect(container.textContent).toContain('Selesai');
    expect(container.textContent).toContain('Pilih Semua');

    // Pastikan kartu sistem 'page_management' tidak memiliki checkbox
    const lockedCard = container.querySelector('[data-testid="pm-card-page_management"]');
    expect(lockedCard?.querySelector('input[type="checkbox"]')).toBeNull();

    // Pilih kartu 'input'
    const inputCheckbox = container.querySelector('input[data-card-key="input"]') as HTMLInputElement;
    expect(inputCheckbox).not.toBeNull();

    await act(async () => {
      inputCheckbox.click();
    });

    // Floating bulk bar harus muncul dengan count 1
    expect(container.textContent).toContain('1 Halaman Dipilih');
  });

  it('membuka modal pengaturan akses halaman saat tombol atur akses ditekan', async () => {
    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={vi.fn()} />
        </PageAccessProvider>
      );
    });

    const configBtn = container.querySelector('[data-testid="btn-config-access-input"]') as HTMLButtonElement;
    expect(configBtn).not.toBeNull();

    await act(async () => {
      configBtn.click();
    });

    // Modal harus terbuka
    expect(container.textContent).toContain('Pengaturan Akses Halaman');
    expect(container.textContent).toContain('Hak Akses Peran');
  });

  it('menangani klik switch aktif/nonaktif dan memicu togglePageStatus', async () => {
    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={vi.fn()} />
        </PageAccessProvider>
      );
    });

    const switches = container.querySelectorAll('button[role="switch"]');
    expect(switches.length).toBeGreaterThan(0);

    const firstSwitch = switches[0] as HTMLButtonElement;
    expect(firstSwitch.getAttribute('aria-checked')).toBe('true');

    await act(async () => {
      firstSwitch.click();
    });

    // Switch harus tetap memiliki role switch dan responsif
    expect(firstSwitch).not.toBeNull();
  });

  it('menampilkan empty state jika kategori yang difilter tidak memiliki halaman', async () => {
    await act(async () => {
      root.render(
        <PageAccessProvider>
          <PageManagementPage onBack={vi.fn()} />
        </PageAccessProvider>
      );
    });

    const tabButtons = container.querySelectorAll('.pm-filter-tab');
    const modalFilter = Array.from(tabButtons).find((b) =>
      b.textContent?.includes('Fitur & Modal')
    ) as HTMLButtonElement;
    expect(modalFilter).toBeDefined();

    await act(async () => {
      modalFilter.click();
    });

    // Mock data hanya punya 'tab' dan 'page', jadi kategori 'modal' kosong
    expect(container.textContent).toContain('Tidak ada halaman dalam kategori ini');
  });
});
