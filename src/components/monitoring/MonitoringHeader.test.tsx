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

  it('renders title, back button, and formatted date label', async () => {
    const onBack = vi.fn();
    await renderHeader({
      selectedDate: '2026-09-02',
      onBackToRouteView: onBack,
    });

    expect(container.textContent).toContain(TEXT_MONITORING.HEADER.TITLE);
    expect(container.textContent).toContain('2 September 2026');

    const backBtn = container.querySelector<HTMLButtonElement>('[data-testid="monitoring-back-btn"]');
    expect(backBtn).toBeTruthy();
    await act(async () => {
      backBtn?.click();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
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
});
