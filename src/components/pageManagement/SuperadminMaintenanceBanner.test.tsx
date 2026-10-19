// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuperadminMaintenanceBanner } from './SuperadminMaintenanceBanner';

describe('SuperadminMaintenanceBanner', () => {
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

  it('menampilkan teks pratinjau superadmin', async () => {
    await act(async () => {
      root.render(<SuperadminMaintenanceBanner />);
    });

    expect(container.textContent).toContain('Mode Pratinjau Superadmin');
  });

  it('menampilkan tombol kelola akses jika onManageAccess diberikan dan merespons klik', async () => {
    const handleManage = vi.fn();

    await act(async () => {
      root.render(<SuperadminMaintenanceBanner onManageAccess={handleManage} />);
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Kelola Akses');

    act(() => {
      button?.click();
    });

    expect(handleManage).toHaveBeenCalledTimes(1);
  });
});
