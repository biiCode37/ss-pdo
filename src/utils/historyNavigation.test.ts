// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initHistoryNavigation,
  pushBackNavigation,
  removeBackNavigation,
  isRunningStandalone,
} from './historyNavigation';
import Swal from 'sweetalert2';

describe('historyNavigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    initHistoryNavigation();
  });

  it('detects standalone mode properly', () => {
    const result = isRunningStandalone();
    expect(typeof result).toBe('boolean');
  });

  it('pushes and executes back navigation entries', () => {
    const onBack = vi.fn();
    pushBackNavigation({ id: 'test_modal', onBack });

    // Popstate event simulation
    const popEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popEvent);

    expect(onBack).toHaveBeenCalled();
  });

  it('closes SweetAlert2 if visible when back is pressed', () => {
    vi.spyOn(Swal, 'isVisible').mockReturnValue(true);
    const closeSpy = vi.spyOn(Swal, 'close').mockImplementation(() => {});

    const popEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popEvent);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('removes entry cleanly when unmounted', () => {
    const onBack = vi.fn();
    pushBackNavigation({ id: 'to_remove', onBack });
    removeBackNavigation('to_remove');

    const popEvent = new PopStateEvent('popstate');
    window.dispatchEvent(popEvent);

    expect(onBack).not.toHaveBeenCalled();
  });
});
