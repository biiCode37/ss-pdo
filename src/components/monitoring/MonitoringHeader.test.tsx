// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { MonitoringHeader, type MonitoringHeaderProps } from './MonitoringHeader';
import { TEXT_MONITORING } from '@/constants/texts/text_monitoring';

describe('MonitoringHeader Component', () => {
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

  const renderHeader = async (props?: Partial<MonitoringHeaderProps>) => {
    const defaultProps: MonitoringHeaderProps = {
      selectedDate: '2026-09-02',
      onStepDate: vi.fn(),
      onDateInputChange: vi.fn(),
      onRefresh: vi.fn(),
      refreshing: false,
      loading: false,
      ...props,
    };

    await act(async () => {
      root.render(<MonitoringHeader {...defaultProps} />);
    });

    return defaultProps;
  };

  it('renders title, formatted date label, and does not render back arrow button', async () => {
    const onBack = vi.fn();
    await renderHeader({
      selectedDate: '2026-09-02',
      onBackToRouteView: onBack,
    });

    expect(container.textContent).toContain(TEXT_MONITORING.HEADER.TITLE);
    expect(container.textContent).toContain('2 September 2026');

    // Sesuai instruksi: icon panah kembali dihapus (user navigasi via gesture peranti/menu profil)
    const backBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-back-btn"]');
    expect(backBtn).toBeNull();
  });

  it('renders Refresh and Load All buttons side by side in the action row', async () => {
    const onRefresh = vi.fn();
    const onSync = vi.fn();

    await renderHeader({
      selectedDate: '2026-09-02',
      onRefresh,
      onSync18Routes: onSync,
    });

    const refreshBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-refresh-btn"]');
    const loadAllBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-load-all-btn"]');

    expect(refreshBtn).toBeTruthy();
    expect(loadAllBtn).toBeTruthy();
    expect(loadAllBtn?.getAttribute('aria-label')).toBe(TEXT_MONITORING.INGESTION.BUTTON_LABEL);
    expect(loadAllBtn?.getAttribute('title')).toBe(TEXT_MONITORING.INGESTION.TOOLTIP);

    // Click refresh
    await act(async () => {
      refreshBtn?.click();
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Click load all
    await act(async () => {
      loadAllBtn?.click();
    });
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('triggers showPicker fallback on date container tap', async () => {
    await renderHeader({
      selectedDate: '2026-09-02',
    });

    const datePickerContainer = container.querySelector<HTMLDivElement>('[data-testid="monitoring-date-picker-trigger"]');
    const dateInput = container.querySelector<HTMLInputElement>('[data-testid="monitoring-native-date-input"]');

    expect(datePickerContainer).toBeTruthy();
    expect(dateInput).toBeTruthy();
    expect(dateInput?.value).toBe('2026-09-02');

    // Mock showPicker if present
    const showPickerMock = vi.fn();
    (dateInput as any).showPicker = showPickerMock;

    await act(async () => {
      datePickerContainer?.click();
    });

    expect(showPickerMock).toHaveBeenCalledTimes(1);
  });

  it('calls onDateInputChange when native date picker changes value', async () => {
    const onDateInputChange = vi.fn();
    await renderHeader({
      selectedDate: '2026-09-02',
      onDateInputChange,
    });

    const dateInput = container.querySelector<HTMLInputElement>('[data-testid="monitoring-native-date-input"]');
    expect(dateInput).toBeTruthy();

    await act(async () => {
      if (dateInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(dateInput, '2026-09-15');
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(onDateInputChange).toHaveBeenCalled();
  });

  it('disables Refresh and Load All buttons when syncing or refreshing', async () => {
    await renderHeader({
      selectedDate: '2026-09-02',
      syncing18Routes: true,
      onSync18Routes: vi.fn(),
    });

    const refreshBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-refresh-btn"]');
    const loadAllBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-load-all-btn"]');

    expect(refreshBtn?.disabled).toBe(true);
    expect(loadAllBtn?.disabled).toBe(true);
    expect(loadAllBtn?.getAttribute('aria-label')).toBe(TEXT_MONITORING.INGESTION.BUTTON_LABEL);
  });

  it('renders control bar holding datepicker, refresh, and load all in a unified single row block', async () => {
    await renderHeader({
      selectedDate: '2026-09-02',
      onSync18Routes: vi.fn(),
    });

    const controlBar = container.querySelector<HTMLDivElement>('[data-testid="monitoring-control-bar"]');
    expect(controlBar).toBeTruthy();
    expect(controlBar?.querySelector('[data-testid="monitoring-date-picker-trigger"]')).toBeTruthy();
    expect(controlBar?.querySelector('[data-testid="monitoring-refresh-btn"]')).toBeTruthy();
    expect(controlBar?.querySelector('[data-testid="monitoring-load-all-btn"]')).toBeTruthy();
  });

  it('renders period container and displays range label when non-daily period is provided', async () => {
    const onPeriodChange = vi.fn();
    await renderHeader({
      selectedDate: '2026-10-14',
      currentPeriod: {
        mode: 'monthly',
        date: '2026-10-14',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        label: '2026-10-01 s.d. 2026-10-14',
      },
      onPeriodChange,
    });

    const periodContainer = container.querySelector('[data-testid="monitoring-period-container"]');
    expect(periodContainer).toBeTruthy();

    const dateTrigger = container.querySelector('[data-testid="monitoring-date-picker-trigger"]');
    expect(dateTrigger?.textContent).toContain('2026-10-01 s.d. 2026-10-14');

    // Step buttons should be hidden in non-daily mode
    expect(container.textContent).not.toContain('Kemarin');
  });

  it('triggers onSync18Routes when in daily mode and onOpenMonthlySyncModal when in non-daily mode', async () => {
    const onSync18Routes = vi.fn();
    const onOpenMonthlySyncModal = vi.fn();

    // 1. Daily mode
    await renderHeader({
      selectedDate: '2026-10-14',
      onSync18Routes,
      onOpenMonthlySyncModal,
      currentPeriod: {
        mode: 'daily',
        date: '2026-10-14',
        startDate: '2026-10-14',
        endDate: '2026-10-14',
        label: '2026-10-14',
      },
    });

    let syncBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-load-all-btn"]');
    expect(syncBtn?.getAttribute('aria-label')).toBe(TEXT_MONITORING.INGESTION.BUTTON_LABEL);
    expect(syncBtn?.title).toBe(TEXT_MONITORING.INGESTION.TOOLTIP);

    await act(async () => {
      syncBtn?.click();
    });
    expect(onSync18Routes).toHaveBeenCalledTimes(1);
    expect(onOpenMonthlySyncModal).not.toHaveBeenCalled();

    // 2. Monthly mode
    await renderHeader({
      selectedDate: '2026-10-14',
      onSync18Routes,
      onOpenMonthlySyncModal,
      currentPeriod: {
        mode: 'monthly',
        date: '2026-10-14',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        label: '2026-10-01 s.d. 2026-10-14',
      },
    });

    syncBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-load-all-btn"]');
    expect(syncBtn?.getAttribute('aria-label')).toBe(TEXT_MONITORING.MONTHLY_SYNC.BUTTON_LABEL_MONTHLY);
    expect(syncBtn?.title).toBe(TEXT_MONITORING.MONTHLY_SYNC.TOOLTIP_MONTHLY);

    await act(async () => {
      syncBtn?.click();
    });
    expect(onOpenMonthlySyncModal).toHaveBeenCalledTimes(1);
  });

  it('opens MonthPickerModal when date trigger is tapped in monthly mode', async () => {
    const onPeriodChange = vi.fn();
    await renderHeader({
      selectedDate: '2026-10-14',
      currentPeriod: {
        mode: 'monthly',
        date: '2026-10-14',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        label: '2026-10-01 s.d. 2026-10-14',
      },
      onPeriodChange,
    });

    const dateTrigger = container.querySelector<HTMLDivElement>('[data-testid="monitoring-date-picker-trigger"]');
    expect(dateTrigger).toBeTruthy();

    await act(async () => {
      dateTrigger?.click();
    });

    const monthModal = container.querySelector('[data-testid="month-picker-modal"]');
    expect(monthModal).toBeTruthy();
    expect(monthModal?.textContent).toContain(TEXT_MONITORING.PERIOD.MONTHLY_MODAL_TITLE);
  });

  it('navigates to previous month and updates period filter when step prev month button is clicked', async () => {
    const onPeriodChange = vi.fn();
    await renderHeader({
      selectedDate: '2026-10-14',
      currentPeriod: {
        mode: 'monthly',
        date: '2026-10-14',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        label: '2026-10-01 s.d. 2026-10-14',
      },
      onPeriodChange,
    });

    const prevMonthBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-step-prev-month"]');
    expect(prevMonthBtn).toBeTruthy();

    await act(async () => {
      prevMonthBtn?.click();
    });

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    const calledFilter = onPeriodChange.mock.calls[0][0];
    expect(calledFilter.mode).toBe('monthly');
    expect(calledFilter.startDate).toBe('2026-09-01');
    expect(calledFilter.endDate).toBe('2026-09-30');
    expect(calledFilter.label).toBe('2026-09-01 s.d. 2026-09-30');
  });

  it('renders profile button when onOpenProfile is provided and handles click', async () => {
    const onOpenProfile = vi.fn();
    await renderHeader({
      onOpenProfile,
    });

    const profileBtn = container.querySelector<HTMLElement>('[data-testid="user-profile-header-btn"]');
    expect(profileBtn).toBeTruthy();

    await act(async () => {
      profileBtn?.click();
    });

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it('does not render profile button when onOpenProfile is undefined', async () => {
    await renderHeader({
      onOpenProfile: undefined,
    });

    const profileBtn = container.querySelector('[data-testid="user-profile-header-btn"]');
    expect(profileBtn).toBeNull();
  });
});
