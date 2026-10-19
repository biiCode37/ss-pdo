// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusListControlBar } from './BusListControlBar';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('BusListControlBar Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps = {
    activeCategory: 'ALL',
    onCategoryChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    showOnlyUnfinished: false,
    onToggleUnfinished: vi.fn(),
    bulkPergi: '4',
    bulkPulang: '4',
    isSubmittingBulk: false,
    onOpenBulkTripModal: vi.fn(),
    availableKmS1Count: 5,
    skippedWithNotesCount: 2,
    onBulkCopyKmS1: vi.fn(),
  };

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
  });

  it('renders Set Trip button with trip count and category select dropdown', async () => {
    await act(async () => {
      root.render(<BusListControlBar {...defaultProps} />);
    });

    expect(container.textContent).toContain('Set Jumlah Trip (4/4)');
    expect(container.textContent).toContain('Filter');

    // Trigger category change
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    await act(async () => {
      select.value = 'trip';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('trip');
  });

  it('toggles filter mode and shows active state when showOnlyUnfinished is true', async () => {
    await act(async () => {
      root.render(<BusListControlBar {...defaultProps} showOnlyUnfinished={true} />);
    });

    expect(container.textContent).toContain('Sisa Unit');
    expect(container.querySelector('button svg')).not.toBeNull();
  });

  it('renders bulk copy KM contextual action when activeCategory is kmAwal2', async () => {
    await act(async () => {
      root.render(<BusListControlBar {...defaultProps} activeCategory="kmAwal2" />);
    });

    expect(container.textContent).toContain('5 unit');
    expect(container.textContent).toContain('siap disalin');
    expect(container.textContent).toContain('(2 berketerangan dilewati)');
  });
});
