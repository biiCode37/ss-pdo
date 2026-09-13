import { useState, useEffect } from "react";
import { createRouteWithSheet } from "@/services/routeService";
import { inspectSpreadsheetHeader } from "@/services/googleSheets";
import { extractSpreadsheetId } from "@/utils/sheetIdentity";
import {
  validateRouteCode,
  validateGoogleSheetsUrl,
} from "@/utils/routeValidation";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { MONTH_NAMES_ID } from "./dateUtils";
import type { Route } from "@/types/supabase";
import type { FlatRouteSheet } from "./types";

interface UseAddRouteFormOptions {
  flatSheets: FlatRouteSheet[];
  days: string[];
  isAccumulation: boolean;
  loadRoutes: () => Promise<Route[]>;
  setSheetUrl: (url: string) => void;
  setSelectedRouteCode: (code: string) => void;
  setSelectedMonth: (month: number | null) => void;
  setSelectedYear: (year: number | null) => void;
  setSelectedTab: (tab: string) => void;
  onLoadData: (tab?: string, targetSheetUrl?: string) => void;
}

export function useAddRouteForm({
  flatSheets,
  days,
  isAccumulation,
  loadRoutes,
  setSheetUrl,
  setSelectedRouteCode,
  setSelectedMonth,
  setSelectedYear,
  setSelectedTab,
  onLoadData,
}: UseAddRouteFormOptions) {
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newRouteCodeSuffix, setNewRouteCodeSuffix] = useState("");
  const [newRouteUrl, setNewRouteUrl] = useState("");
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // Live Spreadsheet Check State
  const [detectedRouteName, setDetectedRouteName] = useState<string | null>(
    null,
  );
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // Live check inspection saat user mengisi link Google Sheets
  useEffect(() => {
    if (!isAddingRoute || !newRouteUrl.trim()) {
      setCheckStatus("idle");
      setCheckMessage(null);
      setDetectedRouteName(null);
      return;
    }

    const validation = validateGoogleSheetsUrl(newRouteUrl);
    if (!validation.isValid || !validation.spreadsheetId) {
      setCheckStatus("invalid");
      setCheckMessage(validation.error || "Link Google Sheets tidak valid.");
      setDetectedRouteName(null);
      return;
    }

    const timer = setTimeout(async () => {
      // BUG-48: Token pembatal — hasil inspeksi stale (user sudah mengganti
      // link) tidak boleh menimpa status/URL terkini.
      const checkedUrl = newRouteUrl;
      const checkedId = validation.spreadsheetId!;
      setIsCheckingLink(true);
      setCheckStatus("checking");
      setCheckMessage(TEXT_DASHBOARD.ROUTE_SELECTOR.CHECKING_ACCESS);

      try {
        const result = await inspectSpreadsheetHeader(checkedId);

        if (newRouteUrl !== checkedUrl) return; // Stale — abaikan

        setIsCheckingLink(false);
        if (result.success) {
          setCheckStatus("valid");
          setDetectedRouteName(result.routeName || null);
          setCheckMessage(
            result.routeName
              ? `Terhubung: ${result.routeName}`
              : TEXT_DASHBOARD.ROUTE_SELECTOR.CONNECTED_READY,
          );
        } else {
          setCheckStatus("invalid");
          setCheckMessage(
            result.message || TEXT_DASHBOARD.ROUTE_SELECTOR.CANNOT_ACCESS,
          );
          setDetectedRouteName(null);
        }
      } catch (_err) {
        if (newRouteUrl !== checkedUrl) return;
        setIsCheckingLink(false);
        setCheckStatus("invalid");
        setCheckMessage(TEXT_DASHBOARD.ROUTE_SELECTOR.CANNOT_ACCESS);
        setDetectedRouteName(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newRouteUrl, isAddingRoute]);

  // Proactive duplicate detection (real-time)
  const fullNewRouteCode = newRouteCodeSuffix.trim()
    ? `JAK.${newRouteCodeSuffix.trim()}`
    : "";
  const newSpreadsheetId = extractSpreadsheetId(newRouteUrl.trim());

  const duplicateRouteSheet =
    isAddingRoute && fullNewRouteCode
      ? flatSheets.find(
          (f) =>
            f.routeCode === fullNewRouteCode &&
            f.sheet.month === newMonth &&
            f.sheet.year === newYear,
        )
      : null;

  const duplicateSpreadsheetSheet =
    isAddingRoute && newSpreadsheetId
      ? flatSheets.find((f) => {
          const fId =
            extractSpreadsheetId(f.sheet.sheet_url) ||
            extractSpreadsheetId(f.sheet.spreadsheet_id);
          return (
            fId === newSpreadsheetId &&
            f.sheet.month === newMonth &&
            f.sheet.year === newYear
          );
        })
      : null;

  const duplicateWarningMessage = duplicateRouteSheet
    ? TEXT_DASHBOARD.ROUTE_SELECTOR.DUPLICATE_ROUTE_WARNING(
        fullNewRouteCode,
        MONTH_NAMES_ID[newMonth],
        newYear,
      )
    : duplicateSpreadsheetSheet &&
        duplicateSpreadsheetSheet.routeCode !== fullNewRouteCode
      ? TEXT_DASHBOARD.ROUTE_SELECTOR.DUPLICATE_SHEET_WARNING(
          duplicateSpreadsheetSheet.routeCode,
          MONTH_NAMES_ID[newMonth],
          newYear,
        )
      : null;

  const resetForm = () => {
    setNewRouteCodeSuffix("");
    setNewRouteUrl("");
    setNewMonth(new Date().getMonth() + 1);
    setNewYear(new Date().getFullYear());
    setFormError(null);
    setCheckStatus("idle");
    setCheckMessage(null);
    setDetectedRouteName(null);
    setIsAddingRoute(false);
  };

  const handleRouteCodeSuffixInput = (val: string) => {
    let cleaned = val.toUpperCase().replace(/\s+/g, "");
    if (cleaned.startsWith("JAK.")) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith("JAK")) {
      cleaned = cleaned.substring(3).replace(/^[^A-Z0-9]+/, "");
    }
    const sanitized = cleaned.replace(/[^A-Z0-9]/g, "");
    setNewRouteCodeSuffix(sanitized);
    if (formError) setFormError(null);
  };

  const handleSaveRoute = async () => {
    if (duplicateWarningMessage) {
      setFormError(duplicateWarningMessage);
      return;
    }

    if (!newRouteCodeSuffix.trim()) {
      setFormError(TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_CODE_REQUIRED);
      return;
    }

    const fullRouteCode = `JAK.${newRouteCodeSuffix.trim()}`;
    const codeValidation = validateRouteCode(fullRouteCode);
    if (!codeValidation.isValid) {
      setFormError(codeValidation.error || "Kode Rute tidak valid.");
      return;
    }

    const urlValidation = validateGoogleSheetsUrl(newRouteUrl);
    if (!urlValidation.isValid || !urlValidation.spreadsheetId) {
      setFormError(urlValidation.error || "Link Google Sheets tidak valid.");
      return;
    }

    // BUG-49: Validasi tahun — input number bisa kosong (Number('') = 0)
    // atau di luar rentang wajar; min/max HTML hanya membatasi spinner.
    if (!Number.isInteger(newYear) || newYear < 2020 || newYear > 2099) {
      setFormError(TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_INVALID);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const result = await createRouteWithSheet({
      routeCode: fullRouteCode,
      routeName: detectedRouteName || fullRouteCode,
      year: newYear,
      month: newMonth,
      sheetUrl: newRouteUrl.trim(),
      spreadsheetId: urlValidation.spreadsheetId,
    });

    setIsSaving(false);

    if (result.success) {
      await loadRoutes();
      setSheetUrl(newRouteUrl.trim());
      setSelectedRouteCode(fullRouteCode);
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      // BUG-2: setelah tambah rute sukses, reset dropdown tanggal ke hari ini
      // (mode normal) agar konsisten dengan rute baru yang disimpan.
      const today = String(new Date().getDate());
      const defaultDay = days.includes(today) ? today : days[0] || "";
      if (!isAccumulation) {
        setSelectedTab(defaultDay);
      }
      resetForm();
      // BUG-67: teruskan tab eksplisit agar Dashboard load data rute baru;
      // isRefresh=true memaksa reload walaupun busData sudah ada (auto-load
      // effect terblokir oleh guard busData).
      onLoadData(isAccumulation ? undefined : defaultDay);
    } else {
      setFormError(
        result.message || TEXT_DASHBOARD.ROUTE_SELECTOR.SAVE_ROUTE_FAILED,
      );
    }
  };

  return {
    isAddingRoute,
    setIsAddingRoute,
    isSaving,
    formError,
    newRouteCodeSuffix,
    newRouteUrl,
    setNewRouteUrl,
    newMonth,
    setNewMonth,
    newYear,
    setNewYear,
    checkStatus,
    checkMessage,
    duplicateWarningMessage,
    isCheckingLink,
    handleRouteCodeSuffixInput,
    handleSaveRoute,
    resetForm,
  };
}
