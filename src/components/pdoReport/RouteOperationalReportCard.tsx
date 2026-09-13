import { useState, useEffect, useCallback, memo, type FormEvent } from "react";
import {
  fetchDailyRouteReport,
  upsertDailyRouteReport,
} from "@/services/dailyRouteReportService";
import type { DailyRouteReport } from "@/types/supabase";
import { showSuccessToast, showErrorAlert } from "@/utils/alertUtils";
import { TEXT_PDO_FORM, TEXT_ERRORS } from "@/constants/texts";
import {
  ReportArmadaSection,
  ReportHeadwaySection,
  ReportTrafficJamsSection,
  ReportIssuesSection,
  ReportModalLayout,
  ReportAccordionHeader,
} from "./index";

export interface RouteOperationalReportCardProps {
  routeId: number;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  defaultTrafficJamSpots?: string[];
  defaultRenops?: number;
  userEmail?: string;
  onSaved?: () => void;
  onStatusChange?: (status: "draft" | "submitted" | "verified") => void;
  asModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

function RouteOperationalReportCardComponent({
  routeId,
  routeCode,
  selectedDate,
  defaultTrafficJamSpots = [],
  defaultRenops = 0,
  userEmail,
  onSaved,
  onStatusChange,
  asModal = false,
  isOpen = true,
  onClose,
}: RouteOperationalReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [renopsS1, setRenopsS1] = useState<number>(defaultRenops);
  const [realopsS1, setRealopsS1] = useState<number>(defaultRenops);
  const [renopsS2, setRenopsS2] = useState<number>(defaultRenops);
  const [realopsS2, setRealopsS2] = useState<number>(defaultRenops);
  const [headwayFastest, setHeadwayFastest] = useState<number>(3);
  const [headwaySlowest, setHeadwaySlowest] = useState<number>(10);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [newSpotText, setNewSpotText] = useState("");
  const [operationalIssues, setOperationalIssues] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted" | "verified">("draft");

  // Load existing report
  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      if (!routeId || !selectedDate || (asModal && !isOpen)) return;
      setLoading(true);
      try {
        const report = await fetchDailyRouteReport(routeId, selectedDate);
        if (!isMounted) return;
        if (report) {
          setRenopsS1(report.renops_shift1 || defaultRenops);
          setRealopsS1(report.realops_shift1 || defaultRenops);
          setRenopsS2(report.renops_shift2 || defaultRenops);
          setRealopsS2(report.realops_shift2 || defaultRenops);
          setHeadwayFastest(report.headway_fastest || 3);
          setHeadwaySlowest(report.headway_slowest || 10);
          setSelectedSpots(report.traffic_jam_spots || []);
          setOperationalIssues(report.operational_issues || "");
          const nextStatus = report.status || "draft";
          setStatus(nextStatus);
          onStatusChange?.(nextStatus);
        } else {
          setRenopsS1(defaultRenops);
          setRealopsS1(defaultRenops);
          setRenopsS2(defaultRenops);
          setRealopsS2(defaultRenops);
          setHeadwayFastest(3);
          setHeadwaySlowest(10);
          setSelectedSpots([]);
          setOperationalIssues("");
          setStatus("draft");
          onStatusChange?.("draft");
        }
      } catch (err) {
        console.warn("[RouteOperationalReportCard] Gagal memuat data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReport();
    return () => {
      isMounted = false;
    };
  }, [routeId, selectedDate, defaultRenops, onStatusChange, asModal, isOpen]);

  // Toggle Traffic Jam Chip
  const toggleSpot = useCallback((spot: string) => {
    setSelectedSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot],
    );
  }, []);

  // Add Custom Spot
  const handleAddCustomSpot = useCallback(() => {
    const trimmed = newSpotText.trim();
    if (!trimmed) return;
    if (!selectedSpots.includes(trimmed)) {
      setSelectedSpots((prev) => [...prev, trimmed]);
    }
    setNewSpotText("");
  }, [newSpotText, selectedSpots]);

  // Submit Handler
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<DailyRouteReport> & {
        route_id: number;
        route_code: string;
        date: string;
      } = {
        route_id: routeId,
        route_code: routeCode,
        date: selectedDate,
        renops_shift1: Number(renopsS1) || 0,
        realops_shift1: Number(realopsS1) || 0,
        renops_shift2: Number(renopsS2) || 0,
        realops_shift2: Number(realopsS2) || 0,
        headway_fastest: Number(headwayFastest) || 0,
        headway_slowest: Number(headwaySlowest) || 0,
        traffic_jam_spots: selectedSpots,
        operational_issues: operationalIssues.trim(),
        status: "submitted",
        submitted_by: userEmail || "Petugas PDO",
      };

      await upsertDailyRouteReport(payload);
      setStatus("submitted");
      onStatusChange?.("submitted");
      showSuccessToast(TEXT_PDO_FORM.TOAST_SUCCESS);
      if (onSaved) onSaved();
    } catch (err: any) {
      showErrorAlert(
        "Gagal Menyimpan",
        err?.message || TEXT_ERRORS.DEFAULT_FALLBACK,
      );
    } finally {
      setSaving(false);
    }
  };

  const allAvailableSpots = Array.from(
    new Set([...defaultTrafficJamSpots, ...selectedSpots]),
  );

  const formBody = (
    <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
      <ReportArmadaSection
        renopsS1={renopsS1}
        realopsS1={realopsS1}
        renopsS2={renopsS2}
        realopsS2={realopsS2}
        onRenopsS1Change={setRenopsS1}
        onRealopsS1Change={setRealopsS1}
        onRenopsS2Change={setRenopsS2}
        onRealopsS2Change={setRealopsS2}
      />

      <ReportHeadwaySection
        headwayFastest={headwayFastest}
        headwaySlowest={headwaySlowest}
        onHeadwayFastestChange={setHeadwayFastest}
        onHeadwaySlowestChange={setHeadwaySlowest}
      />

      <ReportTrafficJamsSection
        availableSpots={allAvailableSpots}
        selectedSpots={selectedSpots}
        newSpotText={newSpotText}
        onToggleSpot={toggleSpot}
        onNewSpotTextChange={setNewSpotText}
        onAddCustomSpot={handleAddCustomSpot}
      />

      <ReportIssuesSection
        operationalIssues={operationalIssues}
        onOperationalIssuesChange={setOperationalIssues}
        saving={saving}
        loading={loading}
      />
    </form>
  );

  if (asModal) {
    return (
      <ReportModalLayout
        isOpen={!!isOpen}
        onClose={onClose}
        routeCode={routeCode}
        status={status}
      >
        {formBody}
      </ReportModalLayout>
    );
  }

  return (
    <div
      className="glass pdo-operational-card"
      style={{
        borderRadius: "16px",
        padding: "16px 18px",
        marginBottom: "16px",
        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ReportAccordionHeader
        routeCode={routeCode}
        status={status}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && formBody}
    </div>
  );
}

export const RouteOperationalReportCard = memo(
  RouteOperationalReportCardComponent,
);
export default RouteOperationalReportCard;
