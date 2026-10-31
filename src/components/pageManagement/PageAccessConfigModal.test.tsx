// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageAccessConfigModal } from './PageAccessConfigModal';
import type { AppPageSetting } from '@/types/pageManagement';

vi.mock('@/utils/modals/pageAccessSafetyDialog', () => ({
  confirmWhitelistOverride: vi.fn().mockResolvedValue(true),
  confirmBlacklistOverride: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/services/routes/users', () => ({
  fetchAllUserProfiles: vi.fn().mockResolvedValue([
    { email: 'budi@transjakarta.co.id', full_name: 'Budi Santoso', role: 'pdo', is_active: true },
    { email: 'ani@transjakarta.co.id', full_name: 'Ani Admin', role: 'admin', is_active: true },
  ]),
}));

const mockSetting: AppPageSetting = {
  page_key: 'regional_monitoring',
  page_name: 'Monitoring 18 Rute Wilayah',
  category: 'page',
  is_enabled: true,
  disabled_message: 'Maintenance',
  allowed_roles: ['superadmin', 'admin', 'korwil', 'korlap'],
  allowed_user_emails: ['special@transjakarta.co.id'],
  denied_user_emails: ['denied@transjakarta.co.id'],
};

describe('PageAccessConfigModal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('tidak merender konten jika isOpen false atau setting null', async () => {
    await act(async () => {
      root.render(
        <PageAccessConfigModal
          isOpen={false}
          setting={null}
          onClose={() => {}}
          onSave={async () => true}
        />
      );
    });

    expect(container.textContent).toBe('');
  });

  it('merender checklist peran dengan superadmin terkunci wajib', async () => {
    await act(async () => {
      root.render(
        <PageAccessConfigModal
          isOpen={true}
          setting={mockSetting}
          onClose={() => {}}
          onSave={async () => true}
        />
      );
    });

    expect(container.textContent).toContain('Monitoring 18 Rute Wilayah');
    expect(container.textContent).toContain('Hak Akses Peran');
    expect(container.textContent).toContain('Akses Wajib');

    const superadminCheckbox = container.querySelector('input[data-role="superadmin"]') as HTMLInputElement;
    expect(superadminCheckbox).not.toBeNull();
    expect(superadminCheckbox.checked).toBe(true);
    expect(superadminCheckbox.disabled).toBe(true);
  });

  it('dapat berpindah tab ke Whitelist dan Blacklist dan menampilkan email yang tersimpan', async () => {
    await act(async () => {
      root.render(
        <PageAccessConfigModal
          isOpen={true}
          setting={mockSetting}
          onClose={() => {}}
          onSave={async () => true}
        />
      );
    });

    // Pindah ke tab Whitelist
    const whitelistTab = container.querySelector('[data-testid="tab-whitelist"]') as HTMLElement;
    expect(whitelistTab).not.toBeNull();

    await act(async () => {
      whitelistTab.click();
    });

    expect(container.textContent).toContain('special@transjakarta.co.id');

    // Pindah ke tab Blacklist
    const blacklistTab = container.querySelector('[data-testid="tab-blacklist"]') as HTMLElement;
    expect(blacklistTab).not.toBeNull();

    await act(async () => {
      blacklistTab.click();
    });

    expect(container.textContent).toContain('denied@transjakarta.co.id');
  });

  it('memanggil onSave dengan data terkonfigurasi saat tombol simpan ditekan', async () => {
    const handleSave = vi.fn().mockResolvedValue(true);

    await act(async () => {
      root.render(
        <PageAccessConfigModal
          isOpen={true}
          setting={mockSetting}
          onClose={() => {}}
          onSave={handleSave}
        />
      );
    });

    const saveBtn = container.querySelector('[data-testid="btn-save-permissions"]') as HTMLElement;
    expect(saveBtn).not.toBeNull();

    await act(async () => {
      saveBtn.click();
    });

    expect(handleSave).toHaveBeenCalledWith(
      'regional_monitoring',
      ['superadmin', 'admin', 'korwil', 'korlap'],
      ['special@transjakarta.co.id'],
      ['denied@transjakarta.co.id']
    );
  });
});
