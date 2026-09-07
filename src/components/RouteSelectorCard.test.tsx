// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('gapi-script', () => ({
  gapi: {
    load: vi.fn(),
    client: {
      init: vi.fn(),
      sheets: {
        spreadsheets: {
          get: vi.fn(),
          values: { get: vi.fn(), update: vi.fn() },
        },
      },
    },
  },
}));

// Mock routeService
vi.mock('../services/routeService', () => ({
  fetchRoutesWithSheets: vi.fn().mockResolvedValue([
    {
      id: 1,
      route_code: 'JAK.115',
      route_name: 'JAK.115',
      route_sheets: [
        {
          id: 10,
          route_id: 1,
          month: 9,
          year: 2026,
          sheet_url: 'https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit',
          spreadsheet_id: '1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk',
        },
      ],
    },
  ]),
  createRouteWithSheet: vi.fn(),
  inspectSpreadsheetHeader: vi.fn(),
}));

// Mock cacheUtils
vi.mock('../utils/cacheUtils', () => ({
  getRoutesFromCache: vi.fn().mockReturnValue([
    {
      id: 1,
      route_code: 'JAK.115',
      route_name: 'JAK.115',
      route_sheets: [
        {
          id: 10,
          route_id: 1,
          month: 9,
          year: 2026,
          sheet_url: 'https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit',
          spreadsheet_id: '1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk',
        },
      ],
    },
  ]),
}));

import { RouteSelectorCard } from './RouteSelectorCard';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('RouteSelectorCard - Mode Akumulasi Deactivation (ACC-17-01)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it('allows user to pick date from Tanggal dropdown when in AKUMULASI mode instead of disabling it', async () => {
    const handleSetSelectedTab = vi.fn();
    const handleLoadData = vi.fn();
    const handleExitAccumulation = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="AKUMULASI"
          setSelectedTab={handleSetSelectedTab}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="AKUMULASI"
          onLoadData={handleLoadData}
          onExitAccumulation={handleExitAccumulation}
          accRange={{
            startDay: 1,
            startMonth: 9,
            startYear: 2026,
            endDay: 5,
            endMonth: 9,
            endYear: 2026,
          }}
        />
      );
    });

    const selects = container.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(4);

    const dateSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((opt) => opt.text.includes('Tgl 1') || opt.text.includes('Akumulasi'))
    ) as HTMLSelectElement;

    expect(dateSelect).toBeTruthy();
    // CRITICAL: dateSelect must NOT be disabled when in AKUMULASI mode!
    expect(dateSelect.disabled).toBe(false);

    // Check that AKUMULASI option is present
    const akumulasiOption = Array.from(dateSelect.options).find((opt) => opt.value === 'AKUMULASI');
    expect(akumulasiOption).toBeTruthy();

    // Simulate user selecting "5"
    await act(async () => {
      dateSelect.value = '5';
      dateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(handleSetSelectedTab).toHaveBeenCalledWith('5');
  });

  it('renders exit button to return to daily mode when in AKUMULASI mode', async () => {
    const handleExitAccumulation = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="AKUMULASI"
          setSelectedTab={vi.fn()}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="AKUMULASI"
          onLoadData={vi.fn()}
          onExitAccumulation={handleExitAccumulation}
          accRange={{
            startDay: 1,
            startMonth: 9,
            startYear: 2026,
            endDay: 5,
            endMonth: 9,
            endYear: 2026,
          }}
        />
      );
    });

    const exitBtn = container.querySelector('[data-testid="exit-accumulation-btn"]') as HTMLButtonElement;
    expect(exitBtn).toBeTruthy();

    await act(async () => {
      exitBtn.click();
    });

    expect(handleExitAccumulation).toHaveBeenCalled();
  });
});
