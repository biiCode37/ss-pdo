// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { QuickKorlapFleetModal, parseKorlapUnitNote } from '@/components/fleetStatus/QuickKorlapFleetModal';
import * as fleetStatusService from '@/services/fleetStatusService';
import * as dailyRouteReportService from '@/services/dailyRouteReportService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/fleetStatusService', () => ({
  upsertDailyFleetShift: vi.fn(),
}));

vi.mock('@/services/dailyRouteReportService', () => ({
  fetchDailyRouteReport: vi.fn().mockResolvedValue(null),
  upsertDailyRouteReport: vi.fn().mockResolvedValue({ id: 1 }),
}));

describe('QuickKorlapFleetModal Component', () => {
  let container: HTMLDivElement;
  let root: any;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('renders modal with route info, renops, and realops inputs', async () => {
    await act(async () => {
      root.render(
        <QuickKorlapFleetModal
          isOpen={true}
          onClose={vi.fn()}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          shift={1}
          defaultRenops={30}
          initialRealops={28}
          onSaveSuccess={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain('Input Cepat Status Armada (Korlap)');
    expect(container.textContent).toContain('JAK.15');
    const renopsInput = container.querySelector('[data-testid="korlap-renops-input"]') as HTMLInputElement;
    const realopsInput = container.querySelector('[data-testid="korlap-realops-input"]') as HTMLInputElement;
    expect(renopsInput.value).toBe('30');
    expect(realopsInput.value).toBe('28');
  });

  it('submits manual override with source_type = korlap_manual and submitted_by_role = korlap', async () => {
    const mockUpsert = vi.mocked(fleetStatusService.upsertDailyFleetShift);
    mockUpsert.mockResolvedValueOnce({
      id: 12,
      route_id: 1,
      route_code: 'JAK.15',
      date: '2026-10-11',
      shift: 1,
      target_renops: 30,
      realops: 27,
      total_units: 30,
      sgo_count: 27,
      to_count: 0,
      off_count: 0,
      so_count: 0,
      other_count: 0,
      is_confirmed: true,
      source_type: 'korlap_manual',
      submitted_by_role: 'korlap',
      non_sgo_units: [],
    });

    const onSaveSuccess = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <QuickKorlapFleetModal
          isOpen={true}
          onClose={onClose}
          routeId={1}
          routeCode="JAK.15"
          selectedDate="2026-10-11"
          shift={1}
          defaultRenops={30}
          initialRealops={27}
          onSaveSuccess={onSaveSuccess}
        />
      );
    });

    const notesInput = container.querySelector('[data-testid="korlap-notes-input"]') as HTMLInputElement;
    await act(async () => {
      notesInput.value = 'TS.02 BA.01 Radiator';
      notesInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const submitBtn = container.querySelector('[data-testid="korlap-submit-btn"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 1,
        route_code: 'JAK.15',
        source_type: 'korlap_manual',
        submitted_by_role: 'korlap',
        realops: 27,
      }),
      expect.any(Array)
    );
    expect(dailyRouteReportService.upsertDailyRouteReport).toHaveBeenCalled();
    expect(onSaveSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  describe('parseKorlapUnitNote', () => {
    it('parses multi-word body codes like KWK 222177 OFF', () => {
      const parsed = parseKorlapUnitNote('KWK 222177 OFF');
      expect(parsed.unit_body).toBe('KWK 222177');
      expect(parsed.status_code).toBe('OFF');
      expect(parsed.note).toBe('OFF');
    });

    it('parses dotted codes like TS.02 Radiator bocor', () => {
      const parsed = parseKorlapUnitNote('TS.02 Radiator bocor');
      expect(parsed.unit_body).toBe('TS.02');
      expect(parsed.status_code).toBe('KENDALA');
      expect(parsed.note).toBe('Radiator bocor');
    });

    it('parses separated codes with dash or colon like SAF 05 : Mogok', () => {
      const parsed = parseKorlapUnitNote('SAF 05 : Mogok di lampu merah');
      expect(parsed.unit_body).toBe('SAF 05');
      expect(parsed.status_code).toBe('KENDALA');
      expect(parsed.note).toBe('Mogok di lampu merah');
    });

    it('parses pure number body code like 222180 Libur', () => {
      const parsed = parseKorlapUnitNote('222180 Libur');
      expect(parsed.unit_body).toBe('222180');
      expect(parsed.status_code).toBe('OFF');
    });
  });
});
