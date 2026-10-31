// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserPickerModal } from './UserPickerModal';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import type { UserProfile } from '@/types/supabase';

const mockUsers: UserProfile[] = [
  {
    id: 1,
    email: 'budi@transjakarta.co.id',
    full_name: 'Budi Santoso',
    role_id: 5,
    role: 'pdo',
    is_active: true,
  },
  {
    id: 2,
    email: 'ani@transjakarta.co.id',
    full_name: 'Ani Admin',
    role_id: 2,
    role: 'admin',
    is_active: true,
  },
  {
    id: 3,
    email: 'caca@transjakarta.co.id',
    full_name: 'Caca Korwil',
    role_id: 3,
    role: 'korwil',
    is_active: true,
  },
];

vi.mock('@/services/routes/users', () => ({
  fetchAllUserProfiles: vi.fn().mockImplementation(async () => mockUsers),
}));

describe('UserPickerModal', () => {
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

  it('tidak merender konten jika isOpen false', async () => {
    await act(async () => {
      root.render(
        <UserPickerModal
          isOpen={false}
          onClose={() => {}}
          onSelectUser={() => {}}
        />
      );
    });

    expect(container.textContent).toBe('');
  });

  it('merender daftar pengguna saat terbuka dan menyaring sesuai input pencarian', async () => {
    await act(async () => {
      root.render(
        <UserPickerModal
          isOpen={true}
          onClose={() => {}}
          onSelectUser={() => {}}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_PAGE_MANAGEMENT.USER_PICKER.TITLE);
    expect(container.textContent).toContain('Budi Santoso');
    expect(container.textContent).toContain('Ani Admin');

    const searchInput = container.querySelector('input') as HTMLInputElement;
    expect(searchInput).not.toBeNull();

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(searchInput, 'Ani');
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).toContain('Ani Admin');
    expect(container.textContent).not.toContain('Budi Santoso');
  });

  it('mengecualikan email yang ada di excludedEmails', async () => {
    await act(async () => {
      root.render(
        <UserPickerModal
          isOpen={true}
          excludedEmails={['budi@transjakarta.co.id']}
          onClose={() => {}}
          onSelectUser={() => {}}
        />
      );
    });

    expect(container.textContent).not.toContain('Budi Santoso');
    expect(container.textContent).toContain('Ani Admin');
  });

  it('memanggil onSelectUser saat pengguna diklik', async () => {
    const handleSelect = vi.fn();

    await act(async () => {
      root.render(
        <UserPickerModal
          isOpen={true}
          onClose={() => {}}
          onSelectUser={handleSelect}
        />
      );
    });

    const userCard = container.querySelector('[data-testid="user-pick-item-ani@transjakarta.co.id"]') as HTMLElement;
    expect(userCard).not.toBeNull();

    act(() => {
      userCard.click();
    });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ani@transjakarta.co.id' })
    );
  });
});
