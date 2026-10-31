// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccessRestrictedState } from './AccessRestrictedState';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

vi.mock('@/context/PageAccessContext', () => ({
  usePageAccess: () => ({
    activeSuperadmins: [
      { email: 'abi@transjakarta.co.id', full_name: 'Bpk. Abi' },
      { email: 'super2@transjakarta.co.id', full_name: 'Ibu Ratna' },
    ],
  }),
}));

describe('AccessRestrictedState', () => {
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

  it('merender judul dan deskripsi akses dibatasi', async () => {
    await act(async () => {
      root.render(<AccessRestrictedState />);
    });

    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.TITLE);
    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.SUBTITLE);
  });

  it('menampilkan daftar nama personil superadmin aktif', async () => {
    await act(async () => {
      root.render(<AccessRestrictedState />);
    });

    expect(container.textContent).toContain('Bpk. Abi');
    expect(container.textContent).toContain('Ibu Ratna');
  });

  it('memanggil onBack ketika tombol kembali ditekan', async () => {
    const handleBack = vi.fn();

    await act(async () => {
      root.render(<AccessRestrictedState onBack={handleBack} />);
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain(TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.BTN_BACK_TO_DASHBOARD);

    act(() => {
      button?.click();
    });

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});
