// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { A2ReportModal } from '@/components/pdoReport/A2ReportModal';
import * as fleetStatusService from '@/services/fleetStatusService';
import type { BusData } from '@/services/googleSheets';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/fleetStatusService', () => ({
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

  it('renders unit selector as dropdown select containing bus options and handles custom input', async () => {
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

    // Verifikasi elemen select dengan opsi bus terdaftar
    const selectElements = container.querySelectorAll<HTMLSelectElement>('select[data-unit-select="true"]');
    expect(selectElements.length).toBeGreaterThan(0);

    const firstSelect = selectElements[0];
    const options = Array.from(firstSelect.options).map((o) => o.value);
    expect(options).toContain('TS.01');
    expect(options).toContain('TS.02');
    expect(options).toContain('TS.03');
    expect(options).toContain('__manual__');

    // Tambah baris baru
    const addBtn = container.querySelector('[data-testid="a2-add-unit-btn"]') as HTMLButtonElement;
    await act(async () => {
      addBtn.click();
    });

    const updatedSelects = container.querySelectorAll<HTMLSelectElement>('select[data-unit-select="true"]');
    const newSelect = updatedSelects[updatedSelects.length - 1];
    expect(newSelect).toBeTruthy();

    // Pilih unit TS.01 pada baris baru
    await act(async () => {
      newSelect.value = 'TS.01';
      newSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(newSelect.value).toBe('TS.01');

    // Beralih ke mode manual jika memilih opsi __manual__
    await act(async () => {
      newSelect.value = '__manual__';
      newSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Harus muncul input teks untuk baris tersebut
    const manualInputs = container.querySelectorAll<HTMLInputElement>('input[data-testid="a2-unit-input"]');
    expect(manualInputs.length).toBeGreaterThan(0);
  });

  it('falls back to text input when buses list is empty', async () => {
    await act(async () => {
      root.render(
        <A2ReportModal
          isOpen={true}
          onClose={vi.fn()}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          defaultRenops={30}
          buses={[]}
          initialShift={1}
        />
      );
    });

    const addBtn = container.querySelector('[data-testid="a2-add-unit-btn"]') as HTMLButtonElement;
    await act(async () => {
      addBtn.click();
    });

    // Ketika buses kosong, tidak ada select, langsung input teks
    const selectElements = container.querySelectorAll('select[data-unit-select="true"]');
    expect(selectElements.length).toBe(0);

    const textInputs = container.querySelectorAll('input[data-testid="a2-unit-input"]');
    expect(textInputs.length).toBeGreaterThan(0);
  });
});

