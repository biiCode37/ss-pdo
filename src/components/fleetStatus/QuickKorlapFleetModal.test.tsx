// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { QuickKorlapFleetModal } from '@/components/fleetStatus/QuickKorlapFleetModal';
import * as fleetStatusService from '@/services/fleetStatusService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/fleetStatusService', () => ({
  upsertDailyFleetShift: vi.fn(),
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
    expect(onSaveSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
