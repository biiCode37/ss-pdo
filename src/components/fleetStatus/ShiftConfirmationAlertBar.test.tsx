// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShiftConfirmationAlertBar } from './ShiftConfirmationAlertBar';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('ShiftConfirmationAlertBar Component', () => {
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

  it('renders nothing when isOpen is false', async () => {
    await act(async () => {
      root.render(
        <ShiftConfirmationAlertBar
          isOpen={false}
          shift={1}
          routeCode="JAK.15"
          onOpenModal={vi.fn()}
        />
      );
    });

    expect(container.textContent).toBe('');
  });

  it('renders Shift 1 alert message and triggers onOpenModal on click', async () => {
    const onOpenMock = vi.fn();

    await act(async () => {
      root.render(
        <ShiftConfirmationAlertBar
          isOpen={true}
          shift={1}
          routeCode="JAK.15"
          onOpenModal={onOpenMock}
        />
      );
    });

    expect(container.textContent).toContain('Shift 1');
    expect(container.textContent).toContain('belum dikonfirmasi');

    const btn = container.querySelector('button');
    expect(btn).toBeDefined();

    await act(async () => {
      btn?.click();
    });

    expect(onOpenMock).toHaveBeenCalledTimes(1);
  });

  it('renders Shift 2 alert message appropriately', async () => {
    await act(async () => {
      root.render(
        <ShiftConfirmationAlertBar
          isOpen={true}
          shift={2}
          routeCode="JAK.15"
          onOpenModal={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain('Shift 2');
    expect(container.textContent).toContain('Konfirmasi status armada');
  });
});
