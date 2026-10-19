// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageAccessProvider, usePageAccess, PageAccessContextType } from './PageAccessContext';

vi.mock('@/services/pageManagementService', () => ({
  fetchPageSettings: vi.fn().mockResolvedValue([
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
    },
    {
      page_key: 'input',
      page_name: 'Input SS',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
    },
  ]),
  getCachedSettings: vi.fn().mockReturnValue([
    {
      page_key: 'regional_monitoring',
      page_name: 'Monitoring 18 Rute',
      category: 'page',
      is_enabled: false,
      disabled_message: 'Maintenance',
    },
    {
      page_key: 'input',
      page_name: 'Input SS',
      category: 'tab',
      is_enabled: true,
      disabled_message: 'Maintenance',
    },
  ]),
  updatePageSetting: vi.fn().mockResolvedValue(true),
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
});
