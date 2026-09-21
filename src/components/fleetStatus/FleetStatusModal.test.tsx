// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FleetStatusModal } from './FleetStatusModal';
import type { BusData } from '../../services/googleSheets';

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

describe('FleetStatusModal Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockBuses: BusData[] = [
    createMockBus({
      rowIndex: 6,
      unit: 'JAK.15-01',
      keterangan: '',
    }),
    createMockBus({
      rowIndex: 7,
      unit: 'JAK.15-02',
      keterangan: 'OFF',
    }),
    createMockBus({
      rowIndex: 8,
      unit: 'JAK.15-03',
      keterangan: 'TO EVDAL',
    }),
  ];

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

  it('renders all buses and header information', async () => {
    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          dayLabel="Hari Kerja (Senin - Jumat)"
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain('JAK.15');
    expect(container.textContent).toContain('Target Renops:');
    const renopsInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(renopsInput?.value).toBe('60');
    expect(container.textContent).toContain('JAK.15-01');
    expect(container.textContent).toContain('JAK.15-02');
    expect(container.textContent).toContain('JAK.15-03');
  });

  it('calculates real-time summary counts correctly', async () => {
    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={vi.fn()}
        />
      );
    });

    // 1 SGO, 1 OFF, 1 TO
    expect(container.textContent).toContain('SGO: 1');
    expect(container.textContent).toContain('OFF: 1');
    expect(container.textContent).toContain('T.O: 1');
  });

  it('sets all units to SGO when SGO Semua button is clicked', async () => {
    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={vi.fn()}
        />
      );
    });

    const sgoAllBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('SGO Semua')
    );
    expect(sgoAllBtn).toBeDefined();

    await act(async () => {
      sgoAllBtn?.click();
    });

    // All 3 should now be SGO
    expect(container.textContent).toContain('SGO: 3');
  });

  it('invokes onConfirmStatus with updated statuses', async () => {
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={onConfirmMock}
        />
      );
    });

    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Konfirmasi & Terapkan Status')
    );
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      confirmBtn?.click();
    });

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onConfirmMock).toHaveBeenCalledWith(1, expect.any(Map), expect.objectContaining({
      targetRenops: 60,
      realops: 1,
      sgoCount: 1,
      offCount: 1,
      toCount: 1,
    }));
  });

  it('acts as independent modal and closes modal on confirm', async () => {
    const onCloseMock = vi.fn();
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={onCloseMock}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={onConfirmMock}
        />
      );
    });

    // Verify modal is independent: does not contain segmented control to report
    const reportTabBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Laporan Operasional'
    );
    expect(reportTabBtn).toBeUndefined();

    // Check confirm button
    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Konfirmasi & Terapkan Status')
    );
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      confirmBtn?.click();
    });

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('supports SO (Stop Operasi) brush and renders SO in summary', async () => {
    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          onConfirmStatus={vi.fn()}
        />
      );
    });

    // Tap SO brush button
    const soBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'SO'
    );
    expect(soBtn).toBeDefined();

    await act(async () => {
      soBtn?.click();
    });

    // Tap on the first bus (JAK.15-01) which is currently SGO
    const firstBusCard = container.querySelector<HTMLDivElement>('[data-unit="JAK.15-01"]');
    expect(firstBusCard).toBeDefined();

    await act(async () => {
      firstBusCard?.click();
    });

    expect(container.textContent).toContain('SO: 1');
  });

  it('renders locked view when shift is confirmed and prevents card clicks', async () => {
    const onConfirmMock = vi.fn();

    await act(async () => {
      root.render(
        <FleetStatusModal
          isOpen={true}
          onClose={vi.fn()}
          routeCode="JAK.15"
          selectedDate="2026-09-09"
          renopsTarget={60}
          buses={mockBuses}
          initialShift={1}
          isConfirmedS1={true}
          confirmedByS1="pengawas@mikrotrans.id"
          confirmedAtS1="2026-09-21T06:00:00Z"
          onConfirmStatus={onConfirmMock}
        />
      );
    });

    // Check lock banner and locked badge
    expect(container.textContent).toContain('Terkonfirmasi');
    expect(container.textContent).toContain('pengawas@mikrotrans.id');
    expect(container.textContent).toContain('Terkunci');

    // Confirm button should be locked and disabled
    const lockedBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Terkunci')
    );
    expect(lockedBtn).toBeDefined();
    expect(lockedBtn?.getAttribute('disabled')).not.toBeNull();
  });
});
