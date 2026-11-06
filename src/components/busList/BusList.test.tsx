// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BusList } from './BusList';
import * as alertUtils from '@/utils/alertUtils';
import type { BusData } from '@/services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createMockBus = (partial: Partial<BusData> & { rowIndex: number; unit: string }): BusData => ({
  tripPergi: '',
  tripPulang: '',
  toaShift1: '',
  toaShift2: '',
  manualShift1: '',
  manualShift2: '',
  totalToa: '',
  kmAwal1: '',
  kmAkhir1: '',
  kmAwal2: '',
  kmAkhir2: '',
  keterangan: '',
  originalRow: [],
  ...partial,
});

vi.mock('@/utils/alertUtils', async () => {
  const actual = await vi.importActual<typeof import('@/utils/alertUtils')>('@/utils/alertUtils');
  return {
    ...actual,
    showWarningToast: vi.fn(),
    showSuccessToast: vi.fn(),
    showBulkTripModal: vi.fn(),
    showConfirmDialog: vi.fn(),
    showBulkCopyKmModal: vi.fn(),
  };
});

vi.mock('@/services/googleSheets', async () => {
  const actual = await vi.importActual<typeof import('@/services/googleSheets')>('@/services/googleSheets');
  return {
    ...actual,
    updateBulkBusData: vi.fn().mockResolvedValue(undefined),
  };
});

describe('BusList Component - Shift Lock and Operational Restrictions', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    data: [
      createMockBus({ rowIndex: 6, unit: 'JAK.15-01', keterangan: '' }),
      createMockBus({ rowIndex: 7, unit: 'JAK.15-02', keterangan: 'OFF' }),
    ],
    sheetId: 'sheet-123',
    tabName: 'Tgl 9',
    headerMap: { unit: 0, keterangan: 20 },
    syncQueue: [],
    addToQueue: vi.fn(),
    isLoading: false,
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

  it('does not render duplicate shift lock banner inside BusList (handled centrally in DashboardStatusBanners)', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('.shift-lock-banner')).toBeNull();
  });

  it('does not render shift lock banner when isShiftConfirmed is true', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('.shift-lock-banner')).toBeNull();
  });

  it('allows bulk trip modal even when isShiftConfirmed is false', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
        />
      );
    });

    const setTripBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Set Target Trip') || b.textContent?.includes('Trip')
    );
    expect(setTripBtn).toBeDefined();

    await act(async () => {
      setTripBtn?.click();
    });

    expect(alertUtils.showBulkTripModal).toHaveBeenCalled();
  });

  it('calculates progress bar total count based only on units allowed for input (excluding OFF/non-SGO)', async () => {
    // data has 2 buses: JAK.15-01 (SGO) and JAK.15-02 (OFF)
    // Only JAK.15-01 is allowed, so total count should be 1
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/2 Unit');
  });

  it('renders progress bar consistently even when isShiftConfirmed is false for input visibility', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={false}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('[data-testid="daily-progress-container"]')).not.toBeNull();
    expect(container.textContent).toContain('Progres Harian');
  });

  it('shows progress bar when isShiftConfirmed is true', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    expect(container.querySelector('[data-testid="daily-progress-container"]')).toBeTruthy();
    expect(container.textContent).toContain('Progres Harian');
  });

  it('excludes units with TO EVDAL and shift-prefixed OFF from progress bar target', async () => {
    const mixedBuses = [
      createMockBus({ rowIndex: 2, unit: 'JAK.15-01', keterangan: '' }),
      createMockBus({ rowIndex: 3, unit: 'JAK.15-02', keterangan: 'TO EVDAL' }),
      createMockBus({ rowIndex: 4, unit: 'JAK.15-03', keterangan: 'S1: OFF' }),
      createMockBus({ rowIndex: 5, unit: 'JAK.15-04', keterangan: 'S2: TO EVDAL' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={mixedBuses}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // Dari 4 unit, hanya JAK.15-01 yang dihitung (3 lainnya berstatus OFF / TO EVDAL)
    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/4 Unit');
  });

  it('Set Jumlah Trip mengosongkan trip unit LIBUR (diperlakukan seperti OFF)', async () => {
    const { updateBulkBusData } = await import('@/services/googleSheets');
    vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '7', tripPulang: '7' });
    const fleet = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'LIBUR' }),
    ];

    await act(async () => {
      root.render(<BusList {...defaultProps} data={fleet} />);
    });
    const btn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Set Jumlah Trip'),
    );
    await act(async () => {
      btn!.click();
    });

    expect(updateBulkBusData).toHaveBeenCalledWith(
      'sheet-123',
      'Tgl 9',
      [
        { rowIndex: 6, updates: { tripPergi: '7', tripPulang: '7' } },
        { rowIndex: 7, updates: { tripPergi: '', tripPulang: '' } },
      ],
      defaultProps.headerMap,
    );
  });

  it('unit LIBUR tidak dihitung pada target bar progres', async () => {
    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={[
            createMockBus({ rowIndex: 6, unit: 'BUS-01' }),
            createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'Libur' }),
          ]}
          isShiftConfirmed={true}
        />,
      );
    });
    expect(container.textContent).toContain('/1 Unit');
    expect(container.textContent).not.toContain('/2 Unit');
  });

  describe('Kosongkan trip lewat modal massal (kedua kolom dikosongkan)', () => {
    const filledFleet = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01', tripPergi: '8', tripPulang: '8' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', tripPergi: '8', tripPulang: '7' }),
    ];

    const openSetTrip = async () => {
      const btn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Set Jumlah Trip'),
      );
      expect(btn).toBeDefined();
      await act(async () => {
        btn!.click();
      });
    };

    it('Set Jumlah Trip kosong + konfirmasi: semua sel trip dikirim "" (bukan 0) dalam 1 request', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '', tripPulang: '' });
      vi.mocked(alertUtils.showConfirmDialog).mockResolvedValue(true);
      const onUpdateBus = vi.fn();

      await act(async () => {
        root.render(<BusList {...defaultProps} data={filledFleet} onUpdateBus={onUpdateBus} />);
      });
      await openSetTrip();

      expect(alertUtils.showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).toHaveBeenCalledWith(
        'sheet-123',
        'Tgl 9',
        [
          { rowIndex: 6, updates: { tripPergi: '', tripPulang: '' } },
          { rowIndex: 7, updates: { tripPergi: '', tripPulang: '' } },
        ],
        defaultProps.headerMap,
      );
      expect(onUpdateBus).toHaveBeenCalledWith(6, { tripPergi: '', tripPulang: '' });
      expect(alertUtils.showSuccessToast).toHaveBeenCalledWith(
        'Trip 2 unit berhasil dikosongkan di Spreadsheet',
      );
    });

    it('batal di dialog konfirmasi: tidak ada yang dikirim ke Spreadsheet', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '', tripPulang: '' });
      vi.mocked(alertUtils.showConfirmDialog).mockResolvedValue(false);

      await act(async () => {
        root.render(<BusList {...defaultProps} data={filledFleet} />);
      });
      await openSetTrip();

      expect(alertUtils.showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).not.toHaveBeenCalled();
    });

    it('isi trip biasa tidak memunculkan dialog konfirmasi kosongkan', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '7', tripPulang: '7' });

      await act(async () => {
        root.render(<BusList {...defaultProps} data={filledFleet} />);
      });
      await openSetTrip();

      expect(alertUtils.showConfirmDialog).not.toHaveBeenCalled();
      expect(updateBulkBusData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Set Trip Unit Terpilih (mode Pilih)', () => {
    const fleetData = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'OFF' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03' }),
    ];

    const clickEl = async (el: Element | null) => {
      expect(el).not.toBeNull();
      await act(async () => {
        (el as HTMLElement).click();
      });
    };

    it('hanya unit terpilih yang disimpan dalam 1 request, unit OFF dilewati, target rute tidak berubah', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '8', tripPulang: '7' });
      const onUpdateBus = vi.fn();

      await act(async () => {
        root.render(<BusList {...defaultProps} data={fleetData} onUpdateBus={onUpdateBus} />);
      });

      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      expect(document.body.querySelector('[data-testid="selection-action-bar"]')).not.toBeNull();

      await clickEl(container.querySelector('[data-bus-row="6"]'));
      await clickEl(container.querySelector('[data-bus-row="7"]'));

      // Ketukan kartu di mode pilih tidak membuka modal input
      expect(document.body.querySelector('.bus-input-modal-overlay')).toBeNull();
      expect(container.querySelector('[data-testid="select-unit-6"]')?.getAttribute('aria-checked')).toBe('true');
      expect(container.querySelector('[data-testid="select-unit-8"]')?.getAttribute('aria-checked')).toBe('false');
      expect(document.body.textContent).toContain('2 unit dipilih');

      await clickEl(document.body.querySelector('[data-testid="btn-apply-selected-trip"]'));

      expect(alertUtils.showBulkTripModal).toHaveBeenCalledWith(
        expect.objectContaining({ unitCount: 1, isSelection: true, skippedCount: 1 }),
      );
      expect(updateBulkBusData).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).toHaveBeenCalledWith(
        'sheet-123',
        'Tgl 9',
        [{ rowIndex: 6, updates: { tripPergi: '8', tripPulang: '7' } }],
        defaultProps.headerMap,
      );
      expect(onUpdateBus).toHaveBeenCalledTimes(1);
      expect(onUpdateBus).toHaveBeenCalledWith(6, { tripPergi: '8', tripPulang: '7' });
      expect(alertUtils.showSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('(7.5 Rit)'),
      );

      // Mode pilih tertutup setelah tersimpan & target rute (tombol Set Jumlah Trip) tidak ikut berubah
      expect(document.body.querySelector('[data-testid="selection-action-bar"]')).toBeNull();
      expect(container.textContent).not.toContain('(8/7)');
    });

    it('tidak menyimpan apa pun jika semua unit terpilih berstatus OFF', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      await act(async () => {
        root.render(<BusList {...defaultProps} data={fleetData} />);
      });

      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      await clickEl(container.querySelector('[data-bus-row="7"]'));
      await clickEl(document.body.querySelector('[data-testid="btn-apply-selected-trip"]'));

      expect(alertUtils.showBulkTripModal).not.toHaveBeenCalled();
      expect(updateBulkBusData).not.toHaveBeenCalled();
      expect(alertUtils.showWarningToast).toHaveBeenCalledTimes(1);
    });

    it('tombol Batal menutup mode pilih dan mengosongkan pilihan', async () => {
      await act(async () => {
        root.render(<BusList {...defaultProps} data={fleetData} />);
      });

      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      await clickEl(container.querySelector('[data-bus-row="6"]'));
      await clickEl(document.body.querySelector('[data-testid="btn-cancel-selection"]'));

      expect(document.body.querySelector('[data-testid="selection-action-bar"]')).toBeNull();
      expect(container.querySelector('[data-testid="select-unit-6"]')).toBeNull();

      // Masuk lagi: pilihan lama tidak terbawa
      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      expect(container.querySelector('[data-testid="select-unit-6"]')?.getAttribute('aria-checked')).toBe('false');
    });

    it('Set Trip Terpilih kosong + konfirmasi: hanya unit terpilih yang dikosongkan', async () => {
      const { updateBulkBusData } = await import('@/services/googleSheets');
      vi.mocked(alertUtils.showBulkTripModal).mockResolvedValue({ tripPergi: '', tripPulang: '' });
      vi.mocked(alertUtils.showConfirmDialog).mockResolvedValue(true);

      await act(async () => {
        root.render(<BusList {...defaultProps} data={fleetData} />);
      });

      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      await clickEl(container.querySelector('[data-bus-row="8"]'));
      await clickEl(document.body.querySelector('[data-testid="btn-apply-selected-trip"]'));

      expect(alertUtils.showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).toHaveBeenCalledTimes(1);
      expect(updateBulkBusData).toHaveBeenCalledWith(
        'sheet-123',
        'Tgl 9',
        [{ rowIndex: 8, updates: { tripPergi: '', tripPulang: '' } }],
        defaultProps.headerMap,
      );
      expect(document.body.querySelector('[data-testid="selection-action-bar"]')).toBeNull();
    });

    it('mode pilih dikunci di tab AKUMULASI', async () => {
      await act(async () => {
        root.render(<BusList {...defaultProps} tabName="AKUMULASI" data={fleetData} />);
      });

      await clickEl(container.querySelector('[data-testid="btn-toggle-select-mode"]'));
      expect(document.body.querySelector('[data-testid="selection-action-bar"]')).toBeNull();
      expect(alertUtils.showWarningToast).toHaveBeenCalledTimes(1);
    });
  });

  it('renders units in spreadsheet row order without Plotting base view selector', async () => {
    const fleetData = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01', tripPergi: '7', tripPulang: '7' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', tripPergi: '7', tripPulang: '7' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', tripPergi: '7', tripPulang: '7' }),
    ];

    await act(async () => {
      root.render(
        <BusList {...defaultProps} data={fleetData} isShiftConfirmed={true} activeShift={1} />
      );
    });

    expect(container.querySelector('[data-testid="fleet-sort-view-selector"]')).toBeNull();
    const renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '7', '8']);
  });

  it('parks non-operational buses (ritase 0/kosong) to the bottom of the list', async () => {
    const fleetData = [
      createMockBus({ rowIndex: 6, unit: 'BUS-01', tripPergi: '7', tripPulang: '7' }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: 'OFF' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', tripPergi: '8', tripPulang: '7' }),
    ];

    await act(async () => {
      root.render(
        <BusList {...defaultProps} data={fleetData} isShiftConfirmed={true} activeShift={1} />
      );
    });

    const renderedUnits = Array.from(container.querySelectorAll('.bus-card')).map(
      (el) => el.getAttribute('data-bus-row')
    );
    expect(renderedUnits).toEqual(['6', '8', '7']);
  });

  it('auto-skips non-operational buses when Satset mode advances to the next unit', async () => {
    localStorage.setItem('pdo_satset_mode', 'true');


    const fleetData = [
      createMockBus({
        rowIndex: 6,
        unit: 'BUS-01',
        toaShift1: '100',
        totalToa: '200',
        kmAwal1: '10',
        kmAkhir1: '20',
        tripPergi: '3',
        tripPulang: '3',
      }),
      createMockBus({ rowIndex: 7, unit: 'BUS-02', keterangan: '', tripPergi: '', tripPulang: '' }),
      createMockBus({ rowIndex: 8, unit: 'BUS-03', keterangan: '', tripPergi: '3', tripPulang: '3' }),
    ];

    await act(async () => {
      root.render(
        <BusList
          {...defaultProps}
          data={fleetData}
          isShiftConfirmed={true}
          activeShift={1}
        />
      );
    });

    // BUS-02 ritase kosong (non-operasional, dilewati); BUS-03 sudah ada ritase tapi kolom lain belum lengkap
    const tripCatBtn = container.querySelector('[data-testid="category-chip-trip"]') as HTMLButtonElement;
    if (tripCatBtn) {
      await act(async () => {
        tripCatBtn.click();
      });
    }

    const cardBus1 = container.querySelector('[data-bus-row="6"]') as HTMLElement;
    const cardBus2 = container.querySelector('[data-bus-row="7"]') as HTMLElement;
    const cardBus3 = container.querySelector('[data-bus-row="8"]') as HTMLElement;

    expect(cardBus1).not.toBeNull();
    expect(cardBus2).not.toBeNull();
    expect(cardBus3).not.toBeNull();

    const spyBus2Click = vi.spyOn(cardBus2, 'click');
    const spyBus3Click = vi.spyOn(cardBus3, 'click');

    // Open modal for BUS-01
    await act(async () => {
      cardBus1.click();
    });

    // Submit form inside modal
    const form = document.body.querySelector('form');
    expect(form).not.toBeNull();

    await act(async () => {
      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    // Wait for the 120ms timeout in handleSaveAndNext
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // BUS-02 (non-operational) must be skipped!
    expect(spyBus2Click).not.toHaveBeenCalled();
    // BUS-03 (operational) must be clicked!
    expect(spyBus3Click).toHaveBeenCalled();

    localStorage.removeItem('pdo_satset_mode');
  });
});
