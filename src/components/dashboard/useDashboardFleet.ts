import { useState, useEffect, useMemo } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { getRenopsForDate } from "@/utils/holidayUtils";
import { combineShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import {
  fetchDailyRouteReport,
  upsertDailyRouteReport,
  recordFleetStatusAuditLog,
} from "@/services/dailyRouteReportService";
import {
  fetchDailyFleetShift,
  upsertDailyFleetShift,
} from "@/services/fleetStatusService";
import type { FleetStatusConfirmationPayload } from "@/components/fleetStatus/types";
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
  currentSheetId: _currentSheetId,
  currentTabName: _currentTabName,
  headerMap: _headerMap,
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
  const [confirmedInfo, setConfirmedInfo] = useState<{
    s1: { by?: string; at?: string };
    s2: { by?: string; at?: string };
  }>({
    s1: {},
    s2: {},
  });

  useEffect(() => {
    let isMounted = true;
    if (matchedRoute?.id && operationalReportDate) {
      Promise.all([
        fetchDailyFleetShift(matchedRoute.id, operationalReportDate, 1),
        fetchDailyFleetShift(matchedRoute.id, operationalReportDate, 2),
        fetchDailyRouteReport(matchedRoute.id, operationalReportDate),
      ])
        .then(([fleetS1, fleetS2, report]) => {
          if (isMounted) {
            setOperationalReportStatus(report?.status || "draft");
            setConfirmedShifts({
              1: Boolean(
                fleetS1?.is_confirmed ??
                  report?.is_fleet_confirmed_s1 ??
                  (report &&
                    (report.realops_shift1 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
              2: Boolean(
                fleetS2?.is_confirmed ??
                  report?.is_fleet_confirmed_s2 ??
                  (report &&
                    (report.realops_shift2 > 0 ||
                      report.status === "submitted" ||
                      report.status === "verified")),
              ),
            });
            setConfirmedInfo({
              s1: {
                by: fleetS1?.confirmed_by,
                at: fleetS1?.confirmed_at || report?.fleet_confirmed_s1_at,
              },
              s2: {
                by: fleetS2?.confirmed_by,
                at: fleetS2?.confirmed_at || report?.fleet_confirmed_s2_at,
              },
            });
          }
        })
        .catch(() => {
          if (isMounted) {
            setOperationalReportStatus("draft");
            setConfirmedShifts({ 1: false, 2: false });
            setConfirmedInfo({ s1: {}, s2: {} });
          }
        });
    } else {
      setOperationalReportStatus("draft");
      setConfirmedShifts({ 1: false, 2: false });
      setConfirmedInfo({ s1: {}, s2: {} });
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
    payload?: FleetStatusConfirmationPayload,
  ) => {
    try {
      // 1. Perbarui state lokal busData di antarmuka tanpa menulis ke Google Sheets
      const updatesList: { rowIndex: number; updates: Partial<BusData> }[] = [];
      let calculatedRealopsS1 = 0;
      let calculatedRealopsS2 = 0;

      for (const [rowIndex, val] of statusMap.entries()) {
        const cleanS1 = cleanShiftNote(val.s1);
        const cleanS2 = cleanShiftNote(val.s2);
        if (!cleanS1) calculatedRealopsS1++;
        if (!cleanS2) calculatedRealopsS2++;

        const combinedKeterangan = combineShiftKeterangan(val.s1, val.s2);
        updatesList.push({
          rowIndex,
          updates: { keterangan: combinedKeterangan },
        });
      }

      setBusData((prev) =>
        prev
          ? prev.map((bus) => {
              const match = updatesList.find((u) => u.rowIndex === bus.rowIndex);
              return match ? { ...bus, ...match.updates } : bus;
            })
          : null,
      );

      // 2. Simpan 100% ke Supabase (daily_fleet_shifts & daily_fleet_non_sgo_units)
      if (matchedRoute?.id && operationalReportDate) {
        const userEmail = localStorage.getItem("PDO_USER_EMAIL") || undefined;
        const nowIso = new Date().toISOString();

        const targetRenops = payload?.targetRenops ?? dynamicRenops.renops;
        const realops = payload?.realops ?? (shift === 1 ? calculatedRealopsS1 : calculatedRealopsS2);
        const sgoCount = payload?.sgoCount ?? realops;
        const toCount = payload?.toCount ?? 0;
        const offCount = payload?.offCount ?? 0;
        const soCount = payload?.soCount ?? 0;
        const otherCount = payload?.otherCount ?? 0;
        const nonSgoUnits = payload?.nonSgoUnits ?? [];

        await upsertDailyFleetShift(
          {
            route_id: matchedRoute.id,
            route_code: matchedRoute.route_code,
            date: operationalReportDate,
            shift,
            target_renops: targetRenops,
            realops,
            total_units: busData?.length || 0,
            sgo_count: sgoCount,
            to_count: toCount,
            off_count: offCount,
            so_count: soCount,
            other_count: otherCount,
            is_confirmed: true,
            confirmed_by: userEmail,
            confirmed_at: nowIso,
          },
          nonSgoUnits,
        );

        // 3. Sinkronkan realops & status konfirmasi ke daily_route_reports untuk backward-compatibility
        await upsertDailyRouteReport({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          renops_shift1: dynamicRenops.renops,
          realops_shift1: shift === 1 ? realops : calculatedRealopsS1,
          renops_shift2: dynamicRenops.renops,
          realops_shift2: shift === 2 ? realops : calculatedRealopsS2,
          headway_fastest: 3,
          headway_slowest: 10,
          traffic_jam_spots: matchedRoute.default_traffic_jam_spots || [],
          status: operationalReportStatus || "draft",
          ...(shift === 1
            ? {
                is_fleet_confirmed_s1: true,
                fleet_confirmed_s1_at: nowIso,
                fleet_status_shift1: nonSgoUnits.map((u) => ({
                  unit: u.unit_body,
                  note: u.note,
                  isOff: u.status_code === "OFF",
                })),
              }
            : {
                is_fleet_confirmed_s2: true,
                fleet_confirmed_s2_at: nowIso,
                fleet_status_shift2: nonSgoUnits.map((u) => ({
                  unit: u.unit_body,
                  note: u.note,
                  isOff: u.status_code === "OFF",
                })),
              }),
        });

        // 4. Catat riwayat jejak audit ke fleet_status_logs
        await recordFleetStatusAuditLog({
          route_id: matchedRoute.id,
          route_code: matchedRoute.route_code,
          date: operationalReportDate,
          shift,
          sgo_count: sgoCount,
          to_count: toCount,
          off_count: offCount,
          total_units: busData?.length || 0,
          fleet_status: nonSgoUnits.map((u) => ({
            unit: u.unit_body,
            note: u.note,
            isOff: u.status_code === "OFF",
          })),
          confirmed_by: userEmail,
        });

        setConfirmedInfo((prev) => ({
          ...prev,
          [shift === 1 ? "s1" : "s2"]: { by: userEmail, at: nowIso },
        }));
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
    confirmedInfo,
    setConfirmedShifts,
    isShiftConfirmed,
    handleConfirmFleetStatus,
  };
}
