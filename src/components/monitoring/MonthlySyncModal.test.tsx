// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { MonthlySyncModal, type MonthlySyncModalProps } from './MonthlySyncModal';
import * as monthlyService from '@/services/monthlyMasterIngestionService';
import { TEXT_MONITORING } from '@/constants/texts';

vi.mock('@/services/monthlyMasterIngestionService', async () => {
  const actual = await vi.importActual<any>('@/services/monthlyMasterIngestionService');
  return {
    ...actual,
    ingestMonthlyMasterSheet: vi.fn(),
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const setNativeInputValue = (input: HTMLInputElement, value: string) => {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('MonthlySyncModal', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps: MonthlySyncModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    currentYear: 2026,
    currentMonth: 10,
    monthName: 'Oktober',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderModal = async (props?: Partial<MonthlySyncModalProps>) => {
    await act(async () => {
      root.render(<MonthlySyncModal {...defaultProps} {...props} />);
    });
  };

  it('renders nothing when isOpen is false', async () => {
    await renderModal({ isOpen: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders modal with initial inputs and default tab name', async () => {
    await renderModal();

    expect(container.textContent).toContain(TEXT_MONITORING.MONTHLY_SYNC.TITLE);
    const tabInput = container.querySelector('#monthly-sync-tab-input') as HTMLInputElement;
    expect(tabInput).not.toBeNull();
    expect(tabInput.value).toBe('OKTOBER 2026');
  });

  it('loads saved URL from localStorage if available', async () => {
    localStorage.setItem('ss_pdo_master_sheet_url', 'https://docs.google.com/spreadsheets/d/my-saved-id/edit');
    await renderModal();

    const urlInput = container.querySelector('#monthly-sync-url-input') as HTMLInputElement;
    expect(urlInput).not.toBeNull();
    expect(urlInput.value).toBe('https://docs.google.com/spreadsheets/d/my-saved-id/edit');
  });

  it('shows error if URL is empty when submitted', async () => {
    await renderModal();

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain(TEXT_MONITORING.MONTHLY_SYNC.ERR_INVALID_URL);
    expect(monthlyService.ingestMonthlyMasterSheet).not.toHaveBeenCalled();
  });

  it('calls ingestMonthlyMasterSheet and triggers onSuccess on success', async () => {
    (monthlyService.ingestMonthlyMasterSheet as any).mockResolvedValueOnce({
      success: true,
      savedCount: 150,
      skippedCount: 10,
      errors: [],
    });

    await renderModal();

    const urlInput = container.querySelector('#monthly-sync-url-input') as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(
        urlInput,
        'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit'
      );
    });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(monthlyService.ingestMonthlyMasterSheet).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit',
      'OKTOBER 2026',
      2026,
      10,
      expect.any(Function)
    );

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(150, 10);
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(localStorage.getItem('ss_pdo_master_sheet_url')).toBe(
      'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit'
    );
  });

  it('displays error message when ingestion fails', async () => {
    (monthlyService.ingestMonthlyMasterSheet as any).mockResolvedValueOnce({
      success: false,
      savedCount: 0,
      skippedCount: 0,
      errors: ['Sheet tidak ditemukan'],
    });

    await renderModal();

    const urlInput = container.querySelector('#monthly-sync-url-input') as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(
        urlInput,
        'https://docs.google.com/spreadsheets/d/1DJUzeOvjNn170K0LTnJt3s_UWsazDfohyzmxfsdLsYs/edit'
      );
    });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(container.textContent).toContain('Sheet tidak ditemukan');
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('smartly detects past month (e.g. September) when typed into tab input and passes correct targetMonth', async () => {
    (monthlyService.ingestMonthlyMasterSheet as any).mockResolvedValueOnce({
      success: true,
      savedCount: 540,
      skippedCount: 0,
      errors: [],
    });

    await renderModal();

    const urlInput = container.querySelector('#monthly-sync-url-input') as HTMLInputElement;
    const tabInput = container.querySelector('#monthly-sync-tab-input') as HTMLInputElement;

    await act(async () => {
      setNativeInputValue(
        urlInput,
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit'
      );
      setNativeInputValue(tabInput, 'SEPTEMBER 2026');
    });

    // Badge info should dynamically update to 30 September 2026
    expect(container.textContent).toContain('30 September 2026');

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(monthlyService.ingestMonthlyMasterSheet).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
      'SEPTEMBER 2026',
      2026,
      9, // Target month is smartly 9 (September), NOT 10!
      expect.any(Function)
    );
  });

  it('sets tab name and resolves month when quick chip button is clicked', async () => {
    (monthlyService.ingestMonthlyMasterSheet as any).mockResolvedValueOnce({
      success: true,
      savedCount: 540,
      skippedCount: 0,
      errors: [],
    });

    await renderModal();

    const urlInput = container.querySelector('#monthly-sync-url-input') as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(
        urlInput,
        'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit'
      );
    });

    // Find quick chip for September 2026
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[type="button"]'));
    const septBtn = buttons.find((b) => b.textContent?.includes('September 2026'));
    expect(septBtn).toBeDefined();

    await act(async () => {
      septBtn?.click();
    });

    const tabInput = container.querySelector('#monthly-sync-tab-input') as HTMLInputElement;
    expect(tabInput.value).toBe('SEPTEMBER 2026');
    expect(container.textContent).toContain('30 September 2026');

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(monthlyService.ingestMonthlyMasterSheet).toHaveBeenCalledWith(
      'https://docs.google.com/spreadsheets/d/1Hkvs4DLGWGJMPHRlSV-5g72nL_zRHjkTuRuTyXwFYs4/edit',
      'SEPTEMBER 2026',
      2026,
      9,
      expect.any(Function)
    );
  });
});
