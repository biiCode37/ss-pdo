// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import {
  MonitoringMonthPickerModal,
  type MonitoringMonthPickerModalProps,
} from './MonitoringMonthPickerModal';
import { TEXT_MONITORING } from '@/constants/texts';
import type { MonitoringPeriodFilter } from '@/services/allRouteMonitoringService';

describe('MonitoringMonthPickerModal Component', () => {
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

  const currentPeriod: MonitoringPeriodFilter = {
    mode: 'monthly',
    date: '2026-10-14',
    startDate: '2026-10-01',
    endDate: '2026-10-14',
    label: '2026-10-01 s.d. 2026-10-14',
  };

  const renderModal = async (props?: Partial<MonitoringMonthPickerModalProps>) => {
    const defaultProps: MonitoringMonthPickerModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      currentPeriod,
      onSelectMonth: vi.fn(),
      referenceDate: '2026-10-14',
      ...props,
    };

    await act(async () => {
      root.render(<MonitoringMonthPickerModal {...defaultProps} />);
    });

    return defaultProps;
  };

  it('renders modal with title, year navigator, quick pills, and 12 month buttons', async () => {
    await renderModal();

    expect(container.querySelector('[data-testid="month-picker-modal"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="month-picker-modal-title"]')?.textContent).toContain(
      TEXT_MONITORING.PERIOD.MONTHLY_MODAL_TITLE
    );

    const yearDisplay = container.querySelector('[data-testid="month-picker-current-year"]');
    expect(yearDisplay?.textContent).toBe('2026');

    // 12 months buttons exist
    for (let i = 1; i <= 12; i++) {
      expect(container.querySelector(`[data-testid="month-btn-${i}"]`)).toBeTruthy();
    }

    // Quick pills
    expect(container.querySelector('[data-testid="quick-month-this"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="quick-month-prev"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="quick-month-prev2"]')).toBeTruthy();
  });

  it('steps year back and forward', async () => {
    await renderModal();

    const prevYearBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-picker-prev-year"]');
    const nextYearBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-picker-next-year"]');
    const yearDisplay = container.querySelector('[data-testid="month-picker-current-year"]');

    expect(yearDisplay?.textContent).toBe('2026');

    await act(async () => {
      prevYearBtn?.click();
    });
    expect(yearDisplay?.textContent).toBe('2025');

    await act(async () => {
      nextYearBtn?.click();
      nextYearBtn?.click();
    });
    expect(yearDisplay?.textContent).toBe('2027');
  });

  it('selects September and applies date range 2026-09-01 s.d. 2026-09-30', async () => {
    const onSelectMonth = vi.fn();
    const onClose = vi.fn();
    await renderModal({ onSelectMonth, onClose });

    // Select month 9 (September)
    const sepBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-btn-9"]');
    await act(async () => {
      sepBtn?.click();
    });

    const applyBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-picker-apply-btn"]');
    await act(async () => {
      applyBtn?.click();
    });

    expect(onSelectMonth).toHaveBeenCalledTimes(1);
    const calledFilter: MonitoringPeriodFilter = onSelectMonth.mock.calls[0][0];
    expect(calledFilter.mode).toBe('monthly');
    expect(calledFilter.startDate).toBe('2026-09-01');
    expect(calledFilter.endDate).toBe('2026-09-30');
    expect(calledFilter.label).toBe('September 2026');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses quick select pill for Bulan Lalu to apply directly', async () => {
    const onSelectMonth = vi.fn();
    const onClose = vi.fn();
    await renderModal({ onSelectMonth, onClose });

    const prevMonthPill = container.querySelector<HTMLButtonElement>('[data-testid="quick-month-prev"]');
    await act(async () => {
      prevMonthPill?.click();
    });

    expect(onSelectMonth).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button or cancel button is tapped', async () => {
    const onClose = vi.fn();
    await renderModal({ onClose });

    const closeBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-picker-close-btn"]');
    await act(async () => {
      closeBtn?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = container.querySelector<HTMLButtonElement>('[data-testid="month-picker-cancel-btn"]');
    await act(async () => {
      cancelBtn?.click();
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('returns null when isOpen is false', async () => {
    await renderModal({ isOpen: false });
    expect(container.querySelector('[data-testid="month-picker-modal"]')).toBeNull();
  });
});
