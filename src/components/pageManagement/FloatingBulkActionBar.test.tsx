// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FloatingBulkActionBar } from './FloatingBulkActionBar';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

describe('FloatingBulkActionBar', () => {
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

  it('tidak merender apapun jika selectedCount 0', async () => {
    await act(async () => {
      root.render(
        <FloatingBulkActionBar
          selectedCount={0}
          onEnableAll={() => {}}
          onDisableAll={() => {}}
          onSetRoles={() => {}}
          onResetDefault={() => {}}
          onDeselectAll={() => {}}
        />
      );
    });

    expect(container.textContent).toBe('');
  });

  it('merender bar aksi dengan teks jumlah halaman terpilih', async () => {
    await act(async () => {
      root.render(
        <FloatingBulkActionBar
          selectedCount={3}
          onEnableAll={() => {}}
          onDisableAll={() => {}}
          onSetRoles={() => {}}
          onResetDefault={() => {}}
          onDeselectAll={() => {}}
        />
      );
    });

    expect(container.textContent).toContain('3 Halaman Dipilih');
    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_ENABLE_ALL);
    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_DISABLE_ALL);
    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_SET_ROLES);
    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_RESET_DEFAULT);
  });

  it('memanggil handler yang sesuai saat tombol aksi diklik', async () => {
    const handleEnable = vi.fn();
    const handleDisable = vi.fn();
    const handleRoles = vi.fn();
    const handleReset = vi.fn();
    const handleDeselect = vi.fn();

    await act(async () => {
      root.render(
        <FloatingBulkActionBar
          selectedCount={2}
          onEnableAll={handleEnable}
          onDisableAll={handleDisable}
          onSetRoles={handleRoles}
          onResetDefault={handleReset}
          onDeselectAll={handleDeselect}
        />
      );
    });

    const enableBtn = container.querySelector('[data-testid="bulk-action-enable"]') as HTMLElement;
    const disableBtn = container.querySelector('[data-testid="bulk-action-disable"]') as HTMLElement;
    const rolesBtn = container.querySelector('[data-testid="bulk-action-roles"]') as HTMLElement;
    const resetBtn = container.querySelector('[data-testid="bulk-action-reset"]') as HTMLElement;
    const deselectBtn = container.querySelector('[data-testid="bulk-action-deselect"]') as HTMLElement;

    act(() => {
      enableBtn.click();
      disableBtn.click();
      rolesBtn.click();
      resetBtn.click();
      deselectBtn.click();
    });

    expect(handleEnable).toHaveBeenCalledTimes(1);
    expect(handleDisable).toHaveBeenCalledTimes(1);
    expect(handleRoles).toHaveBeenCalledTimes(1);
    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(handleDeselect).toHaveBeenCalledTimes(1);
  });
});
