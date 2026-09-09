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

  it('renders default profile when localStorage is empty and triggers onOpenProfile on click', async () => {
    const handleOpenProfile = vi.fn();

    await act(async () => {
      root.render(<UserProfileHeader onOpenProfile={handleOpenProfile} />);
    });

    // Default name
    expect(container.textContent).toContain('Petugas');

    const button = container.querySelector('[data-testid="user-profile-header-btn"]') as HTMLElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
    });

    expect(handleOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('renders custom user name, email, avatar without role badge', async () => {
    localStorage.setItem('PDO_USER_NAME', 'Budi Operasional');
    localStorage.setItem('PDO_USER_EMAIL', 'budi@pusm.id');
    localStorage.setItem('PDO_USER_AVATAR', 'https://example.com/avatar.jpg');

    const handleOpenProfile = vi.fn();

    await act(async () => {
      root.render(<UserProfileHeader onOpenProfile={handleOpenProfile} />);
    });

    expect(container.textContent).toContain('Budi Operasional');
    expect(container.textContent).toContain('budi@pusm.id');
    // Ensure role badge is NOT rendered
    expect(container.querySelector('.role-badge')).toBeNull();

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
