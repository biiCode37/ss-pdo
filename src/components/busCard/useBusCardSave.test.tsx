// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBusCardSave } from './useBusCardSave';
import type { BusData } from '@/services/googleSheets';
import * as googleSheets from '@/services/googleSheets';
import * as alertUtils from '@/utils/alertUtils';
import { TEXT_ALERTS } from '@/constants/texts';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/googleSheets', () => ({
  getBusRowData: vi.fn(),
  updateBusData: vi.fn(),
}));

vi.mock('@/utils/alertUtils', () => ({
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
  showQueueConflictDialog: vi.fn(),
  escapeHtml: (s: string) => s,
}));

const mockBus: BusData = {
  rowIndex: 5,
  unit: 'KWK 222171',
  tripPergi: '',
  tripPulang: '',
  toaShift1: '0',
  toaShift2: '0',
  manualShift1: '',
  manualShift2: '',
  totalToa: '0',
  kmAwal1: '',
  kmAkhir1: '',
  kmAwal2: '',
  kmAkhir2: '',
  keterangan: '',
  originalRow: [],
};

const headerMap = {
  unit: 0,
  kmAwal1: 1,
  kmAkhir1: 2,
  keterangan: 3,
};

let latestSave: ReturnType<typeof useBusCardSave> | null = null;

function SaveTestComponent(props: Parameters<typeof useBusCardSave>[0]) {
  const save = useBusCardSave(props);
  latestSave = save;
  return <div id="save-test-node">{save.saveStatus}</div>;
}

describe('useBusCardSave - Optimistic Concurrency Control (OCC) & Three-Way Collision Rule', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    (googleSheets.updateBusData as any).mockResolvedValue(undefined);
    latestSave = null;
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

  const renderSaveHook = async (
    busOverride?: Partial<BusData>,
    extraProps?: Partial<Parameters<typeof useBusCardSave>[0]>
  ) => {
    await act(async () => {
      root.render(
        <SaveTestComponent
          bus={{ ...mockBus, ...busOverride }}
          sheetId="sheet-1"
          tabName="05"
          headerMap={headerMap}
          addToQueue={vi.fn()}
          {...extraProps}
        />
      );
    });
  };

  it('Scenario 1: Safe Local Save - User inputs KM Awal S1 when remote is clean (no conflict)', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '',
      kmAkhir1: '',
      toaShift2: '0',
      totalToa: '0',
      keterangan: '',
    });

    await renderSaveHook();

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).not.toHaveBeenCalled();
    expect(googleSheets.updateBusData).toHaveBeenCalledTimes(1);
    expect(googleSheets.updateBusData).toHaveBeenCalledWith(
      'sheet-1',
      '05',
      5,
      { kmAwal1: '300100' },
      headerMap,
      mockBus
    );
  });

  it('Scenario 2: Selective Dirty Checking - Remote note changed by supervisor, user only inputs KM Awal S1 (no conflict)', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '',
      keterangan: 'BA.01',
      toaShift2: '0',
      totalToa: '0',
    });

    await renderSaveHook();

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).not.toHaveBeenCalled();
    expect(googleSheets.updateBusData).toHaveBeenCalledTimes(1);
  });

  it('Scenario 3: Real Conflict - Remote kmAwal1 has different value (300200 vs 300100) -> triggers dialog with isOnline: true', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '300200',
      toaShift2: '0',
    });

    await renderSaveHook();

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).toHaveBeenCalledTimes(1);
    expect(alertUtils.showQueueConflictDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        unitName: 'KWK 222171',
        isOnline: true,
      })
    );
    expect(googleSheets.updateBusData).not.toHaveBeenCalled();
  });

  it('Scenario 3b: Conflict Resolution - onUseServer does NOT write to server, updates local state with remoteData, and shows toast', async () => {
    const mockOnUpdateBus = vi.fn();
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '300200',
      toaShift2: '0',
    });

    await renderSaveHook(undefined, { onUpdateBus: mockOnUpdateBus });

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).toHaveBeenCalledTimes(1);
    const dialogOptions = (alertUtils.showQueueConflictDialog as any).mock.calls[0][0];

    // Assert diffs are provided to dialog
    expect(dialogOptions.diffs).toEqual([
      expect.objectContaining({
        field: 'kmAwal1',
        label: 'KM Awal Shift 1',
        serverValue: '300200',
        userValue: '300100',
      }),
    ]);

    // Simulate user choosing "Gunakan Data Server"
    await act(async () => {
      dialogOptions.onUseServer();
    });

    // Zero-write: updateBusData must NOT be called
    expect(googleSheets.updateBusData).not.toHaveBeenCalled();
    // Local state updated with remoteData
    expect(mockOnUpdateBus).toHaveBeenCalledWith(
      expect.objectContaining({ kmAwal1: '300200' })
    );
    expect(latestSave?.formData.kmAwal1).toBe('300200');
    expect(latestSave?.saveStatus).toBe('idle');
    expect(latestSave?.isLoading).toBe(false);
    expect(alertUtils.showInfoToast).toHaveBeenCalledWith(
      TEXT_ALERTS.CONFLICT.TOAST_SERVER_DATA_APPLIED
    );
  });

  it('Scenario 3c: Conflict Resolution - onForceSave bypasses OCC and writes user updates to server', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '300200',
      toaShift2: '0',
    });

    await renderSaveHook();

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).toHaveBeenCalledTimes(1);
    const dialogOptions = (alertUtils.showQueueConflictDialog as any).mock.calls[0][0];

    // Simulate user choosing "Tetap Simpan (Force)"
    await act(async () => {
      await dialogOptions.onForceSave();
    });

    // Force write called with user's update
    expect(googleSheets.updateBusData).toHaveBeenCalledTimes(1);
    expect(googleSheets.updateBusData).toHaveBeenCalledWith(
      'sheet-1',
      '05',
      5,
      { kmAwal1: '300100' },
      headerMap,
      mockBus
    );
  });

  it('Scenario 4: Idempotent Match - Remote kmAwal1 already contains the exact same value user is saving -> no conflict', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      kmAwal1: '300100',
      toaShift2: '0',
    });

    await renderSaveHook();

    await act(async () => {
      await latestSave?.handleSaveUpdates({ kmAwal1: '300100' });
    });

    expect(alertUtils.showQueueConflictDialog).not.toHaveBeenCalled();
    expect(googleSheets.updateBusData).toHaveBeenCalledTimes(1);
  });

  it('sends ONLY modified dirty fields (delta updates) to updateBusData, omitting untouched fields', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      toaShift1: '100',
      manualShift1: '5',
      totalToa: '200',
    });

    await renderSaveHook({
      toaShift1: '100',
      manualShift1: '5',
      totalToa: '200',
    });

    // User hanya mengubah toaShift1 dari 100 menjadi 120 pada payload mode All
    const updatesAllMode = {
      toaShift1: '120',
      manualShift1: '5', // tidak berubah
      totalToa: '200', // tidak berubah
    };

    await act(async () => {
      await latestSave?.handleSaveUpdates(updatesAllMode);
    });

    // updateBusData hanya boleh dipanggil dengan { toaShift1: "120" }
    expect(googleSheets.updateBusData).toHaveBeenCalledTimes(1);
    expect(googleSheets.updateBusData).toHaveBeenCalledWith(
      'sheet-1',
      '05',
      5,
      { toaShift1: '120' },
      headerMap,
      expect.objectContaining({
        toaShift1: '100',
        manualShift1: '5',
        totalToa: '200',
      })
    );
  });

  it('omits formula fields like toaShift2 from deltaUpdates even if included in updates', async () => {
    (googleSheets.getBusRowData as any).mockResolvedValueOnce({
      toaShift1: '100',
      toaShift2: '50',
    });

    await renderSaveHook({ toaShift1: '100', toaShift2: '50' });

    const updatesWithFormula = {
      toaShift1: '120',
      toaShift2: '70', // rumus spreadsheet, tidak boleh dikirim
    };

    await act(async () => {
      await latestSave?.handleSaveUpdates(updatesWithFormula);
    });

    expect(googleSheets.updateBusData).toHaveBeenCalledWith(
      'sheet-1',
      '05',
      5,
      { toaShift1: '120' },
      headerMap,
      expect.anything()
    );
  });

  it('exits early without network request if no fields actually changed', async () => {
    await renderSaveHook({ toaShift1: '100' });

    const identicalUpdates = {
      toaShift1: '100', // sama persis dengan initial
    };

    await act(async () => {
      await latestSave?.handleSaveUpdates(identicalUpdates);
    });

    expect(googleSheets.getBusRowData).not.toHaveBeenCalled();
    expect(googleSheets.updateBusData).not.toHaveBeenCalled();
    expect(latestSave?.saveStatus).toBe('success');
    expect(latestSave?.isLoading).toBe(false);
  });

  it('saves only dirty delta updates to offline queue when network error occurs', async () => {
    const mockAddToQueue = vi.fn();
    (googleSheets.getBusRowData as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await renderSaveHook(
      { toaShift1: '100', manualShift1: '5' },
      { addToQueue: mockAddToQueue }
    );

    await act(async () => {
      await latestSave?.handleSaveUpdates({
        toaShift1: '120',
        manualShift1: '5', // untouched
      });
    });

    expect(mockAddToQueue).toHaveBeenCalledTimes(1);
    expect(mockAddToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        updates: { toaShift1: '120' },
        originalSnapshot: { toaShift1: '100' },
      })
    );
  });
});
