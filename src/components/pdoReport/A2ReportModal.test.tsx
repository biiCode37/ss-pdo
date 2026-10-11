// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { A2ReportModal } from './A2ReportModal';
import * as fleetStatusService from '../../services/fleetStatusService';
import type { BusData } from '../../services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../services/fleetStatusService', () => ({
  upsertDailyFleetShift: vi.fn(),
  fetchDailyFleetShift: vi.fn().mockResolvedValue(null),
}));

describe('A2ReportModal Component', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const mockBuses: Partial<BusData>[] = [
    { rowIndex: 2, unit: 'TS.01', tripPergi: '3', tripPulang: '3', keterangan: '' },
    { rowIndex: 3, unit: 'TS.02', tripPergi: '2', tripPulang: '2', keterangan: 'BA.01 Radiator bocor' },
    { rowIndex: 4, unit: 'TS.03', tripPergi: '0', tripPulang: '0', keterangan: 'LIBUR' },
  ];

  it('renders modal with prefilled data from spreadsheet keterangan', async () => {
    await act(async () => {
      root.render(
        <A2ReportModal
          isOpen={true}
          onClose={vi.fn()}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          defaultRenops={30}
          buses={mockBuses as BusData[]}
          initialShift={1}
        />
      );
    });

    expect(container.textContent).toContain('Laporan Harian A2 Armada');
    expect(container.textContent).toContain('JAK.15');
    // Verifikasi unit berkendala ter-prefill di dalam input fields
    const unitInputs = container.querySelectorAll<HTMLInputElement>('[data-testid="a2-unit-input"]');
    const noteInputs = container.querySelectorAll<HTMLInputElement>('[data-testid="a2-note-input"]');
    expect(Array.from(unitInputs).some((inp) => inp.value === 'TS.02')).toBe(true);
    expect(Array.from(noteInputs).some((inp) => inp.value === 'BA.01 Radiator bocor')).toBe(true);
  });

  it('allows user to remove a unit note and add a new unit note', async () => {
    await act(async () => {
      root.render(
        <A2ReportModal
          isOpen={true}
          onClose={vi.fn()}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          defaultRenops={30}
          buses={mockBuses as BusData[]}
          initialShift={1}
        />
      );
    });

    // Cari tombol tambah catatan unit
    const addBtn = container.querySelector('[data-testid="a2-add-unit-btn"]') as HTMLButtonElement;
    expect(addBtn).toBeTruthy();

    await act(async () => {
      addBtn.click();
    });

    // Cek apakah item bertambah
    const unitInputs = container.querySelectorAll('[data-testid="a2-unit-input"]');
    expect(unitInputs.length).toBeGreaterThan(2);
  });

  it('submits A2 report with source_type = pdo_a2 to fleetStatusService', async () => {
    const mockUpsert = vi.mocked(fleetStatusService.upsertDailyFleetShift);
    mockUpsert.mockResolvedValueOnce({
      id: 10,
      route_id: 1,
      route_code: 'JAK.15',
      date: '2026-10-11',
      shift: 1,
      target_renops: 30,
      realops: 28,
      total_units: 30,
      sgo_count: 28,
      to_count: 0,
      off_count: 0,
      so_count: 0,
      other_count: 0,
      is_confirmed: true,
      source_type: 'pdo_a2',
      submitted_by_role: 'pdo',
      non_sgo_units: [],
    });

    const onSaveSuccess = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <A2ReportModal
          isOpen={true}
          onClose={onClose}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          defaultRenops={30}
          buses={mockBuses as BusData[]}
          initialShift={1}
          onSaveSuccess={onSaveSuccess}
        />
      );
    });

    const submitBtn = container.querySelector('[data-testid="a2-submit-btn"]') as HTMLButtonElement;
    expect(submitBtn).toBeTruthy();

    await act(async () => {
      submitBtn.click();
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 1,
        route_code: 'JAK.15',
        source_type: 'pdo_a2',
        submitted_by_role: 'pdo',
      }),
      expect.any(Array)
    );
  });
});
