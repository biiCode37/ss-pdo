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
vi.mock('@/services/realtimeSyncService', () => ({ triggerRealtimeSheetSync: vi.fn(), recheckRoutesCompleteness: vi.fn() }));
vi.mock('@/utils/alertUtils', () => ({ showErrorToast: vi.fn(), showInfoToast: vi.fn(), showSuccessToast: vi.fn() }));

import { SubmissionReadinessTab } from './SubmissionReadinessTab';
import { recheckRoutesCompleteness } from '@/services/realtimeSyncService';
import { showInfoToast, showSuccessToast, showErrorToast } from '@/utils/alertUtils';

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

  describe('cek ulang semua rute (tombol refresh header)', () => {
    const renderWithRegister = async () => {
      let recheckAll: (() => Promise<void>) | null = null;
      await act(async () => {
        root.render(
          <SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="kelengkapan" onSegmentChange={vi.fn()}
            armadaContent={null} onRegisterRecheckAll={(fn) => { recheckAll = fn; }} />,
        );
      });
      expect(recheckAll).not.toBeNull();
      return () => recheckAll!();
    };

    beforeEach(() => {
      vi.mocked(recheckRoutesCompleteness).mockReset();
      state.reload.mockClear();
      vi.mocked(showInfoToast).mockClear();
      vi.mocked(showSuccessToast).mockClear();
      vi.mocked(showErrorToast).mockClear();
    });

    it('memicu cek ulang semua rute untuk tanggal terpilih, menampilkan progres, lalu memuat ulang status sekali', async () => {
      let report: (done: number, total: number) => void = () => {};
      let finish: (v: { status: 'done'; total: number; failed: number }) => void = () => {};
      vi.mocked(recheckRoutesCompleteness).mockImplementation((_codes, _date, onProgress) => {
        report = onProgress!;
        return new Promise((resolve) => { finish = resolve; });
      });
      const run = await renderWithRegister();

      let pending!: Promise<void>;
      await act(async () => { pending = run(); });
      expect(recheckRoutesCompleteness).toHaveBeenCalledTimes(1);
      expect(vi.mocked(recheckRoutesCompleteness).mock.calls[0][0]).toEqual(['JAK.01', 'JAK.02']);
      expect(vi.mocked(recheckRoutesCompleteness).mock.calls[0][1]).toBe('2026-11-07');

      await act(async () => { report(1, 2); });
      expect(container.querySelector('.submission-control-bar__summary')?.textContent).toBe(TEXT_MONITORING.SUBMISSION.RECHECK_ALL_PROGRESS(1, 2));

      await act(async () => { finish({ status: 'done', total: 2, failed: 0 }); await pending; });
      expect(state.reload).toHaveBeenCalledTimes(1);
      expect(showSuccessToast).toHaveBeenCalledWith(TEXT_MONITORING.SUBMISSION.RECHECK_ALL_DONE(2));
      expect(container.querySelector('.submission-control-bar__summary')?.textContent).toBe(TEXT_MONITORING.SUBMISSION.SUMMARY(0, 2));
    });

    it('melaporkan rute yang gagal dicek ulang', async () => {
      vi.mocked(recheckRoutesCompleteness).mockResolvedValue({ status: 'done', total: 2, failed: 1 });
      const run = await renderWithRegister();
      await act(async () => { await run(); });
      expect(showErrorToast).toHaveBeenCalledWith(TEXT_MONITORING.SUBMISSION.RECHECK_ALL_PARTIAL(1, 2));
      expect(state.reload).toHaveBeenCalledTimes(1);
    });

    it('saat masih dalam jeda hanya memberi tahu sisa waktu tanpa memuat ulang', async () => {
      vi.mocked(recheckRoutesCompleteness).mockResolvedValue({ status: 'cooldown', remainingMs: 89_200 });
      const run = await renderWithRegister();
      await act(async () => { await run(); });
      expect(showInfoToast).toHaveBeenCalledWith(TEXT_MONITORING.SUBMISSION.RECHECK_ALL_COOLDOWN(90));
      expect(state.reload).not.toHaveBeenCalled();
    });

    it('hanya mengecek rute pantauan saat filter Pantauan aktif', async () => {
      vi.mocked(recheckRoutesCompleteness).mockResolvedValue({ status: 'done', total: 1, failed: 0 });
      const run = await renderWithRegister();
      // Simpan pantauan berisi JAK.02 lewat modal pilih rute lalu aktifkan filter Pantauan
      await act(async () => {
        container.querySelector<HTMLButtonElement>('.submission-control-bar__pick-btn')?.click();
      });
      const option = [...document.querySelectorAll<HTMLButtonElement>('.ui-option-btn')].find((b) => b.textContent === 'JAK.02');
      expect(option).toBeTruthy();
      await act(async () => { option?.click(); });
      const save = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === TEXT_MONITORING.SUBMISSION.WATCHLIST_SAVE);
      await act(async () => { save?.click(); });
      const watchBtn = [...container.querySelectorAll<HTMLButtonElement>('.ui-segmented-btn')].find((b) => b.textContent === TEXT_MONITORING.SUBMISSION.FILTER_WATCHLIST(1));
      await act(async () => { watchBtn?.click(); });

      await act(async () => { await run(); });
      expect(vi.mocked(recheckRoutesCompleteness).mock.calls[0][0]).toEqual(['JAK.02']);
      localStorage.clear();
    });
  });
});
