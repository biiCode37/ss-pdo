// src/components/monitoring/readiness/ReadinessRouteCard.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ReadinessRouteCard } from './ReadinessRouteCard';
import type { RouteReadinessView } from './readinessModel';
import type { RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('ReadinessRouteCard', () => {
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

  it('memperlakukan status WAJAR sebagai lengkap pada hitungan unit', async () => {
    const completeness: RouteCompleteness = {
      v: 1,
      computedAt: '2026-11-08T00:00:00Z',
      status: 'ok',
      fingerprint: 'fp-1',
      counts: {
        LENGKAP: 8,
        WAJAR: 2,
        DIKECUALIKAN: 1,
        BELUM_DIISI: 0,
        JANGGAL: 0,
        SEBAGIAN: 0,
      },
      issues: [
        { unit: 'KWK 222179', status: 'WAJAR', missing: ['toaShift1'], note: 'Program Keur/ Renops' },
        { unit: 'KWK 222180', status: 'WAJAR', missing: ['totalToa'], note: 'NP2' },
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
      root.render(<ReadinessRouteCard view={view} onOpen={vi.fn()} />);
    });

    const meta = container.querySelector('.submission-card__meta');
    expect(meta?.textContent).toBe('11/11 unit lengkap');
  });

  it('menangani data lama tanpa kunci WAJAR tanpa menghasilkan NaN', async () => {
    const legacyCounts = {
      LENGKAP: 8,
      DIKECUALIKAN: 1,
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
        { unit: 'KLM 540', status: 'BELUM_DIISI' },
      ],
    };

    const view: RouteReadinessView = {
      routeId: 10,
      routeCode: 'JAK.10',
      completeness,
      lastSyncedAt: null,
      confirmation: null,
      state: 'BELUM_DIISI',
      issueCount: 1,
    };

    await act(async () => {
      root.render(<ReadinessRouteCard view={view} onOpen={vi.fn()} />);
    });

    const meta = container.querySelector('.submission-card__meta');
    expect(meta?.textContent).toBe('9/10 unit lengkap');
    expect(container.textContent).not.toContain('NaN');
  });

  it('tidak menampilkan meta kelengkapan jika completeness null atau format error', async () => {
    const viewNull: RouteReadinessView = {
      routeId: 12,
      routeCode: 'JAK.12',
      completeness: null,
      lastSyncedAt: null,
      confirmation: null,
      state: 'NO_DATA',
      issueCount: 0,
    };

    await act(async () => {
      root.render(<ReadinessRouteCard view={viewNull} onOpen={vi.fn()} />);
    });
    expect(container.querySelector('.submission-card__meta')).toBeNull();

    const viewError: RouteReadinessView = {
      routeId: 13,
      routeCode: 'JAK.13',
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
      root.render(<ReadinessRouteCard view={viewError} onOpen={vi.fn()} />);
    });
    expect(container.querySelector('.submission-card__meta')).toBeNull();
  });
});
