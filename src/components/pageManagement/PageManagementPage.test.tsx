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
    },
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute Wilayah',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
    },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    {
      page_key: 'input',
      page_name: 'Form Input Bus SS PDO',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
    },
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute Wilayah',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
    },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
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

    expect(container.textContent).toContain('Manajemen Halaman & Fitur');
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
});
