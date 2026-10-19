import { useState, useEffect, useMemo, useCallback } from "react";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import { getRenopsForDate } from "@/utils/holidayUtils";
import { fetchDailyRouteReport } from "@/services/dailyRouteReportService";
import { fetchDailyFleetShift } from "@/services/fleetStatusService";

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
  setBusData: _setBusData,
}: UseDashboardFleetProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [operationalReportStatus, setOperationalReportStatus] = useState<
    "draft" | "submitted" | "verified" | "failed"
  >("draft");

  const dynamicRenops = useMemo(() => {
    return getRenopsForDate(matchedRoute, operationalReportDate);
  }, [matchedRoute, operationalReportDate]);

  const activeShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
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

  const refreshFleetData = useCallback(async () => {
    if (!matchedRoute?.id || !operationalReportDate) return;
    try {
      const [fleetS1, fleetS2, report] = await Promise.all([
        fetchDailyFleetShift(matchedRoute.id, operationalReportDate, 1),
        fetchDailyFleetShift(matchedRoute.id, operationalReportDate, 2),
        fetchDailyRouteReport(matchedRoute.id, operationalReportDate),
      ]);

      const s1Confirmed = Boolean(
        fleetS1?.is_confirmed ??
          report?.is_fleet_confirmed_s1 ??
          (report &&
            (report.realops_shift1 > 0 ||
              report.status === "submitted" ||
              report.status === "verified")),
      );
      const s2Confirmed = Boolean(
        fleetS2?.is_confirmed ??
          report?.is_fleet_confirmed_s2 ??
          (report &&
            (report.realops_shift2 > 0 ||
              report.status === "submitted" ||
              report.status === "verified")),
      );

      setConfirmedShifts({
        1: s1Confirmed,
        2: s2Confirmed,
      });
      setConfirmedInfo({
        s1: {
          by: fleetS1?.user_id ? `User #${fleetS1.user_id}` : undefined,
          at: fleetS1?.confirmed_at || report?.fleet_confirmed_s1_at,
        },
        s2: {
          by: fleetS2?.user_id ? `User #${fleetS2.user_id}` : undefined,
          at: fleetS2?.confirmed_at || report?.fleet_confirmed_s2_at,
        },
      });

      if (report?.status === "verified") {
        setOperationalReportStatus("verified");
      } else if (s1Confirmed || s2Confirmed || report?.status === "submitted") {
        setOperationalReportStatus("submitted");
      } else {
        setOperationalReportStatus(report?.status || "draft");
      }
    } catch (err) {
      console.warn("[useDashboardFleet] Gagal refreshFleetData:", err);
    }
  }, [matchedRoute?.id, operationalReportDate]);

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
            const s1Confirmed = Boolean(
              fleetS1?.is_confirmed ??
                report?.is_fleet_confirmed_s1 ??
                (report &&
                  (report.realops_shift1 > 0 ||
                    report.status === "submitted" ||
                    report.status === "verified")),
            );
            const s2Confirmed = Boolean(
              fleetS2?.is_confirmed ??
                report?.is_fleet_confirmed_s2 ??
                (report &&
                  (report.realops_shift2 > 0 ||
                    report.status === "submitted" ||
                    report.status === "verified")),
            );

            setConfirmedShifts({
              1: s1Confirmed,
              2: s2Confirmed,
            });
            setConfirmedInfo({
              s1: {
                by: fleetS1?.user_id ? `User #${fleetS1.user_id}` : undefined,
                at: fleetS1?.confirmed_at || report?.fleet_confirmed_s1_at,
              },
              s2: {
                by: fleetS2?.user_id ? `User #${fleetS2.user_id}` : undefined,
                at: fleetS2?.confirmed_at || report?.fleet_confirmed_s2_at,
              },
            });

            if (report?.status === "verified") {
              setOperationalReportStatus("verified");
            } else if (s1Confirmed || s2Confirmed || report?.status === "submitted") {
              setOperationalReportStatus("submitted");
            } else {
              setOperationalReportStatus(report?.status || "draft");
            }
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

  return {
    isReportModalOpen,
    setIsReportModalOpen,
    operationalReportStatus,
    setOperationalReportStatus,
    dynamicRenops,
    activeShift,
    confirmedShifts,
    confirmedInfo,
    setConfirmedShifts,
    isShiftConfirmed,
    refreshFleetData,
  };
}
