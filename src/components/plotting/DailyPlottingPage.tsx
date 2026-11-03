import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  DailyRoutePlotting,
  UnitPlottingItem,
  PlottingStartPoint,
  PlottingUnitStatus,
} from '@/types/supabase';
import type { BusData, HeaderMap } from '@/services/googleSheets';
import { updateBulkBusData } from '@/services/googleSheets';
import { extractEndpointNames } from '@/utils/routeEndpointUtils';
import {
  fetchDailyPlotting,
  saveDailyPlotting,
  generateRollingFromYesterday,
} from '@/services/dailyPlottingService';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import { isUnitOffOrToEvdal, normalizeKeterangan } from '@/utils/keteranganUtils';
import { parseIndonesianNumber } from '@/utils/numberUtils';
import { PlottingHeader } from './PlottingHeader';
import { PlottingBaseTabs } from './PlottingBaseTabs';
import { PlottingUnitCard } from './PlottingUnitCard';
import { TargetRitaseModal } from './TargetRitaseModal';
import { PlottingTroubleModal } from './PlottingTroubleModal';
import { showSuccessToast, showErrorToast } from '@/utils/alertUtils';
import { Zap } from 'lucide-react';

export interface DailyPlottingPageProps {
  routeId: number;
  routeCode: string;
  routeName?: string;
  date: string;
  buses: BusData[];
  headerMap?: HeaderMap;
  onPlottingChange?: (plotting: DailyRoutePlotting) => void;
  sheetId?: string;
  tabName?: string;
  addToQueue?: (item: any) => void;
  onUpdateBus?: (rowIndex: number, updates: Partial<BusData>) => void;
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
  sheetId,
  tabName,
  addToQueue,
  onUpdateBus,
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

  // BUG-195-02: Isolasi referensi buses & flag dirty untuk mencegah over-fetch & desinkronisasi
  const busesRef = useRef(buses);
  busesRef.current = buses;
  const isDirtyRef = useRef(false);

  // Modal State untuk Pengatur Target Ritase Fleksibel
  const [targetModal, setTargetModal] = useState<{
    isOpen: boolean;
    unit?: string;
    initialValue: number;
    selectedCount?: number;
  }>({
    isOpen: false,
    initialValue: 7.5,
  });

  // Modal State untuk Pengatur Kendala Terpadu
  const [troubleModal, setTroubleModal] = useState<{
    isOpen: boolean;
    unit: string;
    status: PlottingUnitStatus;
    keterangan?: string;
    note?: string;
  }>({
    isOpen: false,
    unit: '',
    status: 'READY',
  });

  // Helper: Auto-read & sinkronisasi nilai aktual dari Google Sheets (SSOT)
  const integrateSheetValues = useCallback(
    (items: UnitPlottingItem[]): UnitPlottingItem[] => {
      const currentBuses = busesRef.current;
      if (!currentBuses || currentBuses.length === 0) return items;
      const busMap = new Map<string, BusData>();
      currentBuses.forEach((b) => {
        if (b.unit) busMap.set(b.unit.trim().toUpperCase(), b);
      });

      return items.map((item) => {
        const bus = busMap.get(item.unit.trim().toUpperCase());
        if (!bus) return item;

        let target_ritase = item.target_ritase;
        let status = item.status;
        let keterangan = item.keterangan;
        let note = item.note;

        // Auto-read Keterangan dari Sheet
        if (bus.keterangan && bus.keterangan.trim() !== '') {
          const normKet = normalizeKeterangan(bus.keterangan);
          if (isUnitOffOrToEvdal(normKet)) {
            status = 'OFF';
            keterangan = normKet;
            target_ritase = 0;
          } else {
            status = 'TROUBLE';
            keterangan = normKet;
            note = normKet;
          }
        }

        // Auto-read Nilai Trip dari Sheet jika sudah ada
        const tp = parseIndonesianNumber(bus.tripPergi || '0', 0);
        const tpl = parseIndonesianNumber(bus.tripPulang || '0', 0);
        const totalTrips = tp + tpl;
        if (totalTrips > 0 && status !== 'OFF') {
          target_ritase = totalTrips / 2;
        }

        return {
          ...item,
          target_ritase,
          status,
          keterangan,
          note,
        };
      });
    },
    [],
  );

  // 3. Inisialisasi Data Plotting dari Supabase / LocalStorage / Fallback dari BusData
  useEffect(() => {
    let isMounted = true;
    isDirtyRef.current = false;

    async function loadPlotting() {
      try {
        const existing = await fetchDailyPlotting(routeId, date);
        if (existing && existing.units_data && existing.units_data.length > 0 && isMounted) {
          if (!isDirtyRef.current) {
            setUnitsData(normalizeBaseOrders(integrateSheetValues(existing.units_data)));
          }
          onPlottingChange?.(existing);
          return;
        }

        // Fallback: Inisialisasi dari daftar buses jika belum ada data plotting
        const currentBuses = busesRef.current;
        if (currentBuses && currentBuses.length > 0 && isMounted && !isDirtyRef.current) {
          const half = Math.ceil(currentBuses.length / 2);
          const initialItems: UnitPlottingItem[] = currentBuses.map((b, idx) => {
            const startPoint: PlottingStartPoint = idx < half ? 'A' : 'B';
            const isOff = isUnitOffOrToEvdal(b.keterangan);
            const status: PlottingUnitStatus = isOff ? 'OFF' : 'READY';

            return {
              unit: b.unit,
              order: idx < half ? idx + 1 : idx - half + 1,
              start_point: startPoint,
              target_ritase: isOff ? 0 : 7.5,
              status,
              keterangan: b.keterangan || undefined,
              note: b.keterangan || undefined,
            };
          });

          setUnitsData(normalizeBaseOrders(integrateSheetValues(initialItems)));
        }
      } catch (err) {
        console.warn('[DailyPlottingPage] Gagal memuat data plotting:', err);
      }
    }

    loadPlotting();

    return () => {
      isMounted = false;
    };
  }, [routeId, date, onPlottingChange, integrateSheetValues]);

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
      if (u.target_ritase > 0) {
        counts[u.target_ritase] = (counts[u.target_ritase] || 0) + 1;
      }
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

  // Handler: Toggle Select Unit untuk Multi-Select Bebas
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
    isDirtyRef.current = true;
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

  // Handler: Pindahkan Unit 1 Tingkat ke Atas (Infinity Movement: urutan #1 pindah ke paling bawah)
  const handleMoveUp = useCallback((unit: string) => {
    isDirtyRef.current = true;
    setUnitsData((prev) => {
      const target = prev.find((u) => u.unit === unit);
      if (!target) return prev;

      const point = target.start_point;
      const baseUnits = prev
        .filter((u) => u.start_point === point)
        .sort((a, b) => a.order - b.order);

      const idx = baseUnits.findIndex((u) => u.unit === unit);
      if (idx === -1) return prev;

      const updatedBase = [...baseUnits];
      if (idx === 0) {
        // Infinity Movement: Unit urutan pertama diputar ke paling bawah
        const [first] = updatedBase.splice(0, 1);
        updatedBase.push(first);
      } else {
        // Swap 1 tingkat ke atas dengan unit sebelumnya
        const temp = updatedBase[idx - 1];
        updatedBase[idx - 1] = updatedBase[idx];
        updatedBase[idx] = temp;
      }

      // Re-index urutan pangkalan
      const reindexed = updatedBase.map((u, i) => ({ ...u, order: i + 1 }));
      const otherUnits = prev.filter((u) => u.start_point !== point);

      return normalizeBaseOrders([...reindexed, ...otherUnits]);
    });
  }, []);

  // Handler: Pindahkan Unit 1 Tingkat ke Bawah (Infinity Movement: urutan terakhir pindah ke paling atas)
  const handleMoveDown = useCallback((unit: string) => {
    isDirtyRef.current = true;
    setUnitsData((prev) => {
      const target = prev.find((u) => u.unit === unit);
      if (!target) return prev;

      const point = target.start_point;
      const baseUnits = prev
        .filter((u) => u.start_point === point)
        .sort((a, b) => a.order - b.order);

      const idx = baseUnits.findIndex((u) => u.unit === unit);
      if (idx === -1) return prev;

      const updatedBase = [...baseUnits];
      if (idx === updatedBase.length - 1) {
        // Infinity Movement: Unit urutan terakhir diputar ke paling atas
        const [last] = updatedBase.splice(updatedBase.length - 1, 1);
        updatedBase.unshift(last);
      } else {
        // Swap 1 tingkat ke bawah dengan unit sesudahnya
        const temp = updatedBase[idx + 1];
        updatedBase[idx + 1] = updatedBase[idx];
        updatedBase[idx] = temp;
      }

      // Re-index urutan pangkalan
      const reindexed = updatedBase.map((u, i) => ({ ...u, order: i + 1 }));
      const otherUnits = prev.filter((u) => u.start_point !== point);

      return normalizeBaseOrders([...reindexed, ...otherUnits]);
    });
  }, []);

  // Handler: Rolling Otomatis (Memutar unit #1 kemarin ke urutan terakhir pangkalan)
  const handleApplyRolling = useCallback(() => {
    isDirtyRef.current = true;
    setUnitsData((prev) => normalizeBaseOrders(generateRollingFromYesterday(prev)));
    showSuccessToast(TEXT_PLOTTING.TOASTS.ROLLING_APPLIED);
  }, []);

  // Handler: Update Target Ritase per Unit secara langsung (dari Stepper)
  const handleUpdateTargetRitase = useCallback((unit: string, target_ritase: number) => {
    isDirtyRef.current = true;
    const rounded = Math.round(target_ritase * 2) / 2;
    setUnitsData((prev) =>
      prev.map((u) => (u.unit === unit ? { ...u, target_ritase: rounded } : u)),
    );
  }, []);

  // Handler: Buka Modal Pengatur Ritase Fleksibel
  const handleOpenUnitTargetModal = useCallback((unit: string, currentRitase: number) => {
    setTargetModal({
      isOpen: true,
      unit,
      initialValue: currentRitase,
      selectedCount: undefined,
    });
  }, []);

  const handleOpenHeaderTargetModal = useCallback(() => {
    setTargetModal({
      isOpen: true,
      unit: undefined,
      initialValue: defaultTargetRitase,
      selectedCount: undefined,
    });
  }, [defaultTargetRitase]);

  // Handler: Terapkan Target Ritase dari Modal (Unit / Pangkalan / Semua / Terpilih)
  const handleApplyTargetRitase = useCallback(
    (val: number, scope: 'unit' | 'base' | 'all' | 'selected') => {
      isDirtyRef.current = true;
      const roundedVal = Math.round(val * 2) / 2;

      if (scope === 'selected') {
        setUnitsData((prev) =>
          prev.map((u) => (selectedUnits.has(u.unit) ? { ...u, target_ritase: roundedVal } : u)),
        );
        showSuccessToast(TEXT_PLOTTING.TOASTS.BULK_TARGET_APPLIED(roundedVal, selectedUnits.size));
        setSelectedUnits(new Set());
        setTargetModal((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      setUnitsData((prev) => {
        if (scope === 'unit' && targetModal.unit) {
          return prev.map((u) => (u.unit === targetModal.unit ? { ...u, target_ritase: roundedVal } : u));
        }
        if (scope === 'base') {
          return prev.map((u) =>
            u.start_point === activeBase
              ? { ...u, target_ritase: u.status === 'OFF' ? 0 : roundedVal }
              : u,
          );
        }
        if (scope === 'all') {
          return prev.map((u) => ({
            ...u,
            target_ritase: u.status === 'OFF' ? 0 : roundedVal,
          }));
        }
        return prev;
      });

      if (scope === 'unit' && targetModal.unit) {
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(roundedVal, targetModal.unit));
      } else if (scope === 'base') {
        const baseName = activeBase === 'A' ? endpointA : endpointB;
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(roundedVal, `Pangkalan ${baseName}`));
      } else {
        showSuccessToast(TEXT_PLOTTING.TOASTS.TARGET_UPDATED(roundedVal, 'Semua Unit'));
      }

      setTargetModal((prev) => ({ ...prev, isOpen: false }));
    },
    [targetModal.unit, activeBase, endpointA, endpointB, selectedUnits],
  );

  // Handler: Update Status Kesiapan Unit Langsung
  const handleUpdateStatus = useCallback((unit: string, status: PlottingUnitStatus) => {
    isDirtyRef.current = true;
    setUnitsData((prev) =>
      prev.map((u) => (u.unit === unit ? { ...u, status } : u)),
    );
  }, []);

  // Handler: Buka Modal Kendala Cepat
  const handleOpenTroubleModal = useCallback(
    (unitName: string) => {
      const u = unitsData.find((item) => item.unit === unitName);
      if (!u) return;

      setTroubleModal({
        isOpen: true,
        unit: u.unit,
        status: u.status,
        keterangan: u.keterangan || (u.status === 'OFF' ? 'OFF' : ''),
        note: u.note || '',
      });
    },
    [unitsData],
  );

  // Handler: Terapkan Kendala dari Modal
  const handleApplyTrouble = useCallback(
    (unitName: string, keterangan: string, note?: string) => {
      isDirtyRef.current = true;
      const isOff = isUnitOffOrToEvdal(keterangan);
      const newStatus: PlottingUnitStatus = isOff ? 'OFF' : 'TROUBLE';

      setUnitsData((prev) =>
        prev.map((u) => {
          if (u.unit === unitName) {
            return {
              ...u,
              status: newStatus,
              keterangan,
              note: note || keterangan,
              target_ritase: isOff ? 0 : u.target_ritase,
            };
          }
          return u;
        }),
      );
    },
    [],
  );

  // Handler: Reset Unit ke Siap Jalan
  const handleResetReady = useCallback(
    (unitName: string) => {
      isDirtyRef.current = true;
      setUnitsData((prev) =>
        prev.map((u) => {
          if (u.unit === unitName) {
            return {
              ...u,
              status: 'READY',
              keterangan: undefined,
              note: undefined,
              target_ritase: u.target_ritase === 0 ? defaultTargetRitase : u.target_ritase,
            };
          }
          return u;
        }),
      );
    },
    [defaultTargetRitase],
  );

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
      isDirtyRef.current = true;

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

  // Handler: Simpan Plotting Harian & Sinkronkan Serentak ke Google Sheets Asli (SSOT)
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

      // 1. Simpan ke Supabase (offline-first)
      const saved = await saveDailyPlotting(payload);
      onPlottingChange?.(saved);

      // 2. Sinkronkan ke Google Sheets ASLI (SSOT) untuk Kolom Trip & Keterangan
      if (sheetId && tabName && buses && buses.length > 0 && headerMap) {
        const busMap = new Map<string, BusData>();
        buses.forEach((b) => {
          if (b.unit) busMap.set(b.unit.trim().toUpperCase(), b);
        });

        const updatesList: Array<{ rowIndex: number; updates: Partial<BusData> }> = [];

        unitsData.forEach((item) => {
          const bus = busMap.get(item.unit.trim().toUpperCase());
          if (!bus) return;

          const isOff = isUnitOffOrToEvdal(item.keterangan || item.note) || item.status === 'OFF';

          let tripPergi = '';
          let tripPulang = '';

          if (isOff || item.target_ritase <= 0) {
            tripPergi = '';
            tripPulang = '';
          } else {
            const rit = Math.round(item.target_ritase * 2) / 2;
            const isHalf = rit % 1 !== 0;
            const k = Math.floor(rit);

            if (!isHalf) {
              tripPergi = String(k);
              tripPulang = String(k);
            } else {
              // Pembagian pecahan 0.5 rit:
              // Start A -> Pergi k+1, Pulang k
              // Start B -> Pulang k+1, Pergi k
              if (item.start_point === 'A') {
                tripPergi = String(k + 1);
                tripPulang = String(k);
              } else {
                tripPulang = String(k + 1);
                tripPergi = String(k);
              }
            }
          }

          // BUG-195-01: Pertahankan keterangan eksisting jika unit READY dan bukan pemulihan dari trouble
          let resolvedKeterangan = '';
          if (item.status === 'READY') {
            const origKet = (bus.keterangan || '').trim();
            const wasTrouble = isUnitOffOrToEvdal(origKet) || /^(BA\.02|NP|OFF|T\.O EVDAL)/i.test(origKet);
            if (wasTrouble) {
              resolvedKeterangan = '';
            } else {
              resolvedKeterangan = item.keterangan !== undefined ? item.keterangan : origKet;
            }
          } else {
            resolvedKeterangan = item.keterangan || item.note || 'KENDALA';
          }

          // Dirty check: hanya sertakan baris yang trip atau keterangannya berubah nyata (BUG-195-01)
          const currentTripPergi = (bus.tripPergi || '').trim();
          const currentTripPulang = (bus.tripPulang || '').trim();
          const currentKeterangan = (bus.keterangan || '').trim();

          const hasTripChanged = currentTripPergi !== tripPergi.trim() || currentTripPulang !== tripPulang.trim();
          const hasKeteranganChanged = currentKeterangan !== resolvedKeterangan.trim();

          if (hasTripChanged || hasKeteranganChanged) {
            const updates: Partial<BusData> = {
              tripPergi,
              tripPulang,
              keterangan: resolvedKeterangan,
            };

            updatesList.push({
              rowIndex: bus.rowIndex,
              updates,
            });

            // Update in-memory state busData di Dashboard seketika
            onUpdateBus?.(bus.rowIndex, updates);
          }
        });

        if (updatesList.length > 0) {
          if (navigator.onLine) {
            await updateBulkBusData(sheetId, tabName, updatesList, headerMap);
            showSuccessToast(TEXT_PLOTTING.TOASTS.SHEET_SYNC_SUCCESS(updatesList.length));
          } else if (addToQueue) {
            updatesList.forEach((up) => {
              addToQueue({
                sheetId,
                tabName,
                rowIndex: up.rowIndex,
                updates: up.updates,
                headerMap,
              });
            });
            showSuccessToast(TEXT_PLOTTING.TOASTS.SHEET_SYNC_OFFLINE(updatesList.length));
          } else {
            showSuccessToast(TEXT_PLOTTING.TOASTS.SAVE_SUCCESS);
          }
        } else {
          showSuccessToast(TEXT_PLOTTING.TOASTS.SAVE_SUCCESS);
        }
      } else {
        showSuccessToast(TEXT_PLOTTING.TOASTS.SAVE_SUCCESS);
      }

      setIsReordering(false);
      setSelectedUnits(new Set());
    } catch (err) {
      console.warn('[DailyPlottingPage] Gagal menyimpan plotting:', err);
      showErrorToast(TEXT_PLOTTING.TOASTS.SAVE_ERROR);
    } finally {
      setIsSaving(false);
      isDirtyRef.current = false;
    }
  }, [
    routeId,
    routeCode,
    date,
    endpointA,
    endpointB,
    unitsData,
    onPlottingChange,
    sheetId,
    tabName,
    buses,
    headerMap,
    onUpdateBus,
    addToQueue,
  ]);

  return (
    <div
      data-no-swipe="true"
      style={{
        padding: '16px 16px calc(92px + env(safe-area-inset-bottom, 0px)) 16px',
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
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onToggleStartPoint={handleToggleStartPoint}
              onUpdateTargetRitase={handleUpdateTargetRitase}
              onOpenTargetModal={handleOpenUnitTargetModal}
              onOpenTroubleModal={handleOpenTroubleModal}
              onUpdateStatus={handleUpdateStatus}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* 4. Floating Multi-Select Bottom Bar (Tampil fleksibel saat ada unit yang dipilih) */}
      {selectedUnits.size > 0 && (
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
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.MULTI_SELECT_INFO(selectedUnits.size)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Tombol Atur Ritase Terpilih (Bulk Target Ritase) */}
            <button
              type="button"
              onClick={() => {
                setTargetModal({
                  isOpen: true,
                  initialValue: defaultTargetRitase,
                  selectedCount: selectedUnits.size,
                });
              }}
              data-testid="btn-bulk-set-ritase"
              title="Atur ritase untuk seluruh unit terpilih sekaligus"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                background: 'var(--color-action-primary-bg, #0284c7)',
                color: 'var(--color-action-primary-fg, #ffffff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Zap size={14} />
              <span>{TEXT_PLOTTING.ACTIONS.SET_BULK_RITASE(selectedUnits.size)}</span>
            </button>

            {/* Tombol Tetapkan Start A */}
            <button
              type="button"
              onClick={() => handleAssignStartPoint('A')}
              data-testid="btn-assign-start-a"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                background: 'var(--color-surface-default, rgba(255, 255, 255, 0.08))',
                color: 'var(--color-text-primary, #f8fafc)',
                cursor: 'pointer',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.ASSIGN_START_POINT(endpointA)}
            </button>

            {/* Tombol Tetapkan Start B */}
            <button
              type="button"
              onClick={() => handleAssignStartPoint('B')}
              data-testid="btn-assign-start-b"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                background: 'var(--color-surface-default, rgba(255, 255, 255, 0.08))',
                color: 'var(--color-text-primary, #f8fafc)',
                cursor: 'pointer',
              }}
            >
              {TEXT_PLOTTING.ACTIONS.ASSIGN_START_POINT(endpointB)}
            </button>

            {/* Tombol Batal Seleksi */}
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
        selectedCount={targetModal.selectedCount}
        onClose={() => setTargetModal((prev) => ({ ...prev, isOpen: false }))}
        onApply={handleApplyTargetRitase}
      />

      {/* 6. Modal Pengatur Status Kendala Cepat & Terpadu */}
      <PlottingTroubleModal
        isOpen={troubleModal.isOpen}
        unit={troubleModal.unit}
        currentStatus={troubleModal.status}
        currentKeterangan={troubleModal.keterangan}
        currentNote={troubleModal.note}
        onClose={() => setTroubleModal((prev) => ({ ...prev, isOpen: false }))}
        onApplyTrouble={handleApplyTrouble}
        onResetReady={handleResetReady}
      />
    </div>
  );
};

export default DailyPlottingPage;
