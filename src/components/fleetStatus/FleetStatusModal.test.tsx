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
    expect(container.textContent).toContain('Target Renops: 60 Unit');
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
    expect(onConfirmMock).toHaveBeenCalledWith(1, expect.any(Map));
  });

  it('renders segmented control and navigates to report when onNavigateToReport is provided', async () => {
    const onNavigateToReportMock = vi.fn();
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
          onNavigateToReport={onNavigateToReportMock}
          onConfirmStatus={onConfirmMock}
        />
      );
    });

    // Check segmented control buttons
    const reportTabBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Laporan Operasional')
    );
    expect(reportTabBtn).toBeDefined();

    await act(async () => {
      reportTabBtn?.click();
    });
    expect(onNavigateToReportMock).toHaveBeenCalledTimes(1);

    // Check confirm button label and navigation after confirm
    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Konfirmasi & Lanjut ke Laporan')
    );
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      confirmBtn?.click();
    });

    expect(onConfirmMock).toHaveBeenCalled();
    expect(onNavigateToReportMock).toHaveBeenCalledTimes(2);
  });
});
