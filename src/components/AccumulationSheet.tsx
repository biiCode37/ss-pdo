import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Layers } from "lucide-react";
import { fetchRoutesWithSheets } from "../services/routeService";
import { getRoutesFromCache } from "../utils/cacheUtils";
import { TEXT_COMMON, TEXT_DASHBOARD } from "../constants/texts";

// ponytail: centralized month names dictionary from TEXT_COMMON
const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    startDay: number,
    startMonth: number,
    startYear: number,
    endDay: number,
    endMonth: number,
    endYear: number,
  ) => void;
  currentMonth?: number;
  currentYear?: number;
  isAccumulationActive?: boolean;
  onResetAccumulation?: () => void;
}

export function AccumulationSheet({
  isOpen,
  onClose,
  onApply,
  currentMonth,
  currentYear,
  isAccumulationActive,
  onResetAccumulation,
}: Props) {
  const today = new Date();
  const defaultMonth = currentMonth || today.getMonth() + 1;
  const defaultYear = currentYear || today.getFullYear();

  /** Jumlah hari valid untuk bulan/tahun tertentu (BUG-51: cegah 31 Feb) */
  const getDaysInMonth = (month: number, year: number): number =>
    new Date(year, month, 0).getDate();

  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [startYear, setStartYear] = useState(defaultYear);
  const [startDay, setStartDay] = useState(1);

  const [endMonth, setEndMonth] = useState(defaultMonth);
  const [endYear, setEndYear] = useState(defaultYear);
  const [endDay, setEndDay] = useState(() => {
    if (defaultMonth === today.getMonth() + 1 && defaultYear === today.getFullYear()) {
      return today.getDate();
    }
    return getDaysInMonth(defaultMonth, defaultYear);
  });

  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      isClosingRef.current = false;
      return;
    }

    // BUG-52: Reset penuh state tanggal setiap kali sheet dibuka — sebelumnya
    // startDay/endDay mempertahankan nilai sesi terakhir (persist parsial).
    setStartDay(1);
    if (currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear()) {
      setEndDay(today.getDate());
    } else {
      setEndDay(getDaysInMonth(defaultMonth, defaultYear));
    }
    setRangeError(null);

    // Trigger entrance morphing animation after mount
    // BUG-53: simpan frame id & batalkan di cleanup (konsisten ProfileMenuSheet)
    const frameId = requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismissRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Lock body scrolling when modal is active (blokir sentuhan halaman belakang)
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentMonth, currentYear]);

  useEffect(() => {
    const loadDbPeriods = async (candidateStartMonth: number, candidateStartYear: number) => {
      try {
        let cachedRoutes = getRoutesFromCache();
        if (cachedRoutes.length === 0) {
          cachedRoutes = await fetchRoutesWithSheets();
        }

        const allSheets: any[] = [];
        for (const r of cachedRoutes) {
          for (const s of r.route_sheets || []) {
            allSheets.push(s);
          }
        }

        if (allSheets.length > 0) {
          const mSet = Array.from(new Set(allSheets.map((s) => s.month))).sort(
            (a, b) => a - b,
          );
          const ySet = Array.from(new Set(allSheets.map((s) => s.year))).sort(
            (a, b) => b - a,
          );

          setAvailableMonths(mSet);
          setAvailableYears(ySet);

          // BUG-54: Bandingkan terhadap kandidat eksplisit (nilai reset),
          // bukan state closure yang basi sebelum reset sinkron efektif.
          if (mSet.length > 0 && !mSet.includes(candidateStartMonth)) {
            setStartMonth(mSet[0]);
            setEndMonth(mSet[mSet.length - 1]);
          }
          if (ySet.length > 0 && !ySet.includes(candidateStartYear)) {
            setStartYear(ySet[0]);
            setEndYear(ySet[0]);
          }
        }
      } catch (_e) {}
    };

    if (isOpen) {
      const baseMonth = currentMonth || defaultMonth;
      const baseYear = currentYear || defaultYear;
      if (currentMonth) {
        setStartMonth(currentMonth);
        setEndMonth(currentMonth);
      }
      if (currentYear) {
        setStartYear(currentYear);
        setEndYear(currentYear);
      }
      loadDbPeriods(baseMonth, baseYear);
    }
  }, [isOpen, currentMonth, currentYear]);

  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  // Ref agar listener Escape selalu memanggil handleDismiss terbaru
  const handleDismissRef = useRef(handleDismiss);
  handleDismissRef.current = handleDismiss;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isDraggingRef.current = true;
      currentDragYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current || touchStartYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && contentRef.current) {
      currentDragYRef.current = diff;
      contentRef.current.style.transition = 'none';
      contentRef.current.style.transform = `translateY(${diff}px) scale(${Math.max(0.95, 1 - diff / 2000)})`;
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'none';
        const opacity = Math.max(0.2, 0.65 - diff / 500);
        overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = currentDragYRef.current;
    const duration = Date.now() - touchStartTimeRef.current;
    const velocity = duration > 0 ? diff / duration : 0;
    touchStartYRef.current = 0;

    if (diff > 60 || (diff > 25 && velocity > 0.35)) {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(100%) scale(0.95)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.opacity = '0';
      }
      handleDismiss();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(0px) scale(1)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
      }
    }
  };

  const handleApply = () => {
    // BUG-51: Validasi rentang — tolak rentang terbalik & tanggal mustahil
    const startNum = startYear * 10000 + startMonth * 100 + Math.min(startDay, getDaysInMonth(startMonth, startYear));
    const endNum = endYear * 10000 + endMonth * 100 + Math.min(endDay, getDaysInMonth(endMonth, endYear));
    if (startNum > endNum) {
      setRangeError(TEXT_DASHBOARD.ACCUMULATION_SHEET.ERROR_DATE_RANGE);
      return;
    }

    setRangeError(null);
    onApply(
      Math.min(startDay, getDaysInMonth(startMonth, startYear)),
      startMonth,
      startYear,
      Math.min(endDay, getDaysInMonth(endMonth, endYear)),
      endMonth,
      endYear,
    );
    handleDismiss();
  };

  if (!isOpen) return null;

  // BUG-51: Daftar hari mengikuti jumlah hari riil bulan terpilih
  // (sebelumnya selalu 1-31 sehingga "31 Februari" mungkin dipilih).
  const days = Array.from({ length: getDaysInMonth(startMonth, startYear) }, (_, i) => i + 1);
  const endDays = Array.from({ length: getDaysInMonth(endMonth, endYear) }, (_, i) => i + 1);

  // Clamp nilai hari bila melebihi jumlah hari bulan aktif
  const safeStartDay = Math.min(startDay, days.length);
  const safeEndDay = Math.min(endDay, endDays.length);

  const renderMonthOptions = (selectedVal: number) => {
    const list = availableMonths.length > 0 ? availableMonths : [selectedVal];
    return list.map((m) => (
      <option key={m} value={m}>
        {MONTH_NAMES_ID[m] || `Bulan ${m}`}
      </option>
    ));
  };

  const renderYearOptions = (selectedVal: number) => {
    const list = availableYears.length > 0 ? availableYears : [selectedVal];
    return list.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ));
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay accumulation-sheet-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      onClick={handleDismiss}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass accumulation-sheet-content"
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "min(88dvh, 760px)",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding:
            "20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderBottom: "none",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)",
          transform: isClosing || !isMounted ? "translateY(100%) scale(0.95)" : "translateY(0px) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top Handle Bar for Touch Swipe Down to Close */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--text-secondary)",
              opacity: 0.3,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} style={{ color: "var(--accent-color)" }} />
            <span
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--text-primary)",
              }}
            >
              {TEXT_DASHBOARD.ACCUMULATION_SHEET.TITLE}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Deskripsi */}
        <p
          style={{
            fontSize: "12.5px",
            color: "var(--text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.4,
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.DESC}
        </p>

        {/* Section 1: Dari Periode */}
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent-color)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_DASHBOARD.ACCUMULATION_SHEET.FROM_LABEL}
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 90px",
              gap: "8px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_LABEL}
              </label>
              <select
                className="input-field"
                value={safeStartDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_LABEL}
              </label>
              <select
                className="input-field"
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {renderMonthOptions(startMonth)}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_LABEL}
              </label>
              <select
                className="input-field"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {renderYearOptions(startYear)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Sampai Periode */}
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent-color)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            {TEXT_DASHBOARD.ACCUMULATION_SHEET.TO_LABEL}
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 90px",
              gap: "8px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_LABEL}
              </label>
              <select
                className="input-field"
                value={safeEndDay}
                onChange={(e) => setEndDay(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {endDays.map((d) => (
                  <option key={d} value={d}>
                    {TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_LABEL}
              </label>
              <select
                className="input-field"
                value={endMonth}
                onChange={(e) => setEndMonth(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {renderMonthOptions(endMonth)}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_LABEL}
              </label>
              <select
                className="input-field"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {renderYearOptions(endYear)}
              </select>
            </div>
          </div>
        </div>

        {/* Preview Badge */}
        <div
          style={{
            background: "rgba(62, 207, 142, 0.1)",
            border: "1px solid rgba(62, 207, 142, 0.25)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "12.5px",
            color: "var(--accent-color)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Layers size={14} style={{ flexShrink: 0 }} />
          <span>
            Rentang: {safeStartDay} {MONTH_NAMES_ID[startMonth] || startMonth}{" "}
            {startYear} — {safeEndDay} {MONTH_NAMES_ID[endMonth] || endMonth}{" "}
            {endYear}
          </span>
        </div>

        {/* Error Validasi Rentang */}
        {rangeError && (
          <div
            role="alert"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "12.5px",
              color: "var(--danger-color, #ef4444)",
              fontWeight: 600,
            }}
          >
            ⚠️ {rangeError}
          </div>
        )}

        {/* Tombol Apply */}
        <button
          type="button"
          className="btn"
          onClick={handleApply}
          style={{
            width: "100%",
            padding: "12px",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {TEXT_DASHBOARD.ACCUMULATION_SHEET.APPLY_BTN}
        </button>

        {/* Tombol Reset Mode Akumulasi (ACC-17-01) */}
        {isAccumulationActive && onResetAccumulation && (
          <button
            type="button"
            onClick={() => {
              onResetAccumulation();
              handleDismiss();
            }}
            style={{
              width: "100%",
              padding: "11px",
              fontWeight: 600,
              fontSize: "13px",
              marginTop: "8px",
              background: "transparent",
              border: "1px solid var(--card-border)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {TEXT_DASHBOARD.ACCUMULATION_SHEET.RESET_BTN}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
