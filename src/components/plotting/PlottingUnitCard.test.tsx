// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlottingUnitCard } from './PlottingUnitCard';
import type { UnitPlottingItem } from '@/types/supabase';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('PlottingUnitCard Component', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockItemReady: UnitPlottingItem = {
    unit: 'KWK 222153',
    order: 1,
    start_point: 'A',
    target_ritase: 7.5,
    status: 'READY',
  };

  const mockItemTrouble: UnitPlottingItem = {
    unit: 'KWK 222154',
    order: 2,
    start_point: 'B',
    target_ritase: 8,
    status: 'TROUBLE',
    keterangan: 'AC Kurang Dingin - Kompresor',
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

  it('merender identitas unit secara lengkap dan tidak terpotong', () => {
    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    // Verifikasi nama unit lengkap dan badge urutan
    expect(container.textContent).toContain('KWK 222153');
    const orderBadge = container.querySelector('[data-testid="badge-order-KWK 222153"]');
    expect(orderBadge?.textContent?.trim()).toBe('1');

    // Verifikasi status pill ringkas
    const statusBtn = container.querySelector('[data-testid="btn-status-KWK 222153"]');
    expect(statusBtn?.textContent).toContain('Siap');

    // Verifikasi pangkalan start
    const baseBtn = container.querySelector('[data-testid="btn-toggle-base-KWK 222153"]');
    expect(baseBtn?.textContent).toContain('Priok');

    // Verifikasi target ritase
    const ritaseBtn = container.querySelector('[data-testid="btn-ritase-modal-KWK 222153"]');
    expect(ritaseBtn?.textContent).toContain('7.5 Rit');
  });

  it('merender sub-baris keterangan untuk unit berstatus TROUBLE tanpa merusak status pill', () => {
    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemTrouble}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    // Status pill tetap ringkas "Kendala"
    const statusBtn = container.querySelector('[data-testid="btn-status-KWK 222154"]');
    expect(statusBtn?.textContent).toContain('Kendala');

    // Catatan kendala tampil jelas pada sub-baris
    expect(container.textContent).toContain('AC Kurang Dingin - Kompresor');
  });

  it('menampilkan tombol panah reorder saat isReordering aktif', () => {
    const handleMoveUp = vi.fn();
    const handleMoveDown = vi.fn();

    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={true}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    const btnUp = container.querySelector('[data-testid="btn-move-up-KWK 222153"]') as HTMLButtonElement;
    const btnDown = container.querySelector('[data-testid="btn-move-down-KWK 222153"]') as HTMLButtonElement;
    expect(btnUp).not.toBeNull();
    expect(btnDown).not.toBeNull();

    act(() => {
      btnUp.click();
    });
    expect(handleMoveUp).toHaveBeenCalledWith('KWK 222153');

    act(() => {
      btnDown.click();
    });
    expect(handleMoveDown).toHaveBeenCalledWith('KWK 222153');
  });

  it('mengubah ritase dengan tombol stepper plus dan minus', () => {
    const handleUpdateTargetRitase = vi.fn();

    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={handleUpdateTargetRitase}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    const minusBtn = container.querySelector('button[aria-label="Kurang 0.5 ritase"]') as HTMLButtonElement;
    const plusBtn = container.querySelector('button[aria-label="Tambah 0.5 ritase"]') as HTMLButtonElement;

    act(() => {
      minusBtn.click();
    });
    expect(handleUpdateTargetRitase).toHaveBeenCalledWith('KWK 222153', 7);

    act(() => {
      plusBtn.click();
    });
    expect(handleUpdateTargetRitase).toHaveBeenCalledWith('KWK 222153', 8);
  });

  it('tidak menampilkan lingkaran checkbox idle saat unit tidak terpilih', () => {
    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    // Lingkaran checkbox idle tidak boleh ada
    expect(container.querySelector('.lucide-circle')).toBeNull();
    const selectBtn = container.querySelector('[data-testid="btn-select-KWK 222153"]');
    expect(selectBtn?.querySelector('svg')).toBeNull();
  });

  it('menampilkan centang mini halus ketika unit terpilih', () => {
    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={true}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    const selectBtn = container.querySelector('[data-testid="btn-select-KWK 222153"]');
    const checkmark = selectBtn?.querySelector('svg');
    expect(checkmark).not.toBeNull();
    expect(checkmark?.classList.contains('lucide-circle-check')).toBe(true);
    expect(checkmark?.getAttribute('width')).toBe('15');
    expect(checkmark?.getAttribute('height')).toBe('15');
  });

  it('memicu onToggleSelect saat bodi kartu diklik', () => {
    const handleToggleSelect = vi.fn();

    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={handleToggleSelect}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    const card = container.querySelector('[data-testid="plotting-card-KWK 222153"]') as HTMLDivElement;
    expect(card).not.toBeNull();

    act(() => {
      card.click();
    });
    expect(handleToggleSelect).toHaveBeenCalledWith('KWK 222153');
  });

  it('memicu onOpenOrderModal saat badge urutan diklik dan tidak memicu onToggleSelect', () => {
    const handleToggleSelect = vi.fn();
    const handleOpenOrderModal = vi.fn();

    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={false}
          isSelectedForMultiSelect={false}
          onToggleSelect={handleToggleSelect}
          onOpenOrderModal={handleOpenOrderModal}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    const orderBadge = container.querySelector('[data-testid="badge-order-KWK 222153"]') as HTMLElement;
    expect(orderBadge).not.toBeNull();
    expect(orderBadge.title).toBe('Klik untuk mengatur posisi urutan unit ini');

    act(() => {
      orderBadge.click();
    });
    expect(handleOpenOrderModal).toHaveBeenCalledWith('KWK 222153');
    expect(handleToggleSelect).not.toHaveBeenCalled();
  });

  it('tidak merender drag handle GripVertical meskipun isReordering aktif', () => {
    act(() => {
      root.render(
        <PlottingUnitCard
          item={mockItemReady}
          endpointAName="Priok"
          endpointBName="IGI"
          isReordering={true}
          isSelectedForMultiSelect={false}
          onToggleSelect={vi.fn()}
          onToggleStartPoint={vi.fn()}
          onUpdateTargetRitase={vi.fn()}
          onUpdateStatus={vi.fn()}
        />,
      );
    });

    expect(container.querySelector('.lucide-grip-vertical')).toBeNull();
  });
});
