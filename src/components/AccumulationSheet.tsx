import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Layers } from "lucide-react";
import { fetchRoutesWithSheets } from "../services/routeService";

const MONTH_NAMES_ID = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

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
}

export function AccumulationSheet({
  isOpen,
  onClose,
  onApply,
  currentMonth,
  currentYear,
}: Props) {
  const today = new Date();
  const defaultMonth = currentMonth || today.getMonth() + 1;
  const defaultYear = currentYear || today.getFullYear();

  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [startYear, setStartYear] = useState(defaultYear);
  const [startDay, setStartDay] = useState(1);

  const [endMonth, setEndMonth] = useState(defaultMonth);
  const [endYear, setEndYear] = useState(defaultYear);
  const [endDay, setEndDay] = useState(
    defaultMonth === today.getMonth() + 1 ? today.getDate() : 31,
  );

  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Gesture & Morphing State (Identik dengan UnitDetailModal)
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      setDragY(0);
      return;
    }

    // Trigger entrance morphing animation after mount
    requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Lock body scrolling when modal is active (blokir sentuhan halaman belakang)
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const loadDbPeriods = async () => {
      try {
        let cachedRoutes: any[] = [];
        const cachedStr = localStorage.getItem("PDO_CACHE_ROUTES");
        if (cachedStr) {
          cachedRoutes = JSON.parse(cachedStr);
        } else {
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

          if (mSet.length > 0) {
            if (!mSet.includes(startMonth)) {
              setStartMonth(mSet[0]);
              setEndMonth(mSet[mSet.length - 1]);
            }
          }
          if (ySet.length > 0) {
            if (!ySet.includes(startYear)) {
              setStartYear(ySet[0]);
              setEndYear(ySet[0]);
            }
          }
        }
      } catch (_e) {}
    };

    if (isOpen) {
      if (currentMonth) {
        setStartMonth(currentMonth);
        setEndMonth(currentMonth);
      }
      if (currentYear) {
        setStartYear(currentYear);
        setEndYear(currentYear);
      }
      loadDbPeriods();
    }
  }, [isOpen, currentMonth, currentYear]);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      setTouchStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging || touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dragY > 90) {
      handleDismiss();
    } else {
      setDragY(0);
    }
    setTouchStartY(0);
    setIsDragging(false);
  };

  const handleApply = () => {
    onApply(startDay, startMonth, startYear, endDay, endMonth, endYear);
    handleDismiss();
  };

  if (!isOpen) return null;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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

  const opacityValue = isClosing
    ? 0
    : isMounted
      ? Math.max(0.15, 0.65 - dragY / 400)
      : 0;

  const modalTransform = isClosing
    ? "translateY(100%) scale(0.95)"
    : !isMounted
      ? "translateY(100%) scale(0.95)"
      : `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1500)})`;

  return createPortal(
    <div
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
        backgroundColor: `rgba(0, 0, 0, ${opacityValue})`,
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
          maxHeight: "88vh",
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
          transform: modalTransform,
          transition: isDragging
            ? "none"
            : "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
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
              Rekap Akumulasi Lintas Periode
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
          Pilih tanggal, bulan, dan tahun awal s/d tanggal, bulan, dan tahun
          akhir dari data yang tersedia.
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
            DARI PERIODE
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
                Tanggal
              </label>
              <select
                className="input-field"
                value={startDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    Tgl {d}
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
                Bulan
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
                Tahun
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
            SAMPAI PERIODE
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
                Tanggal
              </label>
              <select
                className="input-field"
                value={endDay}
                onChange={(e) => setEndDay(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", fontSize: "12.5px" }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    Tgl {d}
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
                Bulan
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
                Tahun
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
            background: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
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
            Rentang: {startDay} {MONTH_NAMES_ID[startMonth] || startMonth}{" "}
            {startYear} — {endDay} {MONTH_NAMES_ID[endMonth] || endMonth}{" "}
            {endYear}
          </span>
        </div>

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
          Terapkan Akumulasi Lintas Periode
        </button>
      </div>
    </div>,
    document.body,
  );
}
