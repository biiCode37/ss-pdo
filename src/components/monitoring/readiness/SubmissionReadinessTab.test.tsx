// src/components/monitoring/readiness/SubmissionReadinessTab.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TEXT_MONITORING } from '@/constants/texts';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const state = {
  routes: [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }],
  rows: [{ route_id: 1, route_code: 'JAK.01', last_synced_at: null, completeness: {
    v: 1, computedAt: '', status: 'ok', fingerprint: 'f',
    counts: { LENGKAP: 9, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 1, SEBAGIAN: 0 },
    issues: [{ unit: 'KLM 540', status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' }] } }],
  confirmations: [], todayWib: '2026-11-07', loading: false, error: false,
  reload: vi.fn(), applyConfirmation: vi.fn(),
};
vi.mock('./useSubmissionReadiness', () => ({ useSubmissionReadiness: () => state }));
vi.mock('@/services/submissionReadinessService', () => ({ confirmRouteSubmission: vi.fn(), ConfirmSubmissionError: class extends Error {} }));
vi.mock('@/services/realtimeSyncService', () => ({ triggerRealtimeSheetSync: vi.fn() }));
vi.mock('@/utils/alertUtils', () => ({ showErrorToast: vi.fn(), showInfoToast: vi.fn(), showSuccessToast: vi.fn() }));

import { SubmissionReadinessTab } from './SubmissionReadinessTab';

describe('SubmissionReadinessTab', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('menampilkan ringkasan dan mengurutkan rute janggal paling atas', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="kelengkapan" onSegmentChange={vi.fn()} armadaContent={null} />);
    });
    expect(container.textContent).toContain(TEXT_MONITORING.SUBMISSION.SUMMARY(0, 2));
    const codes = [...container.querySelectorAll('.submission-card__code')].map((n) => n.textContent);
    expect(codes).toEqual(['JAK.01', 'JAK.02']);
    expect(container.textContent).toContain(TEXT_MONITORING.SUBMISSION.STATE.JANGGAL);
  });

  it('menampilkan konten armada saat segmen armada', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="armada" onSegmentChange={vi.fn()} armadaContent={<p>ARMADA</p>} />);
    });
    expect(container.textContent).toContain('ARMADA');
    expect(container.querySelector('.submission-card')).toBeNull();
  });

  it('membuka modal detail dengan struktur header, close button, body, dan footer', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="kelengkapan" onSegmentChange={vi.fn()} armadaContent={null} />);
    });
    const firstCard = container.querySelector<HTMLButtonElement>('.submission-card');
    expect(firstCard).toBeTruthy();
    await act(async () => {
      firstCard?.click();
    });
    expect(document.querySelector('.submission-modal__header')).toBeTruthy();
    expect(document.querySelector('.submission-modal__close')).toBeTruthy();
    expect(document.querySelector('.submission-modal__body')).toBeTruthy();
    expect(document.querySelector('.submission-modal__footer')).toBeTruthy();
  });
});
