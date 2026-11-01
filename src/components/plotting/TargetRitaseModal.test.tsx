// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TargetRitaseModal } from './TargetRitaseModal';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('TargetRitaseModal Component', () => {
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

  it('tidak merender apapun saat isOpen = false', () => {
    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={false}
          initialValue={7.5}
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('merender dengan nilai awal dan merespon stepper +/-', () => {
    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={true}
          initialValue={7.5}
          targetUnit="TJ-01"
          endpointName="Priok"
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );
    });

    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe('7.5');

    // Klik tombol tambah (+)
    const buttons = Array.from(container.querySelectorAll('button'));
    const plusBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('Tambah'));
    expect(plusBtn).toBeDefined();

    act(() => {
      plusBtn?.click();
    });

    expect(input.value).toBe('8');

    // Klik tombol kurang (-)
    const minusBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('Kurang'));
    expect(minusBtn).toBeDefined();

    act(() => {
      minusBtn?.click();
    });

    expect(input.value).toBe('7.5');
  });

  it('mendukung pengaturan target ritase ke 0 / kosong', () => {
    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={true}
          initialValue={0}
          targetUnit="TJ-01"
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );
    });

    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.value).toBe('0');

    const buttons = Array.from(container.querySelectorAll('button'));
    const chip0 = buttons.find((b) => b.textContent?.trim() === '0 Rit');
    expect(chip0).toBeDefined();

    const minusBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('Kurang'));
    expect(minusBtn?.disabled).toBe(true);
  });

  it('menerapkan preset chip cepat', () => {
    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={true}
          initialValue={7.5}
          targetUnit="TJ-01"
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );
    });

    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    const buttons = Array.from(container.querySelectorAll('button'));
    const chip5 = buttons.find((b) => b.textContent?.trim() === '5 Rit');
    expect(chip5).toBeDefined();

    act(() => {
      chip5?.click();
    });

    expect(input.value).toBe('5');
  });

  it('memanggil onApply dengan scope unit saat tombol Terapkan Unit Ini ditekan', () => {
    const onApply = vi.fn();

    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={true}
          initialValue={8.5}
          targetUnit="TJ-01"
          onClose={vi.fn()}
          onApply={onApply}
        />,
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const applyUnitBtn = buttons.find((b) => b.textContent?.includes('Terapkan Unit Ini'));
    expect(applyUnitBtn).toBeDefined();

    act(() => {
      applyUnitBtn?.click();
    });

    expect(onApply).toHaveBeenCalledWith(8.5, 'unit');
  });

  it('memanggil onApply dengan scope all saat tombol Terapkan ke Semua Unit ditekan', () => {
    const onApply = vi.fn();

    act(() => {
      root.render(
        <TargetRitaseModal
          isOpen={true}
          initialValue={6.0}
          onClose={vi.fn()}
          onApply={onApply}
        />,
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const applyAllBtn = buttons.find((b) => b.textContent?.includes('Terapkan ke Semua Unit'));
    expect(applyAllBtn).toBeDefined();

    act(() => {
      applyAllBtn?.click();
    });

    expect(onApply).toHaveBeenCalledWith(6.0, 'all');
  });
});
