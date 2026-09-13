import { useState, useEffect, useMemo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { updateBulkBusData } from "@/services/googleSheets";
import { getRenopsForDate } from "@/utils/holidayUtils";
import { combineShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import {
  fetchDailyRouteReport,
  upsertDailyRouteReport,
  recordFleetStatusAuditLog,
} from "@/services/dailyRouteReportService";
import type { FleetUnitStatusDetail } from "@/types/supabase";
import { formatUserError } from "@/utils/errorFormatter";
import { showSuccessToast, showErrorToast } from "@/utils/alertUtils";
import { TEXT_FLEET_STATUS } from "@/constants/texts";

interface UseDashboardFleetProps {
  matchedRoute: any;
  operationalReportDate: string;
  selectedTab: string;
  busData: BusData[] | null;
  currentSheetId: string;
  currentTabName: string;
  headerMap: HeaderMap | null;
  setBusData: React.Dispatch<React.SetStateAction<BusData[] | null>>;
}

export function useDashboardFleet({
  matchedRoute,
  operationalReportDate,
  selectedTab,
  busData,
  currentSheetId,
  currentTabName,
  headerMap,
  setBusData,
}: UseDashboardFleetProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [operationalReportStatus, setOperationalReportStatus] = useState<
    "draft" | "submitted" | "verified"
  >("draft");

  const dynamicRenops = useMemo(() => {
    return getRenopsForDate(matchedRoute, operationalReportDate);
  }, [matchedRoute, operationalReportDate]);

  const activeShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [confirmedShifts, setConfirmedShifts] = useState<{
    1: boolean;
    2: boolean;
  }>({
    1: false,
    2: false,
  });

  useEffect(() => {
    let isMounted = true;
    if (matchedRoute?.id && operationalReportDate) {
      fetchDailyRouteReport(matchedRoute.id, operationalReportDate)
        .then((report) => {
          if (isMounted) {
            setOperationalReportStatus(report?.status || "draft");
            setConfirmedShifts({
              1: Boolean(
                report?.is_fleet_confirmed_s1 ??
                  (report &&
                    (report.realops_shift1 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
              2: Boolean(
                report?.is_fleet_confirmed_s2 ??
                  (report &&
                    (report.realops_shift2 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
            });
          }
        })
        .catch(() => {
          if (isMounted) {
            setOperationalReportStatus("draft");
            setConfirmedShifts({ 1: false, 2: false });
          }
        });
    } else {
      setOperationalReportStatus("draft");
      setConfirmedShifts({ 1: false, 2: false });
    }
    return () => {
      isMounted = false;
    };
  }, [matchedRoute?.id, operationalReportDate]);

  const isPastDate = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return operationalReportDate < todayStr;
  }, [operationalReportDate]);

  const isShiftConfirmed = useMemo(() => {
    if (selectedTab === "AKUMULASI") return true;
    if (confirmedShifts[activeShift]) return true;

    if (isPastDate && busData && busData.length > 0) {
      const hasAnyData = busData.some((b) => {
        const ket = (b.keterangan || "").trim();
        const hasToa =
          Boolean(b.totalToa && b.totalToa !== "0") ||
          Boolean(b.toaShift1 && b.toaShift1 !== "0");
        const hasKm = Boolean(b.kmAkhir1 || b.kmAkhir2);
        return ket.length > 0 || hasToa || hasKm;
      });
      if (hasAnyData) return true;
    }

    return false;
  }, [selectedTab, confirmedShifts, activeShift, isPastDate, busData]);

  const handleConfirmFleetStatus = async (
    shift: 1 | 2,
    statusMap: Map<number, { s1: string; s2: string }>,
  ) => {
    if (!currentSheetId || !currentTabName || !headerMap) return;

    let realopsS1 = 0;
    let realopsS2 = 0;
    const updatesList: { rowIndex: number; updates: Partial<BusData> }[] = [];

    for (const [rowIndex, val] of statusMap.entries()) {
      const cleanS1 = cleanShiftNote(val.s1);
      const cleanS2 = cleanShiftNote(val.s2);
      if (!cleanS1) realopsS1++;
      if (!cleanS2) realopsS2++;

      const combinedKeterangan = combineShiftKeterangan(val.s1, val.s2);
      updatesList.push({
        rowIndex,
        updates: { keterangan: combinedKeterangan },
      });
    }

    try {
      await updateBulkBusData(
        currentSheetId,
        currentTabName,
        updatesList,
        headerMap,
      );

      setBusData((prev) =>
        prev
          ? prev.map((bus) => {
              const match = updatesList.find((u) => u.rowIndex === bus.rowIndex);
              return match ? { ...bus, ...match.updates } : bus;
            })
          : null,
      );

      if (matchedRoute?.id && operationalReportDate) {
        const nonSgoUnits: FleetUnitStatusDetail[] = [];
        let offCount = 0;
        let toCount = 0;

        for (const bus of busData || []) {
          const unitVal = statusMap.get(bus.rowIndex);
          const note = cleanShiftNote(shift === 1 ? unitVal?.s1 : unitVal?.s2);
          if (note) {
            const isOff = note.toUpperCase().includes("OFF");
            if (isOff) offCount++;
            else toCount++;

            nonSgoUnits.push({
              unit: bus.unit,
              note,
              isOff,
            });
          }
        }

        const totalUnits = busData?.length || 0;
        const sgoCount = Math.max(0, totalUnits - nonSgoUnits.length);

        await upsertDailyRouteReport({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          renops_shift1: dynamicRenops.renops,
          realops_shift1: realopsS1,
          renops_shift2: dynamicRenops.renops,
          realops_shift2: realopsS2,
          headway_fastest: 3,
          headway_slowest: 10,
          traffic_jam_spots: matchedRoute.default_traffic_jam_spots || [],
          status: operationalReportStatus || "draft",
          ...(shift === 1
            ? {
                fleet_status_shift1: nonSgoUnits,
                is_fleet_confirmed_s1: true,
                fleet_confirmed_s1_at: new Date().toISOString(),
              }
            : {
                fleet_status_shift2: nonSgoUnits,
                is_fleet_confirmed_s2: true,
                fleet_confirmed_s2_at: new Date().toISOString(),
              }),
        });

        await recordFleetStatusAuditLog({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          shift,
          sgo_count: sgoCount,
          to_count: toCount,
          off_count: offCount,
          total_units: totalUnits,
          fleet_status: nonSgoUnits,
          confirmed_by: localStorage.getItem("PDO_USER_EMAIL") || undefined,
        });
      }

      setConfirmedShifts((prev) => ({ ...prev, [shift]: true }));
      showSuccessToast(TEXT_FLEET_STATUS.TOAST.APPLY_SUCCESS(shift));
    } catch (err: any) {
      console.warn("[Dashboard] Gagal menerapkan status armada:", err);
      const friendlyErr = formatUserError(
        err,
        TEXT_FLEET_STATUS.TOAST.APPLY_ERROR,
      );
      if (friendlyErr) {
        showErrorToast(friendlyErr);
      }
      throw err;
    }
  };

  return {
    isReportModalOpen,
    setIsReportModalOpen,
    operationalReportStatus,
    setOperationalReportStatus,
    dynamicRenops,
    activeShift,
    isFleetModalOpen,
    setIsFleetModalOpen,
    confirmedShifts,
    setConfirmedShifts,
    isShiftConfirmed,
    handleConfirmFleetStatus,
  };
}
