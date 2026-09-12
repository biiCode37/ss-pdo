// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

(window as any).gapi = {
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
};

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

  it('renders clean full date label with operational report button and triggers route code change', async () => {
    const handleOpenReportModal = vi.fn();
    const handleRouteCodeChange = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="5"
          setSelectedTab={vi.fn()}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="5"
          onLoadData={vi.fn()}
          reportRoute={{ id: 1, route_code: 'JAK.115' }}
          reportStatus="draft"
          onOpenReportModal={handleOpenReportModal}
          onRouteCodeChange={handleRouteCodeChange}
        />
      );
    });

    // Verify unified left segment displays formatted full Indonesian date label (e.g. 05 Sep 2026)
    expect(container.textContent).toMatch(/\d{2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}/);
    expect(container.textContent).toContain('05');

    // Verify route code callback is invoked with active route code
    expect(handleRouteCodeChange).toHaveBeenCalledWith('JAK.115');

    // Verify operational report button is present and clickable
    const reportBtn = container.querySelector('[data-testid="open-operational-report-btn"]') as HTMLButtonElement;
    expect(reportBtn).toBeTruthy();
    expect(reportBtn.textContent).toContain('Laporan');

    await act(async () => {
      reportBtn.click();
    });

    expect(handleOpenReportModal).toHaveBeenCalled();
  });

  it('renders date segment as static non-clickable badge and does not open sheet on click', async () => {
    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="5"
          setSelectedTab={vi.fn()}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="5"
          onLoadData={vi.fn()}
          reportRoute={{ id: 1, route_code: 'JAK.115' }}
          reportStatus="draft"
        />
      );
    });

    const dateBadge = container.querySelector('[data-testid="date-display-badge"]') as HTMLElement;
    expect(dateBadge).toBeTruthy();
    expect(dateBadge.getAttribute('role')).toBeNull();
    expect(dateBadge.getAttribute('tabindex')).toBeNull();

    const sheetOverlay = container.querySelector('.route-selector-modal-overlay') as HTMLElement;
    expect(sheetOverlay.style.display).toBe('none');

    // Clicking date badge does not open the sheet
    await act(async () => {
      dateBadge.click();
    });
    expect(sheetOverlay.style.display).toBe('none');
  });

  it('opens route selector sheet only via externalOpenTrigger (from active route pill)', async () => {
    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="5"
          setSelectedTab={vi.fn()}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="5"
          onLoadData={vi.fn()}
          reportRoute={{ id: 1, route_code: 'JAK.115' }}
          reportStatus="draft"
          externalOpenTrigger={1}
        />
      );
    });

    const sheetOverlay = container.querySelector('.route-selector-modal-overlay') as HTMLElement;
    expect(sheetOverlay.style.display).toBe('flex');
  });

  it('syncs selectedTab reactively when currentTabName updates', async () => {
    const handleSetSelectedTab = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="2"
          setSelectedTab={handleSetSelectedTab}
          days={['1', '2', '3', '12']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="12"
          onLoadData={vi.fn()}
          reportRoute={{ id: 1, route_code: 'JAK.115' }}
          reportStatus="draft"
        />
      );
    });

    // Should call setSelectedTab with '12' to sync with currentTabName
    expect(handleSetSelectedTab).toHaveBeenCalledWith('12');
  });

  it('syncs selectedTab with currentTabName when externalOpenTrigger is triggered', async () => {
    const handleSetSelectedTab = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="2"
          setSelectedTab={handleSetSelectedTab}
          days={['1', '2', '3', '12']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="12"
          onLoadData={vi.fn()}
          reportRoute={{ id: 1, route_code: 'JAK.115' }}
          reportStatus="draft"
          externalOpenTrigger={2}
        />
      );
    });

    expect(handleSetSelectedTab).toHaveBeenCalledWith('12');
    const sheetOverlay = container.querySelector('.route-selector-modal-overlay') as HTMLElement;
    expect(sheetOverlay.style.display).toBe('flex');
  });

  it('prioritizes today date over stale savedTab in localStorage for current period', async () => {
    const handleSetSelectedTab = vi.fn();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const todayStr = String(now.getDate());

    // Stale saved date in localStorage: day 2
    localStorage.setItem(
      'PDO_LAST_VISITED',
      JSON.stringify({
        sheetUrl: 'https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit',
        selectedTab: '2',
        routeCode: 'JAK.115',
        month: currentMonth,
        year: currentYear,
      })
    );

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab={todayStr}
          setSelectedTab={handleSetSelectedTab}
          days={['1', '2', todayStr]}
          isLoading={false}
          isDataLoaded={false}
          onLoadData={vi.fn()}
        />
      );
    });

    // When restoring routes, for current month/year it should use todayStr, NOT '2'
    expect(handleSetSelectedTab).toHaveBeenCalledWith(todayStr);

    localStorage.removeItem('PDO_LAST_VISITED');
  });

  it('does NOT trigger onLoadData when picking date in dropdown, only updates state until Load Data button is clicked', async () => {
    const handleSetSelectedTab = vi.fn();
    const handleLoadData = vi.fn();
    const handleExitAccumulation = vi.fn();

    await act(async () => {
      root.render(
        <RouteSelectorCard
          sheetUrl="https://docs.google.com/spreadsheets/d/1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk/edit"
          setSheetUrl={vi.fn()}
          selectedTab="2"
          setSelectedTab={handleSetSelectedTab}
          days={['1', '2', '3', '4', '5']}
          isLoading={false}
          isDataLoaded={true}
          currentSheetId="1z0o91thOT38lgejTE_Bd2p3v_9VCDdQRkUsMIVqpQCk"
          currentTabName="2"
          onLoadData={handleLoadData}
          onExitAccumulation={handleExitAccumulation}
          externalOpenTrigger={1}
        />
      );
    });

    const selects = container.querySelectorAll('select');
    const dateSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((opt) => opt.text.includes('Tgl 1'))
    ) as HTMLSelectElement;

    expect(dateSelect).toBeTruthy();

    // User chooses day 4 from dropdown
    await act(async () => {
      dateSelect.value = '4';
      dateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Verify setSelectedTab is called with '4'
    expect(handleSetSelectedTab).toHaveBeenCalledWith('4');

    // CRITICAL: onLoadData and onExitAccumulation MUST NOT be triggered on dropdown change!
    expect(handleLoadData).not.toHaveBeenCalled();
    expect(handleExitAccumulation).not.toHaveBeenCalled();

    // Now user clicks "Load Data Unit" button
    const loadDataBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Load Data Unit')
    ) as HTMLButtonElement;
    expect(loadDataBtn).toBeTruthy();

    await act(async () => {
      loadDataBtn.click();
    });

    // onLoadData should now be called
    expect(handleLoadData).toHaveBeenCalled();
  });
});
