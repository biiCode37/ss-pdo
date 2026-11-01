// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlottingTroubleModal } from './PlottingTroubleModal';
import { TEXT_PLOTTING } from '@/constants/texts';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const setNativeInputValue = (input: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('PlottingTroubleModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    isOpen: true,
    unit: 'KWK 222153',
    currentStatus: 'READY' as const,
    currentKeterangan: '',
    currentNote: '',
    onClose: vi.fn(),
    onApplyTrouble: vi.fn(),
    onResetReady: vi.fn(),
  };

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
      root.render(<PlottingTroubleModal {...defaultProps} isOpen={false} />);
    });
    expect(container.innerHTML).toBe('');
  });

  it('renders modal with title, excludes AP and SGO, and renders BA.02, NP, OFF, T.O EVDAL', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    expect(container.textContent).toContain(TEXT_PLOTTING.TROUBLE_MODAL.TITLE('KWK 222153'));
    // AP and SGO MUST NOT BE PRESENT
    expect(container.querySelector('[data-testid="trouble-code-AP"]')).toBeNull();
    expect(container.querySelector('[data-testid="trouble-code-SGO"]')).toBeNull();

    // Required codes must be present
    expect(container.querySelector('[data-testid="trouble-code-BA.02"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="trouble-code-NP"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="trouble-code-OFF"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="trouble-code-T.O EVDAL"]')).not.toBeNull();
  });

  it('does NOT preselect any trouble code by default when opened fresh', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const buttons = container.querySelectorAll('[data-testid^="trouble-code-"]');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  it('allows multi-selection of trouble codes and unselecting on re-click', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const btnBA02 = container.querySelector('[data-testid="trouble-code-BA.02"]') as HTMLButtonElement;
    const btnNP = container.querySelector('[data-testid="trouble-code-NP"]') as HTMLButtonElement;

    // Click BA.02 -> selected
    act(() => {
      btnBA02.click();
    });
    expect(btnBA02.getAttribute('aria-pressed')).toBe('true');
    expect(btnNP.getAttribute('aria-pressed')).toBe('false');

    // Click NP -> both selected
    act(() => {
      btnNP.click();
    });
    expect(btnBA02.getAttribute('aria-pressed')).toBe('true');
    expect(btnNP.getAttribute('aria-pressed')).toBe('true');

    // Click BA.02 again -> BA.02 unselected, NP still selected
    act(() => {
      btnBA02.click();
    });
    expect(btnBA02.getAttribute('aria-pressed')).toBe('false');
    expect(btnNP.getAttribute('aria-pressed')).toBe('true');
  });

  it('saves multiple selected codes', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const btnBA02 = container.querySelector('[data-testid="trouble-code-BA.02"]') as HTMLButtonElement;
    const btnNP = container.querySelector('[data-testid="trouble-code-NP"]') as HTMLButtonElement;

    act(() => {
      btnBA02.click();
      btnNP.click();
    });

    const applyBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().includes(TEXT_PLOTTING.TROUBLE_MODAL.APPLY_BTN),
    );

    act(() => {
      applyBtn?.click();
    });

    expect(defaultProps.onApplyTrouble).toHaveBeenCalledWith('KWK 222153', 'BA.02, NP', undefined);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows saving with only note without selecting any preset code', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    act(() => {
      setNativeInputValue(input, 'Mogok di halte busway');
    });

    const applyBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().includes(TEXT_PLOTTING.TROUBLE_MODAL.APPLY_BTN),
    );

    act(() => {
      applyBtn?.click();
    });

    expect(defaultProps.onApplyTrouble).toHaveBeenCalledWith(
      'KWK 222153',
      'Mogok di halte busway',
      'Mogok di halte busway',
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('combines preset codes and note correctly', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const btnBA02 = container.querySelector('[data-testid="trouble-code-BA.02"]') as HTMLButtonElement;
    act(() => {
      btnBA02.click();
    });

    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    act(() => {
      setNativeInputValue(input, 'Radiator bocor');
    });

    const applyBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().includes(TEXT_PLOTTING.TROUBLE_MODAL.APPLY_BTN),
    );

    act(() => {
      applyBtn?.click();
    });

    expect(defaultProps.onApplyTrouble).toHaveBeenCalledWith(
      'KWK 222153',
      'BA.02 - Radiator bocor',
      'Radiator bocor',
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows warning alert when OFF is selected', () => {
    act(() => {
      root.render(<PlottingTroubleModal {...defaultProps} />);
    });

    const btnOFF = container.querySelector('[data-testid="trouble-code-OFF"]') as HTMLButtonElement;
    expect(btnOFF).not.toBeNull();

    act(() => {
      btnOFF.click();
    });

    expect(container.textContent).toContain(TEXT_PLOTTING.TROUBLE_MODAL.WARNING_OFF);
  });

  it('calls onResetReady when reset-to-ready button is clicked', () => {
    act(() => {
      root.render(
        <PlottingTroubleModal
          {...defaultProps}
          currentStatus="TROUBLE"
          currentKeterangan="BA.02"
        />,
      );
    });

    const resetBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim().includes(TEXT_PLOTTING.TROUBLE_MODAL.RESET_READY_BTN),
    );
    expect(resetBtn).toBeDefined();

    act(() => {
      resetBtn?.click();
    });

    expect(defaultProps.onResetReady).toHaveBeenCalledWith('KWK 222153');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
