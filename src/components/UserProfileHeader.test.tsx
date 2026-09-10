// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { UserProfileHeader } from './UserProfileHeader';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('UserProfileHeader', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders default profile and role subtitle when localStorage is empty and triggers onOpenProfile on click', async () => {
    const handleOpenProfile = vi.fn();

    await act(async () => {
      root.render(<UserProfileHeader onOpenProfile={handleOpenProfile} />);
    });

    // Default name
    expect(container.textContent).toContain('Petugas');
    // Default role subtitle
    expect(container.textContent).toContain('PDO');
    expect(container.querySelector('.header-role-pdo')).toBeTruthy();

    const button = container.querySelector('[data-testid="user-profile-header-btn"]') as HTMLElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
    });

    expect(handleOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('renders custom user name, role subtitle with correct color class without role badge', async () => {
    localStorage.setItem('PDO_USER_NAME', 'Budi Operasional');
    localStorage.setItem('PDO_USER_ROLE', 'superadmin');
    localStorage.setItem('PDO_USER_AVATAR', 'https://example.com/avatar.jpg');

    const handleOpenProfile = vi.fn();

    await act(async () => {
      root.render(<UserProfileHeader onOpenProfile={handleOpenProfile} />);
    });

    expect(container.textContent).toContain('Budi Operasional');
    expect(container.textContent).toContain('Superadmin');
    expect(container.querySelector('.header-role-superadmin')).toBeTruthy();
    // Ensure role badge component is NOT rendered
    expect(container.querySelector('.role-badge')).toBeNull();
    expect(container.querySelector('.role-badge-pill')).toBeNull();

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toBe('https://example.com/avatar.jpg');

    // Simulate Enter key
    const button = container.querySelector('[data-testid="user-profile-header-btn"]') as HTMLElement;
    await act(async () => {
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(handleOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('renders correct color classes for each role subtitle', async () => {
    const roleMap: Array<[string, string, string]> = [
      ['superadmin', 'Superadmin', 'header-role-superadmin'],
      ['admin', 'Admin', 'header-role-admin'],
      ['korwil', 'Korwil', 'header-role-korwil'],
      ['korlap', 'Korlap', 'header-role-korlap'],
      ['pdo', 'PDO', 'header-role-pdo'],
    ];

    for (const [role, label, cls] of roleMap) {
      localStorage.setItem('PDO_USER_ROLE', role);
      await act(async () => {
        root.render(<UserProfileHeader key={role} onOpenProfile={vi.fn()} />);
      });
      expect(container.textContent).toContain(label);
      expect(container.querySelector(`.${cls}`)).toBeTruthy();
    }
  });

  it('falls back to User icon when avatar image fails to load', async () => {
    localStorage.setItem('PDO_USER_NAME', 'Siti Rahma');
    localStorage.setItem('PDO_USER_AVATAR', 'https://invalid-domain.com/broken.jpg');

    await act(async () => {
      root.render(<UserProfileHeader onOpenProfile={vi.fn()} />);
    });

    const img = container.querySelector('img');
    expect(img).toBeTruthy();

    // Trigger onError
    await act(async () => {
      img?.dispatchEvent(new Event('error'));
    });

    // Image should be unmounted and fallback icon shown
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Siti Rahma');
  });
});
