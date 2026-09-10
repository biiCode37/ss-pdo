// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RoleBadge } from './RoleBadge';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('RoleBadge Component', () => {
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

  it('renders Superadmin badge correctly', () => {
    act(() => {
      root.render(<RoleBadge role="superadmin" />);
    });
    expect(container.textContent).toContain('Superadmin');
    expect(container.innerHTML).toContain('from-amber-500');
  });

  it('renders Admin badge correctly', () => {
    act(() => {
      root.render(<RoleBadge role="admin" />);
    });
    expect(container.textContent).toContain('Admin');
    expect(container.innerHTML).toContain('text-sky-700');
  });

  it('renders Petugas badge correctly as default fallback', () => {
    act(() => {
      root.render(<RoleBadge role="petugas" />);
    });
    expect(container.textContent).toContain('Petugas');
    expect(container.innerHTML).toContain('text-emerald-700');
  });

  it('renders Korwil badge correctly', () => {
    act(() => {
      root.render(<RoleBadge role="korwil" />);
    });
    expect(container.textContent).toContain('Korwil');
    expect(container.innerHTML).toContain('text-indigo-700');
  });

  it('renders Korlap badge correctly', () => {
    act(() => {
      root.render(<RoleBadge role="korlap" />);
    });
    expect(container.textContent).toContain('Korlap');
    expect(container.innerHTML).toContain('text-orange-700');
  });

  it('renders PDO badge correctly as default', () => {
    act(() => {
      root.render(<RoleBadge role="pdo" />);
    });
    expect(container.textContent).toContain('PDO');
    expect(container.innerHTML).toContain('text-emerald-700');
  });
});
