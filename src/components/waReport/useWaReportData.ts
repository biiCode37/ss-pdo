import { useState, useMemo } from "react";
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  generateWaReportFormat3,
  openWhatsApp,
  type RouteWaData,
  type RegionTotals,
  type RouteFleetReportItem,
} from "@/utils/waReportGenerator";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import { showSuccessToast } from "@/utils/alertUtils";
import { TEXT_WA_REPORT } from "@/constants/texts";
import type { FormatType, SupervisorFilter } from "./types";

interface UseWaReportDataOptions {
  regionalData: RegionalMonitoringResult;
  selectedDate: string;
}

export function useWaReportData({
  regionalData,
  selectedDate,
}: UseWaReportDataOptions) {
  const [formatType, setFormatType] = useState<FormatType>("format1");
  const defaultShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
  const [selectedShift, setSelectedShift] = useState<1 | 2>(defaultShift);
  const [supervisorFilter, setSupervisorFilter] = useState<SupervisorFilter>("ALL");
  const [copied, setCopied] = useState(false);

  // Filter routes based on selected supervisor
  const filteredRoutes = useMemo(() => {
    if (!regionalData?.routes) return [];
    if (supervisorFilter === "ALL") return regionalData.routes;
    return regionalData.routes.filter((r) => {
      const name = r.supervisorName.toUpperCase();
      if (supervisorFilter === "RANTO") return name.includes("RANTO");
      if (supervisorFilter === "ABDUL") return name.includes("ABDUL");
      if (supervisorFilter === "MOAMAR") return name.includes("MOAMAR");
      return true;
    });
  }, [regionalData, supervisorFilter]);

  // Check unconfirmed routes for Format 3 blocking (18 routes regional check)
  const unconfirmedRoutes = useMemo(() => {
    if (formatType !== "format3") return [];
    const allRoutes = regionalData?.routes || [];
    return allRoutes.filter((r) =>
      selectedShift === 1 ? !r.isFleetConfirmedS1 : !r.isFleetConfirmedS2,
    );
  }, [formatType, regionalData?.routes, selectedShift]);

  const isFormat3Blocked = formatType === "format3" && unconfirmedRoutes.length > 0;

  // Convert to RouteWaData
  const waRouteItems: RouteWaData[] = useMemo(() => {
    return filteredRoutes.map((r, idx) => ({
      no: idx + 1,
      routeCode: r.routeCode.replace(".", " "), // e.g. "JAK.01" -> "JAK 01"
      routeName: r.routeName,
      operatorName: r.operatorName,
      isLooping: r.isLooping,
      todayPassengers: r.todayPassengers,
      yesterdayPassengers: r.yesterdayPassengers,
      lastWeekPassengers: r.lastWeekPassengers,
      targetHk: r.targetHk,
      bestRecord: r.bestRecord,
      achievementKm: r.achievementKm,
      kmBaku: r.kmBaku,
      renops: r.totalRenops,
      realops: r.totalRealops,
      trafficJamSpots: r.trafficJamSpots,
      operationalIssues: r.operationalIssues,
      headwayFastest: r.headwayFastest,
      headwaySlowest: r.headwaySlowest,
      toaShift1: r.toaShift1,
      manualShift1: r.manualShift1,
      totalShift1: r.totalShift1,
      toaShift2: r.toaShift2,
      manualShift2: r.manualShift2,
      totalShift2: r.totalShift2,
    }));
  }, [filteredRoutes]);

  // Calculate totals for Format 2
  const regionTotals: RegionTotals = useMemo(() => {
    if (supervisorFilter === "ALL") {
      return {
        tomShift1: regionalData.tomShift1,
        manualShift1: regionalData.manualShift1,
        totalShift1: regionalData.totalShift1,
        yesterdayShift1: regionalData.yesterdayShift1,
        lastWeekShift1: regionalData.lastWeekShift1,
        tomShift2: regionalData.tomShift2,
        manualShift2: regionalData.manualShift2,
        totalShift2: regionalData.totalShift2,
        yesterdayShift2: regionalData.yesterdayShift2,
        lastWeekShift2: regionalData.lastWeekShift2,
        totalToday: regionalData.totalTodayPassengers,
        totalTarget: regionalData.totalTargetPassengers,
        totalYesterday: regionalData.totalYesterdayPassengers,
        totalLastWeek: regionalData.totalLastWeekPassengers,
      };
    }
    // Subtotal for filtered supervisor
    const tomShift1 = waRouteItems.reduce((acc, r) => acc + r.toaShift1, 0);
    const manualShift1 = waRouteItems.reduce((acc, r) => acc + r.manualShift1, 0);
    const totalShift1 = tomShift1 + manualShift1;
    const tomShift2 = waRouteItems.reduce((acc, r) => acc + r.toaShift2, 0);
    const manualShift2 = waRouteItems.reduce((acc, r) => acc + r.manualShift2, 0);
    const totalShift2 = tomShift2 + manualShift2;
    const totalToday = waRouteItems.reduce((acc, r) => acc + r.todayPassengers, 0);
    const totalTarget = waRouteItems.reduce((acc, r) => acc + r.targetHk, 0);
    const totalYesterday = waRouteItems.reduce((acc, r) => acc + r.yesterdayPassengers, 0);
    const totalLastWeek = waRouteItems.reduce((acc, r) => acc + r.lastWeekPassengers, 0);

    return {
      tomShift1,
      manualShift1,
      totalShift1,
      yesterdayShift1: 0,
      lastWeekShift1: 0,
      tomShift2,
      manualShift2,
      totalShift2,
      yesterdayShift2: 0,
      lastWeekShift2: 0,
      totalToday,
      totalTarget,
      totalYesterday,
      totalLastWeek,
    };
  }, [regionalData, supervisorFilter, waRouteItems]);

  // Generate WhatsApp Message Text
  const messageText = useMemo(() => {
    if (!selectedDate || filteredRoutes.length === 0) return "";
    if (formatType === "format1") {
      return generateWaReportFormat1(selectedDate, waRouteItems);
    }
    if (formatType === "format2") {
      return generateWaReportFormat2(selectedDate, waRouteItems, regionTotals);
    }
    if (formatType === "format3") {
      const fleetItems: RouteFleetReportItem[] = filteredRoutes.map((r, idx) => ({
        no: idx + 1,
        routeCode: r.routeCode,
        routeName: r.routeName,
        operatorName: r.operatorName,
        renops: selectedShift === 1 ? r.renopsShift1 : r.renopsShift2,
        realops: selectedShift === 1 ? r.realopsShift1 : r.realopsShift2,
        nonSgoUnits: selectedShift === 1 ? r.fleetStatusShift1 : r.fleetStatusShift2,
      }));
      return generateWaReportFormat3(selectedDate, selectedShift, fleetItems);
    }
    return "";
  }, [formatType, selectedDate, filteredRoutes, waRouteItems, regionTotals, selectedShift]);

  // Missing reports count
  const unsubmittedCount = useMemo(() => {
    return filteredRoutes.filter((r) => r.status !== "submitted" && r.status !== "verified").length;
  }, [filteredRoutes]);

  const handleCopy = async () => {
    if (isFormat3Blocked) return;
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      showSuccessToast(TEXT_WA_REPORT.COPIED_TOAST);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Gagal salin teks:", err);
    }
  };

  const handleOpenWa = () => {
    if (isFormat3Blocked) return;
    openWhatsApp(messageText);
  };

  return {
    formatType,
    setFormatType,
    selectedShift,
    setSelectedShift,
    supervisorFilter,
    setSupervisorFilter,
    copied,
    filteredRoutes,
    unconfirmedRoutes,
    isFormat3Blocked,
    unsubmittedCount,
    messageText,
    handleCopy,
    handleOpenWa,
  };
}
