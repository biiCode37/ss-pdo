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
import { showSuccessToast, showErrorToast } from '@/utils/alertUtils';

export interface DailyPlottingPageProps {
  routeId: number;
  routeCode: string;
  date: string;
  buses: BusData[];
  headerMap?: HeaderMap;
  onPlottingChange?: (plotting: DailyRoutePlotting) => void;
}

export const DailyPlottingPage: React.FC<DailyPlottingPageProps> = ({
  routeId,
  routeCode,
  date,
  buses,
  headerMap,
  onPlottingChange,
}) => {
  // 1. Endpoint names from Google Sheets composite headers
  const { endpointA, endpointB } = useMemo(() => {
    return extractEndpointNames(headerMap?.tripPergiLabel, headerMap?.tripPulangLabel);
  }, [headerMap?.tripPergiLabel, headerMap?.tripPulangLabel]);

  // 2. State
  const [unitsData, setUnitsData] = useState<UnitPlottingItem[]>([]);
  const [activeBase, setActiveBase] = useState<PlottingStartPoint>('A');
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [draggedUnit, setDraggedUnit] = useState<string | null>(null);

  // 3. Inisialisasi Data Plotting dari Supabase / LocalStorage / Fallback dari BusData
  useEffect(() => {
    let isMounted = true;

    async function loadPlotting() {
      try {
        const existing = await fetchDailyPlotting(routeId, date);
        if (existing && existing.units_data && existing.units_data.length > 0 && isMounted) {
          setUnitsData(existing.units_data);
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

          setUnitsData(initialItems);
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

  // Handler: Tetapkan Titik Start Komplementer (Ide Utama: Pilih A, sisanya otomatis B)
  const handleAssignStartPoint = useCallback(
    (targetPoint: PlottingStartPoint) => {
      if (selectedUnits.size === 0) return;

      const oppositePoint: PlottingStartPoint = targetPoint === 'A' ? 'B' : 'A';
      const targetBaseName = targetPoint === 'A' ? endpointA : endpointB;

      setUnitsData((prev) => {
        let orderTarget = 1;
        let orderOpposite = 1;

        return prev.map((item) => {
          if (selectedUnits.has(item.unit)) {
            const updated: UnitPlottingItem = {
              ...item,
              start_point: targetPoint,
              order: orderTarget++,
            };
            return updated;
          } else {
            const updated: UnitPlottingItem = {
              ...item,
              start_point: oppositePoint,
              order: orderOpposite++,
            };
            return updated;
          }
        });
      });

      showSuccessToast(TEXT_PLOTTING.TOASTS.START_ASSIGNED(targetBaseName, selectedUnits.size));
      setSelectedUnits(new Set());
    },
    [selectedUnits, endpointA, endpointB],
  );

  // Handler: Single-Tap Toggle Titik Start per Kartu
  const handleToggleStartPoint = useCallback((unit: string) => {
    setUnitsData((prev) => {
      return prev.map((u) => {
        if (u.unit === unit) {
          const nextPoint: PlottingStartPoint = u.start_point === 'A' ? 'B' : 'A';
          return {
            ...u,
            start_point: nextPoint,
          };
        }
        return u;
      });
    });
  }, []);

  // Handler: Geser Unit ke Urutan Paling Bawah (Quick Move To Bottom)
  const handleMoveToBottom = useCallback((unit: string) => {
    setUnitsData((prev) => {
      const targetUnit = prev.find((u) => u.unit === unit);
      if (!targetUnit) return prev;

      const currentPoint = targetUnit.start_point;
      const pointUnits = prev
        .filter((u) => u.start_point === currentPoint && u.unit !== unit)
        .sort((a, b) => a.order - b.order);

      // Re-index remaining units (naik 1 tingkat)
      const reindexed = pointUnits.map((u, idx) => ({
        ...u,
        order: idx + 1,
      }));

      // Taruh target unit di urutan terakhir
      reindexed.push({
        ...targetUnit,
        order: reindexed.length + 1,
      });

      // Gabungkan kembali dengan unit pangkalan seberang
      const otherUnits = prev.filter((u) => u.start_point !== currentPoint);
      return [...reindexed, ...otherUnits];
    });
  }, []);

  // Handler: Rolling Otomatis (Memutar unit #1 ke urutan terakhir pangkalan)
  const handleApplyRolling = useCallback(() => {
    setUnitsData((prev) => generateRollingFromYesterday(prev));
    showSuccessToast(TEXT_PLOTTING.TOASTS.ROLLING_APPLIED);
  }, []);

  // Handler: Update Target Ritase per Unit
  const handleUpdateTargetRitase = useCallback((unit: string, target_ritase: number) => {
    setUnitsData((prev) =>
      prev.map((u) => (u.unit === unit ? { ...u, target_ritase } : u)),
    );
  }, []);

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
        padding: '16px 16px calc(80px + env(safe-area-inset-bottom, 0px)) 16px',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* 1. Header Ringkasan Kesiapan Subuh */}
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
        isReordering={isReordering}
        isSaving={isSaving}
        onToggleReordering={handleToggleReordering}
        onApplyRolling={handleApplyRolling}
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
            bottom: '72px',
            left: '16px',
            right: '16px',
            maxWidth: '688px',
            margin: '0 auto',
            background: 'var(--color-surface-raised, #1e293b)',
            border: '1px solid var(--color-action-primary-bg, #0284c7)',
            borderRadius: '14px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
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
    </div>
  );
};

export default DailyPlottingPage;
