// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RouteOperationalReportCard } from './RouteOperationalReportCard';
import * as dailyReportService from '../services/dailyRouteReportService';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../services/dailyRouteReportService', () => ({
  fetchDailyRouteReport: vi.fn(),
  upsertDailyRouteReport: vi.fn(),
}));

describe('RouteOperationalReportCard Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    (dailyReportService.fetchDailyRouteReport as any).mockResolvedValue(null);
    (dailyReportService.upsertDailyRouteReport as any).mockResolvedValue({ id: 1, status: 'submitted' });

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

  it('renders input fields for renops, realops, and jam spots', async () => {
    await act(async () => {
      root.render(
        <RouteOperationalReportCard
          routeId={2}
          routeCode="JAK.15"
          selectedDate="2026-09-02"
          defaultTrafficJamSpots={['Jl. Jampea', 'Jl. Marunda Makmur']}
          defaultRenops={60}
        />
      );
    });

    expect(container.textContent).toContain('Laporan Kondisi & Armada Rute');
    expect(container.textContent).toContain('Renops Shift 1');
    expect(container.textContent).toContain('Realops Shift 1');
    expect(container.textContent).toContain('Renops Shift 2');
    expect(container.textContent).toContain('Realops Shift 2');
    expect(container.textContent).toContain('Jl. Jampea');
    expect(container.textContent).toContain('Jl. Marunda Makmur');
  });

  it('loads existing report data if present', async () => {
    (dailyReportService.fetchDailyRouteReport as any).mockResolvedValue({
      id: 5,
      route_id: 2,
      route_code: 'JAK.15',
      date: '2026-09-02',
      renops_shift1: 60,
      realops_shift1: 59,
      renops_shift2: 60,
      realops_shift2: 58,
      headway_fastest: 3,
      headway_slowest: 6,
      traffic_jam_spots: ['Jl. Jampea'],
      operational_issues: 'Realisasi berkurang',
      status: 'submitted'
    });

    await act(async () => {
      root.render(
        <RouteOperationalReportCard
          routeId={2}
          routeCode="JAK.15"
          selectedDate="2026-09-02"
          defaultTrafficJamSpots={['Jl. Jampea']}
        />
      );
    });

    expect(container.textContent).toContain('Lengkap (Submitted)');
    const inputs = container.querySelectorAll('input');
    const realops1Input = Array.from(inputs).find(i => i.id === 'realops-s1');
    expect(realops1Input?.value).toBe('59');
  });

  it('handles toggle spot and submit correctly', async () => {
    const onSavedMock = vi.fn();

    await act(async () => {
      root.render(
        <RouteOperationalReportCard
          routeId={2}
          routeCode="JAK.15"
          selectedDate="2026-09-02"
          defaultTrafficJamSpots={['Jl. Jampea']}
          defaultRenops={60}
          onSaved={onSavedMock}
        />
      );
    });

    // Toggle spot button
    const spotBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent === 'Jl. Jampea'
    );
    expect(spotBtn).toBeDefined();
    await act(async () => {
      spotBtn?.click();
    });

    // Find submit button and submit
    const submitBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Kirim Laporan Operasional')
    );
    expect(submitBtn).toBeDefined();

    await act(async () => {
      submitBtn?.click();
    });

    expect(dailyReportService.upsertDailyRouteReport).toHaveBeenCalledWith(
      expect.objectContaining({
        route_id: 2,
        route_code: 'JAK.15',
        date: '2026-09-02',
        traffic_jam_spots: expect.arrayContaining(['Jl. Jampea']),
        status: 'submitted'
      })
    );
    expect(onSavedMock).toHaveBeenCalled();
  });

  it('handles asModal mode, locking body scroll and calling onClose', async () => {
    const onCloseMock = vi.fn();

    await act(async () => {
      root.render(
        <RouteOperationalReportCard
          asModal={true}
          isOpen={true}
          onClose={onCloseMock}
          routeId={2}
          routeCode="JAK.15"
          selectedDate="2026-09-02"
        />
      );
    });

    expect(document.body.style.overflow).toBe('hidden');

    const closeBtn = container.querySelector('button[title="Tutup"]') as HTMLButtonElement;
    expect(closeBtn).toBeDefined();

    await act(async () => {
      closeBtn?.click();
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('renders clean headway labels without duplicate (Menit) and supports segmented navigation', async () => {
    const onOpenFleetStatusMock = vi.fn();

    await act(async () => {
      root.render(
        <RouteOperationalReportCard
          asModal={true}
          isOpen={true}
          routeId={2}
          routeCode="JAK.15"
          selectedDate="2026-09-02"
          onOpenFleetStatus={onOpenFleetStatusMock}
        />
      );
    });

    // Verify headway label text does not duplicate (Menit)
    expect(container.textContent).toContain('Headway Tercepat (Menit)');
    expect(container.textContent).toContain('Headway Terlama (Menit)');
    expect(container.textContent).not.toContain('(Menit) (Menit)');

    // Verify Section 1 does not contain redundant button
    expect(container.textContent).not.toContain('Atur Unit Armada →');

    // Verify Segmented Control button triggers onOpenFleetStatus
    const fleetTabBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Status Armada')
    );
    expect(fleetTabBtn).toBeDefined();

    await act(async () => {
      fleetTabBtn?.click();
    });

    expect(onOpenFleetStatusMock).toHaveBeenCalledTimes(1);
  });
});
