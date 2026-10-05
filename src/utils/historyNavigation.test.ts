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

  it('Kontrak 1: Dua modal bertumpuk dengan real history.back() - Back 2 sebelum unmount memulihkan state ke modal bawah tanpa memanggil callback bawah', async () => {
    const onBusBack = vi.fn();
    const onTopBack = vi.fn();

    // Reset dan inisialisasi ulang riwayat
    const { _resetHistoryNavigationForTest } = await import('./historyNavigation');
    _resetHistoryNavigationForTest();
    initHistoryNavigation();

    // 1. Registrasi Bus Modal lalu Top Modal
    pushBackNavigation({ id: 'bus-modal', onBack: onBusBack });
    expect(window.history.state?.pdoNavId).toBe('bus-modal');

    pushBackNavigation({ id: 'top-modal', onBack: onTopBack });
    expect(window.history.state?.pdoNavId).toBe('top-modal');

    // 2. Back nyata pertama: modal atas menutup, modal bus tetap terbuka
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));

    expect(onTopBack).toHaveBeenCalledTimes(1);
    expect(onBusBack).not.toHaveBeenCalled();

    // 3. Back nyata kedua sebelum modal atas unmount: callback bus TIDAK dipanggil
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));

    expect(onBusBack).not.toHaveBeenCalled();
    expect(onTopBack).toHaveBeenCalledTimes(1);

    // 4. Modal atas selesai animasi dan unmount
    removeBackNavigation('top-modal');

    // Setelah atas unmount, state riwayat HARUS sesuai modal bus (bukan rootGuard)
    expect(window.history.state?.pdoNavId).toBe('bus-modal');

    // 5. Back nyata berikutnya menutup modal bus
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));

    expect(onBusBack).toHaveBeenCalledTimes(1);
    expect(window.history.state?.pdoRootGuard).toBe(true);

    _resetHistoryNavigationForTest();
  });

  it('Kontrak 2: Modal tunggal dengan real history.back() ganda <220ms - tepat 1 callback, state kembali ke rootGuard setelah unmount', async () => {
    const onBusBack = vi.fn();

    const { _resetHistoryNavigationForTest } = await import('./historyNavigation');
    _resetHistoryNavigationForTest();
    initHistoryNavigation();

    pushBackNavigation({ id: 'bus-modal-single', onBack: onBusBack });
    expect(window.history.state?.pdoNavId).toBe('bus-modal-single');

    // Back nyata pertama
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));
    expect(onBusBack).toHaveBeenCalledTimes(1);

    // Back nyata kedua sebelum modal unmount (<220ms)
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));
    expect(onBusBack).toHaveBeenCalledTimes(1);

    // Unmount modal
    removeBackNavigation('bus-modal-single');

    // State riwayat kembali ke root guard
    expect(window.history.state?.pdoRootGuard).toBe(true);

    _resetHistoryNavigationForTest();
  });

  it('Kontrak 3: Jalur tutup UI (markBackNavigationDismissing) diikuti Back nyata selama animasi - history dan unmount konsisten', async () => {
    const onBusBack = vi.fn();
    const { _resetHistoryNavigationForTest, markBackNavigationDismissing } = await import('./historyNavigation');
    _resetHistoryNavigationForTest();
    initHistoryNavigation();

    pushBackNavigation({ id: 'bus-modal-ui', onBack: onBusBack });
    expect(window.history.state?.pdoNavId).toBe('bus-modal-ui');

    // Tutup via UI memicu markBackNavigationDismissing
    markBackNavigationDismissing('bus-modal-ui');

    // User menekan Back nyata selama animasi keluar
    window.history.back();
    await new Promise((r) => setTimeout(r, 30));

    // Callback onBack tidak dipanggil lagi karena ditutup lewat UI
    expect(onBusBack).not.toHaveBeenCalled();

    // Unmount setelah animasi selesai
    removeBackNavigation('bus-modal-ui');

    // State kembali ke root guard
    expect(window.history.state?.pdoRootGuard).toBe(true);

    _resetHistoryNavigationForTest();
  });
});


