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

  it('memiliki .submission-control-bar dan memfilter rute saat chip masalah diklik', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="kelengkapan" onSegmentChange={vi.fn()} armadaContent={null} />);
    });
    const controlBar = container.querySelector('.submission-control-bar');
    expect(controlBar).toBeTruthy();

    let cards = container.querySelectorAll('.submission-card');
    expect(cards).toHaveLength(2);

    const janggalChip = [...container.querySelectorAll<HTMLButtonElement>('.ui-chip-btn')].find((btn) =>
      btn.textContent?.includes(TEXT_MONITORING.SUBMISSION.SUMMARY_JANGGAL(1)),
    );
    expect(janggalChip).toBeTruthy();
    expect(janggalChip?.getAttribute('aria-pressed')).toBe('false');

    await act(async () => {
      janggalChip?.click();
    });
    expect(janggalChip?.getAttribute('aria-pressed')).toBe('true');
    cards = container.querySelectorAll('.submission-card');
    expect(cards).toHaveLength(1);
    expect(container.textContent).toContain('JAK.01');
    expect(container.textContent).not.toContain('JAK.02');

    await act(async () => {
      janggalChip?.click();
    });
    expect(janggalChip?.getAttribute('aria-pressed')).toBe('false');
    cards = container.querySelectorAll('.submission-card');
    expect(cards).toHaveLength(2);
  });

  it('filter masalah kembali ke semua rute bila kategori aktif menjadi 0 (chip hilang, tidak terjebak daftar kosong)', async () => {
    const props = { selectedDate: '2026-11-07', onSelectDate: vi.fn(), segment: 'kelengkapan' as const, onSegmentChange: vi.fn(), armadaContent: null };
    await act(async () => {
      root.render(<SubmissionReadinessTab {...props} />);
    });
    const janggalChip = [...container.querySelectorAll<HTMLButtonElement>('.ui-chip-btn')].find((btn) =>
      btn.textContent?.includes(TEXT_MONITORING.SUBMISSION.SUMMARY_JANGGAL(1)),
    );
    await act(async () => {
      janggalChip?.click();
    });
    expect(container.querySelectorAll('.submission-card')).toHaveLength(1);

    // Petugas membetulkan data: pembaruan Realtime membawa baris baru tanpa unit janggal
    const originalRows = state.rows;
    const first = originalRows[0];
    state.rows = [{
      ...first,
      completeness: { ...first.completeness, counts: { ...first.completeness.counts, JANGGAL: 0 }, issues: [] },
    }];
    try {
      await act(async () => {
        root.render(<SubmissionReadinessTab {...props} />);
      });
      expect(container.querySelectorAll('.submission-card')).toHaveLength(2);
    } finally {
      state.rows = originalRows;
    }
  });

  it('menampilkan rute dengan unit wajar sebagai lengkap pada kartu dan membuka modal dengan unit wajar', async () => {
    const originalRows = state.rows;
    state.rows = [
      {
        route_id: 1,
        route_code: 'JAK.01',
        last_synced_at: null,
        completeness: {
          v: 1,
          computedAt: '',
          status: 'ok',
          fingerprint: 'f-wajar',
          counts: { LENGKAP: 9, WAJAR: 1, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0 } as any,
          issues: [
            { unit: 'KWK 222179', status: 'WAJAR', missing: ['toaShift1'], note: 'Keur' },
          ],
        },
      },
    ] as any;
    try {
      await act(async () => {
        root.render(
          <SubmissionReadinessTab
            selectedDate="2026-11-07"
            onSelectDate={vi.fn()}
            segment="kelengkapan"
            onSegmentChange={vi.fn()}
            armadaContent={null}
          />,
        );
      });
      const card = [...container.querySelectorAll<HTMLButtonElement>('.submission-card')].find((c) =>
        c.textContent?.includes('JAK.01'),
      );
      expect(card?.textContent).toContain('10/10 unit lengkap');

      await act(async () => {
        card?.click();
      });
      expect(document.body.textContent).toContain(TEXT_MONITORING.SUBMISSION.DETAIL_NO_ISSUES);
      const wajarStatus = document.body.querySelector('.submission-issue .ui-status');
      expect(wajarStatus?.getAttribute('data-tone')).toBe('neutral');
      expect(wajarStatus?.textContent).toBe('Wajar · TOA S1 kosong · Keur');
    } finally {
      state.rows = originalRows;
    }
  });
});
