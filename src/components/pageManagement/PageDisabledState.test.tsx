// @vitest-environment happy-dom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageDisabledState } from './PageDisabledState';

describe('PageDisabledState', () => {
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

  it('menampilkan teks pemeliharaan resmi dan judul', async () => {
    await act(async () => {
      root.render(<PageDisabledState />);
    });

    expect(container.textContent).toContain('Sedang Dalam Pemeliharaan');
    expect(container.textContent).toContain(
      'Halaman/Fitur ini masih dalam tahap pengembangan/perbaikan'
    );
  });

  it('menampilkan tombol kembali jika prop onBack diberikan dan merespons klik', async () => {
    const handleBack = vi.fn();

    await act(async () => {
      root.render(<PageDisabledState onBack={handleBack} />);
    });

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Kembali ke Dashboard');

    act(() => {
      button?.click();
    });

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('dapat menampilkan pesan kustom jika disediakan', async () => {
    await act(async () => {
      root.render(<PageDisabledState message="Perbaikan rute sementara" />);
    });

    expect(container.textContent).toContain('Perbaikan rute sementara');
  });
});
