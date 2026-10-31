import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  DailyRoutePlotting,
  UnitPlottingItem,
  PlottingStartPoint,
  PlottingUnitStatus,
} from '@/types/supabase';
import type { BusData, HeaderMap } from '@/services/googleSheets';
import { extractEndpointNames } from '@/utils/routeEndpointUtils';
import {
  fetchDailyPlotting,
  saveDailyPlotting,
  generateRollingFromYesterday,
} from '@/services/dailyPlottingService';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import { PlottingHeader } from './PlottingHeader';
import { PlottingBaseTabs } from './PlottingBaseTabs';
import { PlottingUnitCard } from './PlottingUnitCard';
import { TargetRitaseModal } from './TargetRitaseModal';
import { showSuccessToast, showErrorToast } from '@/utils/alertUtils';

export interface DailyPlottingPageProps {
  routeId: number;
  routeCode: string;
  routeName?: string;
  date: string;
  buses: BusData[];
  headerMap?: HeaderMap;
  onPlottingChange?: (plotting: DailyRoutePlotting) => void;
}

/**
 * Normalizes unit ordering per base so each base (A and B) strictly has
 * sequential numbers 1..N without duplicates or gaps.
 */
export const normalizeBaseOrders = (items: UnitPlottingItem[]): UnitPlottingItem[] => {
  const unitsA = items
    .filter((u) => u.start_point === 'A')
    .sort((a, b) => a.order - b.order)
    .map((u, idx) => ({ ...u, order: idx + 1 }));

  const unitsB = items
    .filter((u) => u.start_point === 'B')
    .sort((a, b) => a.order - b.order)
    .map((u, idx) => ({ ...u, order: idx + 1 }));

  return [...unitsA, ...unitsB];
};

export const DailyPlottingPage: React.FC<DailyPlottingPageProps> = ({
  routeId,
  routeCode,
  routeName,
  date,
  buses,
  headerMap,
  onPlottingChange,
}) => {
  // 1. Endpoint names from Google Sheets composite headers or routeName fallback
  const { endpointA, endpointB } = useMemo(() => {
    return extractEndpointNames(
      headerMap?.tripPergiLabel,
      headerMap?.tripPulangLabel,
      routeName,
    );
  }, [headerMap?.tripPergiLabel, headerMap?.tripPulangLabel, routeName]);

  // 2. State
  const [unitsData, setUnitsData] = useState<UnitPlottingItem[]>([]);
  const [activeBase, setActiveBase] = useState<PlottingStartPoint>('A');
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [draggedUnit, setDraggedUnit] = useState<string | null>(null);

  // Modal State untuk Pengatur Target Ritase Fleksibel
  const [targetModal, setTargetModal] = useState<{
    isOpen: boolean;
    unit?: string;
    initialValue: number;
  }>({
    isOpen: false,
    initialValue: 7.5,
  });

  // 3. Inisialisasi Data Plotting dari Supabase / LocalStorage / Fallback dari BusData
  useEffect(() => {
    let isMounted = true;

    async function loadPlotting() {
      try {
        const existing = await fetchDailyPlotting(routeId, date);
        if (existing && existing.units_data && existing.units_data.length > 0 && isMounted) {
          setUnitsData(normalizeBaseOrders(existing.units_data));
          onPlottingChange?.(existing);
          return;
        }

        // Fallback: Inisialisasi dari daftar buses jika belum ada data plotting
        if (buses && buses.length > 0 && isMounted) {
          const half = Math.ceil(buses.length / 2);
          const initialItems: UnitPlottingItem[] = buses.map((b, idx) => {
            const startPoint: PlottingStartPoint = idx < half ? 'A' : 'B';
            const isOff =
              b.keterangan &&
              /(\bOFF\b|\bMOGOK\b|\bRUSAK\b|\bBENGKEL\b|\bLAKA\b)/i.test(b.keterangan);
            const status: PlottingUnitStatus = isOff ? 'OFF' : 'READY';

            return {
              unit: b.unit,
              order: idx < half ? idx + 1 : idx - half + 1,
              start_point: startPoint,
              target_ritase: 7.5,
              status,
              note: b.keterangan || undefined,
            };
          });

          setUnitsData(normalizeBaseOrders(initialItems));
        }
      } catch (err) {
        console.warn('[DailyPlottingPage] Gagal memuat data plotting:', err);
      }
    }

    loadPlotting();

    return () => {
      isMounted = false;
    };
  }, [routeId, date, buses, onPlottingChange]);

  // Hitung jumlah pangkalan & kesiapan
  const { countA, countB, readyUnits, troubleUnits } = useMemo(() => {
    let cA = 0;
    let cB = 0;
    let ready = 0;
    let trouble = 0;

    unitsData.forEach((u) => {
      if (u.start_point === 'A') cA++;
      else cB++;

      if (u.status === 'READY') ready++;
      else trouble++;
    });

    return {
      countA: cA,
      countB: cB,
      readyUnits: ready,
      troubleUnits: trouble,
    };
  }, [unitsData]);

  // Target ritase default yang paling banyak digunakan untuk rute ini
  const defaultTargetRitase = useMemo(() => {
    if (unitsData.length === 0) return 7.5;
    const counts: Record<number, number> = {};
    unitsData.forEach((u) => {
      counts[u.target_ritase] = (counts[u.target_ritase] || 0) + 1;
    });
    let maxCount = 0;
    let topTarget = 7.5;
    Object.entries(counts).forEach(([rit, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topTarget = Number(rit);
      }
    });
    return topTarget;
  }, [unitsData]);

  // Filter unit yang ditampilkan berdasarkan tab pangkalan aktif
  const currentBaseUnits = useMemo(() => {
    return unitsData
      .filter((u) => u.start_point === activeBase)
      .sort((a, b) => a.order - b.order);
  }, [unitsData, activeBase]);

  // Handler: Toggle Reordering Mode (Safety barrier)
  const handleToggleReordering = useCallback(() => {
    setIsReordering((prev) => !prev);
    setSelectedUnits(new Set());
  }, []);

  // Handler: Toggle Select Unit untuk Multi-Select
  const handleToggleSelect = useCallback((unit: string) => {
    setSelectedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unit)) next.delete(unit);
      else next.add(unit);
      return next;
    });
  }, []);

  // Handler: Tetapkan Titik Start untuk Unit Terpilih SAJA (Tanpa mengubah unit lain)
  const handleAssignStartPoint = useCallback(
    (targetPoint: PlottingStartPoint) => {
      if (selectedUnits.size === 0) return;

      const targetBaseName = targetPoint === 'A' ? endpointA : endpointB;

      setUnitsData((prev) => {
        // Hanya pindahkan unit-unit yang dipilih ke targetPoint, letakkan di urutan belakang
        const updated = prev.map((item) => {
          if (selectedUnits.has(item.unit)) {
            return {
              ...item,
              start_point: targetPoint,
              order: 999999 + item.order,
            };
          }
          return item;
        });

        return normalizeBaseOrders(updated);
      });

      showSuccessToast(TEXT_PLOTTING.TOASTS.START_ASSIGNED(targetBaseName, selectedUnits.size));
      setSelectedUnits(new Set());
    },
    [selectedUnits, endpointA, endpointB],
  );

  // Handler: Single-Tap Toggle Titik Start per Kartu (Pindah ke pangkalan seberang di urutan akhir)
  const handleToggleStartPoint = useCallback((unit: string) => {
    setUnitsData((prev) => {
      const target = prev.find((u) => u.unit === unit);
      if (!target) return prev;
      const nextPoint: PlottingStartPoint = target.start_point === 'A' ? 'B' : 'A';

      const updated = prev.map((u) => {
        if (u.unit === unit) {
          return {
            ...u,
            start_point: nextPoint,
            order: 999999,
          };
        }
        return u;
      });

      return normalizeBaseOrders(updated);
    });
  }, []);

  // Handler: Geser Unit ke Urutan Paling Bawah (Quick Move To Bottom)
  const handleMoveToBottom = useCallback((unit: string) => {
    setUnitsData((prev) => {
      const targetUnit = prev.find((u) => u.unit === unit);
      if (!targetUnit) return prev;

      const updated = prev.map((u) => {
        if (u.unit === unit) {
          return { ...u, order: 999999 };
        }
        return u;
      });

      return normalizeBaseOrders(updated);
    });
  }, []);

  // Handler: Rolling Otomatis (Memutar unit #1 kemarin ke urutan terakhir pangkalan)
  const handleApplyRolling = useCallback(() => {
    setUnitsData((prev) => normalizeBaseOrders(generateRollingFromYesterday(prev)));
    showSuccessToast(TEXT_PLOTTING.TOASTS.ROLLING_APPLIED);
  }, []);

  // Handler: Update Target Ritase per Unit secara langsung (dari Stepper)
  const handleUpdateTargetRitase = useCallback((unit: string, target_ritase: number) => {
    setUnitsData((prev) =>
      prev.map((u) => (u.unit === unit ? { ...u, target_ritase } : u)),
    );
  }, []);

  // Handler: Buka Modal Pengatur Ritase Fleksibel
  const handleOpenUnitTargetModal = useCallback((unit: string, currentRitase: number) => {
    setTargetModal({
      isOpen: true,
      unit,
      initialValue: currentRitase,
    });
  }, []);

  const handleOpenHeaderTargetModal = useCallback(() => {
    setTargetModal({
      isOpen: true,
      unit: undefined,
      initialValue: defaultTargetRitase,
    });
  }, [defaultTargetRitase]);

  // Handler: Terapkan Target Ritase dari Modal (Unit / Pangkalan / Semua)
  const handleApplyTargetRitase = useCallback(
    (val: number, scope: 'unit' | 'base' | 'all') => {
      setUnitsData((prev) => {
        if (scope === 'unit' && targetModal.unit) {
          return prev.map((u) => (u.unit === targetModal.unit ? { ...u, target_ritase: val } : u));
        }
        if (scope === 'base') {
          return prev.map((u) => (u.start_point === activeBase ? { ...u, target_ritase: val } : u));
        }
        if (scope === 'all') {
          return prev.map((u) => ({ ...u, target_ritase: val }));
        }
        return prev;
      });

      if (scope === 'unit' && targetModal.unit) {
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(val, targetModal.unit));
      } else if (scope === 'base') {
        const baseName = activeBase === 'A' ? endpointA : endpointB;
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(val, `Pangkalan ${baseName}`));
      } else {
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(val, 'Semua Unit'));
      }

      setTargetModal((prev) => ({ ...prev, isOpen: false }));
    },
    [targetModal.unit, activeBase, endpointA, endpointB],
  );

  // Handler: Update Status Kesiapan Unit
  const handleUpdateStatus = useCallback((unit: string, status: PlottingUnitStatus) => {
    setUnitsData((prev) =>
      prev.map((u) => (u.unit === unit ? { ...u, status } : u)),
    );
  }, []);

  // Handler: Drag and Drop Reordering
  const handleDragStart = useCallback((_e: React.DragEvent, unit: string) => {
    setDraggedUnit(unit);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, targetUnit: string) => {
      if (!draggedUnit || draggedUnit === targetUnit) return;

      setUnitsData((prev) => {
        const sourceItem = prev.find((u) => u.unit === draggedUnit);
        const targetItem = prev.find((u) => u.unit === targetUnit);

        if (!sourceItem || !targetItem || sourceItem.start_point !== targetItem.start_point) {
          return prev;
        }

        const point = sourceItem.start_point;
        const currentList = prev
          .filter((u) => u.start_point === point)
          .sort((a, b) => a.order - b.order);

        const fromIndex = currentList.findIndex((u) => u.unit === draggedUnit);
        const toIndex = currentList.findIndex((u) => u.unit === targetUnit);

        const updatedList = [...currentList];
        const [moved] = updatedList.splice(fromIndex, 1);
        updatedList.splice(toIndex, 0, moved);

        const reindexed = updatedList.map((u, idx) => ({
          ...u,
          order: idx + 1,
        }));

        const otherList = prev.filter((u) => u.start_point !== point);
        return [...reindexed, ...otherList];
      });

      setDraggedUnit(null);
    },
    [draggedUnit],
  );

  // Handler: Simpan Plotting Harian
  const handleSavePlotting = useCallback(async () => {
    try {
      setIsSaving(true);
      const payload = {
        route_id: routeId,
        route_code: routeCode,
        date,
        endpoint_a_name: endpointA,
        endpoint_b_name: endpointB,
        units_data: unitsData,
      };

      const saved = await saveDailyPlotting(payload);
      onPlottingChange?.(saved);
      setIsReordering(false);
      setSelectedUnits(new Set());
      showSuccessToast(TEXT_PLOTTING.TOASTS.SAVE_SUCCESS);
    } catch (err) {
      console.warn('[DailyPlottingPage] Gagal menyimpan plotting:', err);
      showErrorToast(TEXT_PLOTTING.TOASTS.SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }, [routeId, routeCode, date, endpointA, endpointB, unitsData, onPlottingChange]);

  return (
    <div
      style={{
        padding: '16px 16px calc(140px + env(safe-area-inset-bottom, 0px)) 16px',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* 1. Header Ringkasan Kesiapan Subuh & Target Ritase Rute */}
      <PlottingHeader
        routeCode={routeCode}
        date={date}
        endpointAName={endpointA}
        endpointBName={endpointB}
        totalUnits={unitsData.length}
        readyUnits={readyUnits}
        troubleUnits={troubleUnits}
        countA={countA}
        countB={countB}
        defaultTargetRitase={defaultTargetRitase}
        isReordering={isReordering}
        isSaving={isSaving}
        onToggleReordering={handleToggleReordering}
        onApplyRolling={handleApplyRolling}
        onOpenTargetModal={handleOpenHeaderTargetModal}
        onSave={handleSavePlotting}
      />

      {/* 2. Dual Base Tabs (Pilihan Pangkalan Start Priok vs IGI) */}
      <PlottingBaseTabs
        activePoint={activeBase}
        onSelectPoint={setActiveBase}
        endpointAName={endpointA}
        endpointBName={endpointB}
        countA={countA}
        countB={countB}
      />

      {/* 3. Daftar Kartu Unit Berurutan */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {currentBaseUnits.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              background: 'var(--color-surface-raised, rgba(30, 41, 59, 0.4))',
              borderRadius: '14px',
              border: '1px dashed var(--color-border-subtle, rgba(255, 255, 255, 0.1))',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontSize: '0.88rem',
            }}
          >
            {TEXT_PLOTTING.EMPTY.NO_UNITS}
          </div>
        ) : (
          currentBaseUnits.map((item) => (
            <PlottingUnitCard
              key={item.unit}
              item={item}
              endpointAName={endpointA}
              endpointBName={endpointB}
              isReordering={isReordering}
              isSelectedForMultiSelect={selectedUnits.has(item.unit)}
              onToggleSelect={handleToggleSelect}
              onMoveToBottom={handleMoveToBottom}
              onToggleStartPoint={handleToggleStartPoint}
              onUpdateTargetRitase={handleUpdateTargetRitase}
              onOpenTargetModal={handleOpenUnitTargetModal}
              onUpdateStatus={handleUpdateStatus}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* 4. Floating Multi-Select Bottom Bar (Hanya tampil jika ada unit yang dipilih) */}
      {isReordering && selectedUnits.size > 0 && (
        <div
          data-testid="multi-select-action-bar"
          style={{
            position: 'fixed',
            bottom: 'calc(82px + env(safe-area-inset-bottom, 0px))',
            left: '16px',
            right: '16px',
            maxWidth: '688px',
            margin: '0 auto',
            background: 'var(--color-surface-raised, #1e293b)',
            border: '1px solid var(--color-action-primary-bg, #0284c7)',
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 99,
            animation: 'fadeInUp 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.MULTI_SELECT_INFO(selectedUnits.size)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleAssignStartPoint('A')}
              data-testid="btn-assign-start-a"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                background: 'var(--color-action-primary-bg, #0284c7)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.ASSIGN_START_POINT(endpointA)}
            </button>

            <button
              type="button"
              onClick={() => handleAssignStartPoint('B')}
              data-testid="btn-assign-start-b"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                background: 'var(--color-accent-amber, #d97706)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.ASSIGN_START_POINT(endpointB)}
            </button>

            <button
              type="button"
              onClick={() => setSelectedUnits(new Set())}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.2))',
                background: 'transparent',
                color: 'var(--color-text-secondary, #94a3b8)',
                cursor: 'pointer',
              }}
            >
              {TEXT_COMMON.BUTTONS.CANCEL}
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Pengatur Target Ritase Fleksibel & Bebas */}
      <TargetRitaseModal
        isOpen={targetModal.isOpen}
        initialValue={targetModal.initialValue}
        targetUnit={targetModal.unit}
        endpointName={activeBase === 'A' ? endpointA : endpointB}
        onClose={() => setTargetModal((prev) => ({ ...prev, isOpen: false }))}
        onApply={handleApplyTargetRitase}
      />
    </div>
  );
};

export default DailyPlottingPage;
