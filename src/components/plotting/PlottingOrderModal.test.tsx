// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlottingOrderModal } from './PlottingOrderModal';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import type { UnitPlottingItem } from '@/types/supabase';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const setNativeSelectValue = (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('PlottingOrderModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const sampleUnits: UnitPlottingItem[] = [
    { unit: 'KWK 222151', order: 1, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'KWK 222152', order: 2, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'KWK 222153', order: 3, start_point: 'A', target_ritase: 7.5, status: 'READY' },
    { unit: 'KWK 222154', order: 4, start_point: 'A', target_ritase: 7.5, status: 'READY' },
  ];

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
        <PlottingOrderModal
          isOpen={false}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('tidak merender apapun saat unitsToMove kosong', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={[]}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('merender judul single unit dengan nomor urutan yang benar', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    const expectedTitle = TEXT_PLOTTING.ORDER_MODAL.TITLE_SINGLE('KWK 222153', 3);
    expect(container.textContent).toContain(expectedTitle);
    expect(container.textContent).toContain('KWK 222153');
  });

  it('merender judul multi unit saat lebih dari 1 unit dipilih', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222151', 'KWK 222152']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    const expectedTitle = TEXT_PLOTTING.ORDER_MODAL.TITLE_MULTI(2);
    expect(container.textContent).toContain(expectedTitle);
    expect(container.textContent).toContain('KWK 222151');
    expect(container.textContent).toContain('KWK 222152');
  });

  it('memanggil onApplyMove dengan TOP saat tombol paling depan diklik', () => {
    const handleApply = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={handleApply}
        />
      );
    });

    const btnTop = container.querySelector('[data-testid="btn-order-top"]') as HTMLButtonElement;
    expect(btnTop).not.toBeNull();
    expect(btnTop.textContent).toContain(TEXT_PLOTTING.ORDER_MODAL.QUICK_TOP);

    act(() => {
      btnTop.click();
    });

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith(['KWK 222153'], 'TOP', undefined);
  });

  it('memanggil onApplyMove dengan BOTTOM saat tombol paling belakang diklik', () => {
    const handleApply = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222151', 'KWK 222152']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={handleApply}
        />
      );
    });

    const btnBottom = container.querySelector('[data-testid="btn-order-bottom"]') as HTMLButtonElement;
    expect(btnBottom).not.toBeNull();
    expect(btnBottom.textContent).toContain(TEXT_PLOTTING.ORDER_MODAL.QUICK_BOTTOM);

    act(() => {
      btnBottom.click();
    });

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith(['KWK 222151', 'KWK 222152'], 'BOTTOM', undefined);
  });

  it('mengecualikan unit yang sedang dipindahkan dari dropdown unit acuan', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222152', 'KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    const select = container.querySelector('[data-testid="select-ref-unit"]') as HTMLSelectElement;
    expect(select).not.toBeNull();

    const options = Array.from(select.options).map((opt) => opt.value);
    expect(options).toContain('');
    expect(options).toContain('KWK 222151');
    expect(options).toContain('KWK 222154');
    expect(options).not.toContain('KWK 222152');
    expect(options).not.toContain('KWK 222153');
  });

  it('tombol submit dinonaktifkan jika belum memilih unit acuan', () => {
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={vi.fn()}
        />
      );
    });

    const submitBtn = container.querySelector('[data-testid="btn-order-submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.disabled).toBe(true);
  });

  it('memanggil onApplyMove dengan BELOW dan selectedRefUnit secara default saat disubmit', () => {
    const handleApply = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={handleApply}
        />
      );
    });

    const select = container.querySelector('[data-testid="select-ref-unit"]') as HTMLSelectElement;
    act(() => {
      setNativeSelectValue(select, 'KWK 222151');
    });

    const submitBtn = container.querySelector('[data-testid="btn-order-submit"]') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);

    act(() => {
      submitBtn.click();
    });

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith(['KWK 222153'], 'BELOW', 'KWK 222151');
  });

  it('dapat memilih ABOVE dan memanggil onApplyMove dengan ABOVE saat disubmit', () => {
    const handleApply = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={vi.fn()}
          onApplyMove={handleApply}
        />
      );
    });

    const btnAbove = container.querySelector('[data-testid="btn-dir-above"]') as HTMLButtonElement;
    expect(btnAbove).not.toBeNull();

    act(() => {
      btnAbove.click();
    });

    const select = container.querySelector('[data-testid="select-ref-unit"]') as HTMLSelectElement;
    act(() => {
      setNativeSelectValue(select, 'KWK 222154');
    });

    const submitBtn = container.querySelector('[data-testid="btn-order-submit"]') as HTMLButtonElement;
    act(() => {
      submitBtn.click();
    });

    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(handleApply).toHaveBeenCalledWith(['KWK 222153'], 'ABOVE', 'KWK 222154');
  });

  it('memanggil onClose saat tombol Batal dan tombol Close X diklik', () => {
    const handleClose = vi.fn();
    act(() => {
      root.render(
        <PlottingOrderModal
          isOpen={true}
          unitsToMove={['KWK 222153']}
          allBaseUnits={sampleUnits}
          onClose={handleClose}
          onApplyMove={vi.fn()}
        />
      );
    });

    const btnCancel = container.querySelector('[data-testid="btn-order-cancel"]') as HTMLButtonElement;
    expect(btnCancel).not.toBeNull();
    expect(btnCancel.textContent).toContain(TEXT_COMMON.BUTTONS.CANCEL);

    act(() => {
      btnCancel.click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    const btnCloseX = container.querySelector('[data-testid="btn-close-modal"]') as HTMLButtonElement;
    expect(btnCloseX).not.toBeNull();

    act(() => {
      btnCloseX.click();
    });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
