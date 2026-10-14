// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import {
  MonitoringPeriodSelector,
  type MonitoringPeriodSelectorProps,
} from '@/components/monitoring/MonitoringPeriodSelector';
import { TEXT_MONITORING } from '@/constants/texts';
import type { MonitoringPeriodFilter } from '@/services/allRouteMonitoringService';

describe('MonitoringPeriodSelector Component', () => {
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

  const renderSelector = async (props?: Partial<MonitoringPeriodSelectorProps>) => {
    const currentPeriod: MonitoringPeriodFilter = {
      mode: 'daily',
      date: '2026-10-14',
      startDate: '2026-10-14',
      endDate: '2026-10-14',
      label: 'Rabu, 14 Oktober 2026',
    };

    const defaultProps: MonitoringPeriodSelectorProps = {
      currentPeriod,
      onPeriodChange: vi.fn(),
      loading: false,
      ...props,
    };

    await act(async () => {
      root.render(<MonitoringPeriodSelector {...defaultProps} />);
    });

    return defaultProps;
  };

  it('renders all 4 period capsules with active daily state', async () => {
    await renderSelector();

    const dailyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-daily"]');
    const weeklyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-weekly"]');
    const monthlyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-monthly"]');
    const customBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-custom"]');

    expect(dailyBtn).toBeTruthy();
    expect(weeklyBtn).toBeTruthy();
    expect(monthlyBtn).toBeTruthy();
    expect(customBtn).toBeTruthy();

    expect(dailyBtn?.textContent).toContain(TEXT_MONITORING.PERIOD.DAILY);
    expect(weeklyBtn?.textContent).toContain(TEXT_MONITORING.PERIOD.WEEKLY);
    expect(monthlyBtn?.textContent).toContain(TEXT_MONITORING.PERIOD.MONTHLY);
    expect(customBtn?.textContent).toContain(TEXT_MONITORING.PERIOD.CUSTOM);

    expect(dailyBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(weeklyBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onPeriodChange with weekly range when weekly capsule is tapped', async () => {
    const onPeriodChange = vi.fn();
    await renderSelector({ onPeriodChange });

    const weeklyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-weekly"]');
    await act(async () => {
      weeklyBtn?.click();
    });

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    const calledFilter: MonitoringPeriodFilter = onPeriodChange.mock.calls[0][0];
    expect(calledFilter.mode).toBe('weekly');
    expect(calledFilter.endDate).toBe('2026-10-14');
    expect(calledFilter.startDate).toBe('2026-10-08');
  });

  it('calls onPeriodChange with monthly range when monthly capsule is tapped', async () => {
    const onPeriodChange = vi.fn();
    await renderSelector({ onPeriodChange });

    const monthlyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-monthly"]');
    await act(async () => {
      monthlyBtn?.click();
    });

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    const calledFilter: MonitoringPeriodFilter = onPeriodChange.mock.calls[0][0];
    expect(calledFilter.mode).toBe('monthly');
    expect(calledFilter.startDate).toBe('2026-10-01');
    expect(calledFilter.endDate).toBe('2026-10-14');
  });

  it('opens MonthPickerModal when monthly capsule is tapped while already in monthly mode', async () => {
    const onPeriodChange = vi.fn();
    await renderSelector({
      currentPeriod: {
        mode: 'monthly',
        date: '2026-10-14',
        startDate: '2026-10-01',
        endDate: '2026-10-14',
        label: '2026-10-01 s.d. 2026-10-14',
      },
      onPeriodChange,
    });

    const monthlyBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-monthly"]');
    await act(async () => {
      monthlyBtn?.click();
    });

    const monthModal = container.querySelector('[data-testid="month-picker-modal"]');
    expect(monthModal).toBeTruthy();
    expect(monthModal?.textContent).toContain(TEXT_MONITORING.PERIOD.MONTHLY_MODAL_TITLE);
  });

  it('opens custom modal when custom button is clicked and applies date range', async () => {
    const onPeriodChange = vi.fn();
    await renderSelector({ onPeriodChange });

    const customBtn = container.querySelector<HTMLButtonElement>('[data-testid="period-btn-custom"]');
    await act(async () => {
      customBtn?.click();
    });

    const modalTitle = container.querySelector('[data-testid="custom-period-modal-title"]');
    expect(modalTitle?.textContent).toContain(TEXT_MONITORING.PERIOD.CUSTOM_MODAL_TITLE);

    const startInput = container.querySelector<HTMLInputElement>('[data-testid="custom-start-date"]');
    const endInput = container.querySelector<HTMLInputElement>('[data-testid="custom-end-date"]');
    const applyBtn = container.querySelector<HTMLButtonElement>('[data-testid="custom-apply-btn"]');

    expect(startInput).toBeTruthy();
    expect(endInput).toBeTruthy();
    expect(applyBtn).toBeTruthy();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (startInput) {
        setter?.call(startInput, '2026-10-05');
        startInput.dispatchEvent(new Event('input', { bubbles: true }));
        startInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (endInput) {
        setter?.call(endInput, '2026-10-12');
        endInput.dispatchEvent(new Event('input', { bubbles: true }));
        endInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await act(async () => {
      applyBtn?.click();
    });

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    const calledFilter: MonitoringPeriodFilter = onPeriodChange.mock.calls[0][0];
    expect(calledFilter.mode).toBe('custom');
    expect(calledFilter.startDate).toBe('2026-10-05');
    expect(calledFilter.endDate).toBe('2026-10-12');
  });
});
