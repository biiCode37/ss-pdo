// src/components/monitoring/readiness/ReadinessRouteDetailModal.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TEXT_MONITORING } from '@/constants/texts';
import { ReadinessRouteDetailModal } from './ReadinessRouteDetailModal';
import type { RouteReadinessView } from './readinessModel';
import type { RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/services/submissionReadinessService', () => ({
  confirmRouteSubmission: vi.fn(),
  ConfirmSubmissionError: class extends Error {},
}));
vi.mock('@/services/realtimeSyncService', () => ({
  triggerRealtimeSheetSync: vi.fn(),
}));
vi.mock('@/utils/alertUtils', () => ({
  showErrorToast: vi.fn(),
  showInfoToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

const T = TEXT_MONITORING.SUBMISSION;

describe('ReadinessRouteDetailModal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('Kriteria 1: rute lengkap + wajar menampilkan "Semua unit lengkap." dan daftar unit wajar tanpa kolom alasan', async () => {
    const completeness: RouteCompleteness = {
      v: 1,
      computedAt: '2026-11-08T00:00:00Z',
      status: 'ok',
      fingerprint: 'fp-115',
      counts: {
        LENGKAP: 8,
        WAJAR: 1,
        DIKECUALIKAN: 0,
        BELUM_DIISI: 0,
        JANGGAL: 0,
        SEBAGIAN: 0,
      },
      issues: [
        {
          unit: 'KWK 222179',
          status: 'WAJAR',
          missing: ['toaShift1'],
          note: 'Program Keur/ Renops',
        },
      ],
    };

    const view: RouteReadinessView = {
      routeId: 115,
      routeCode: 'JAK.115',
      completeness,
      lastSyncedAt: '2026-11-08T07:30:00Z',
      confirmation: null,
      state: 'READY_UNCONFIRMED',
      issueCount: 0,
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={view}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });

    // 1. Menampilkan T.DETAIL_NO_ISSUES ("Semua unit lengkap.")
    expect(document.body.textContent).toContain(T.DETAIL_NO_ISSUES);

    // 2. Menampilkan daftar unit wajar dalam ul.submission-issues dengan data-tone="neutral"
    const issueItems = document.body.querySelectorAll('.submission-issue');
    expect(issueItems).toHaveLength(1);

    const unitEl = issueItems[0].querySelector('.submission-issue__unit');
    expect(unitEl?.textContent).toBe('KWK 222179');

    const statusBadge = issueItems[0].querySelector('.ui-status');
    expect(statusBadge?.getAttribute('data-tone')).toBe('neutral');
    expect(statusBadge?.textContent).toBe('Wajar · TOA S1 kosong · Program Keur/ Renops');

    // 3. Tanpa kolom alasan (needsReason bernilai false)
    expect(document.body.querySelector('.submission-reason')).toBeNull();

    // 4. Tombol konfirmasi tidak disabled
    const confirmBtn = document.body.querySelector<HTMLButtonElement>('.ui-button--primary');
    expect(confirmBtn?.disabled).toBe(false);
  });

  it('Kriteria 2: rute masalah + wajar menampilkan masalah lebih dulu lalu wajar, dan hint alasan hanya menghitung masalah', async () => {
    const completeness: RouteCompleteness = {
      v: 1,
      computedAt: '2026-11-08T00:00:00Z',
      status: 'ok',
      fingerprint: 'fp-10',
      counts: {
        LENGKAP: 7,
        WAJAR: 1,
        DIKECUALIKAN: 0,
        BELUM_DIISI: 0,
        JANGGAL: 1,
        SEBAGIAN: 0,
      },
      issues: [
        {
          unit: 'KLM 540',
          status: 'JANGGAL',
          reason: 'RITASE_TANPA_TOA',
        },
        {
          unit: 'KWK 222180',
          status: 'WAJAR',
          missing: ['totalToa'],
          note: 'NP2',
        },
      ],
    };

    const view: RouteReadinessView = {
      routeId: 10,
      routeCode: 'JAK.10',
      completeness,
      lastSyncedAt: '2026-11-08T07:30:00Z',
      confirmation: null,
      state: 'JANGGAL',
      issueCount: 1, // unit WAJAR tidak dihitung di issueCount
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={view}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });

    // T.DETAIL_NO_ISSUES TIDAK tampil karena ada masalah (KLM 540)
    expect(document.body.textContent).not.toContain(T.DETAIL_NO_ISSUES);

    const issueItems = document.body.querySelectorAll('.submission-issue');
    expect(issueItems).toHaveLength(2);

    // Masalah pertama: KLM 540 dengan data-tone="error"
    expect(issueItems[0].querySelector('.submission-issue__unit')?.textContent).toBe('KLM 540');
    const badge0 = issueItems[0].querySelector('.ui-status');
    expect(badge0?.getAttribute('data-tone')).toBe('error');
    expect(badge0?.textContent).toBe(T.ISSUE_REASON.RITASE_TANPA_TOA);

    // Unit wajar sesudahnya: KWK 222180 dengan data-tone="neutral"
    expect(issueItems[1].querySelector('.submission-issue__unit')?.textContent).toBe('KWK 222180');
    const badge1 = issueItems[1].querySelector('.ui-status');
    expect(badge1?.getAttribute('data-tone')).toBe('neutral');
    expect(badge1?.textContent).toBe('Wajar · Total TOA kosong · NP2');

    // Kolom alasan tampil dan menyebut 1 masalah (bukan 2)
    const reasonLabel = document.body.querySelector('.submission-reason');
    expect(reasonLabel).toBeTruthy();
    expect(reasonLabel?.textContent).toContain(T.REASON_HINT(1));
    expect(reasonLabel?.textContent).not.toContain('2 masalah');
  });

  it('Kriteria 3: data lama tanpa WAJAR tampil persis seperti sebelumnya', async () => {
    const legacyCounts = {
      LENGKAP: 8,
      DIKECUALIKAN: 0,
      BELUM_DIISI: 1,
      JANGGAL: 0,
      SEBAGIAN: 0,
    } as unknown as RouteCompleteness['counts'];

    const completeness: RouteCompleteness = {
      v: 1,
      computedAt: '2026-11-08T00:00:00Z',
      status: 'ok',
      fingerprint: 'fp-legacy',
      counts: legacyCounts,
      issues: [
        {
          unit: 'TJ 001',
          status: 'BELUM_DIISI',
        },
      ],
    };

    const view: RouteReadinessView = {
      routeId: 1,
      routeCode: 'JAK.01',
      completeness,
      lastSyncedAt: null,
      confirmation: null,
      state: 'BELUM_DIISI',
      issueCount: 1,
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={view}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });

    const issueItems = document.body.querySelectorAll('.submission-issue');
    expect(issueItems).toHaveLength(1);
    expect(issueItems[0].querySelector('.ui-status')?.textContent).toBe(T.ISSUE_EMPTY);
  });

  it('Kriteria 5: menangani kasus tepi note kosong, missing totalToa vs toaShift1, null completeness, dan format error', async () => {
    // 1. Note kosong pada status WAJAR
    const completenessEdge: RouteCompleteness = {
      v: 1,
      computedAt: '2026-11-08T00:00:00Z',
      status: 'ok',
      fingerprint: 'fp-edge',
      counts: { LENGKAP: 5, WAJAR: 2, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0 },
      issues: [
        { unit: 'B 101', status: 'WAJAR', missing: ['toaShift1'], note: '' },
        { unit: 'B 102', status: 'WAJAR', missing: ['totalToa'], note: 'Renops' },
      ],
    };

    const viewEdge: RouteReadinessView = {
      routeId: 2,
      routeCode: 'JAK.02',
      completeness: completenessEdge,
      lastSyncedAt: null,
      confirmation: null,
      state: 'READY_UNCONFIRMED',
      issueCount: 0,
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={viewEdge}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });

    const issues = document.body.querySelectorAll('.submission-issue');
    expect(issues).toHaveLength(2);
    expect(issues[0].querySelector('.ui-status')?.textContent).toBe('Wajar · TOA S1 kosong');
    expect(issues[1].querySelector('.ui-status')?.textContent).toBe('Wajar · Total TOA kosong · Renops');

    // 2. Kasus rute tanpa completeness (null)
    const viewNull: RouteReadinessView = {
      routeId: 3,
      routeCode: 'JAK.03',
      completeness: null,
      lastSyncedAt: null,
      confirmation: null,
      state: 'NO_DATA',
      issueCount: 0,
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={viewNull}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });
    expect(document.body.textContent).toContain(T.DETAIL_NO_DATA);

    // 3. Kasus status header_not_found
    const viewFormatErr: RouteReadinessView = {
      routeId: 4,
      routeCode: 'JAK.04',
      completeness: {
        v: 1,
        computedAt: '2026-11-08T00:00:00Z',
        status: 'header_not_found',
        fingerprint: 'fp-err',
        counts: { LENGKAP: 0, WAJAR: 0, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0 },
        issues: [],
      },
      lastSyncedAt: null,
      confirmation: null,
      state: 'FORMAT_ERROR',
      issueCount: 0,
    };

    await act(async () => {
      root.render(
        <ReadinessRouteDetailModal
          view={viewFormatErr}
          date="2026-11-08"
          onClose={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );
    });
    expect(document.body.textContent).toContain(T.DETAIL_FORMAT_ERROR);
  });
});
