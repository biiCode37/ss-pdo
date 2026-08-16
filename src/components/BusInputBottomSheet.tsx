import { useState, useEffect, useRef } from "react";
import type { BusData, HeaderMap } from "../services/googleSheets";
import { X, Loader2 } from "lucide-react";

export interface BusInputBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bus: BusData;
  activeCategory: string;
  headerMap?: HeaderMap;
  onSave: (updates: Partial<BusData>) => Promise<void>;
  isLoading?: boolean;
}

export function BusInputBottomSheet({
  isOpen,
  onClose,
  bus,
  activeCategory,
  headerMap,
  onSave,
  isLoading = false,
}: BusInputBottomSheetProps) {
  // Local state for all fields
  const [formData, setFormData] = useState<Partial<BusData>>({
    tripPergi: bus.tripPergi || "",
    tripPulang: bus.tripPulang || "",
    toaShift1: bus.toaShift1 || "",
    manualShift1: bus.manualShift1 || "",
    kmAwal1: bus.kmAwal1 || "",
    kmAkhir1: bus.kmAkhir1 || "",
    totalToa: bus.totalToa || "",
    manualShift2: bus.manualShift2 || "",
    kmAwal2: bus.kmAwal2 || "",
    kmAkhir2: bus.kmAkhir2 || "",
    keterangan: bus.keterangan || "",
  });

  // Progressive disclosure chip visibility for single column modes
  const [showManual1, setShowManual1] = useState(false);
  const [showManual2, setShowManual2] = useState(false);
  const [showKeterangan, setShowKeterangan] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or bus prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tripPergi: bus.tripPergi || "",
        tripPulang: bus.tripPulang || "",
        toaShift1: bus.toaShift1 || "",
        manualShift1: bus.manualShift1 || "",
        kmAwal1: bus.kmAwal1 || "",
        kmAkhir1: bus.kmAkhir1 || "",
        totalToa: bus.totalToa || "",
        manualShift2: bus.manualShift2 || "",
        kmAwal2: bus.kmAwal2 || "",
        kmAkhir2: bus.kmAkhir2 || "",
        keterangan: bus.keterangan || "",
      });

      setShowManual1(Boolean(bus.manualShift1 && bus.manualShift1.trim() !== ""));
      setShowManual2(Boolean(bus.manualShift2 && bus.manualShift2.trim() !== ""));
      setShowKeterangan(Boolean(bus.keterangan && bus.keterangan.trim() !== ""));

      // Focus first input smoothly after bottom sheet opens
      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
          firstInputRef.current.select();
        }
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen, bus]);

  if (!isOpen) return null;

  const isAll = activeCategory === "ALL";
  const tripPergiLabel = headerMap?.tripPergiLabel || "Trip Pergi";
  const tripPulangLabel = headerMap?.tripPulangLabel || "Trip Pulang";

  const handleInputChange = (field: keyof BusData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-scroll the focused input to center of viewport above mobile virtual keyboard
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    const updates: Partial<BusData> = {};

    if (isAll) {
      updates.tripPergi = formData.tripPergi || "";
      updates.tripPulang = formData.tripPulang || "";
      updates.toaShift1 = formData.toaShift1 || "";
      updates.manualShift1 = formData.manualShift1 || "";
      updates.kmAwal1 = formData.kmAwal1 || "";
      updates.kmAkhir1 = formData.kmAkhir1 || "";
      updates.totalToa = formData.totalToa || "";
      updates.manualShift2 = formData.manualShift2 || "";
      updates.kmAwal2 = formData.kmAwal2 || "";
      updates.kmAkhir2 = formData.kmAkhir2 || "";
      updates.keterangan = formData.keterangan || "";
    } else if (activeCategory === "toaShift1") {
      updates.toaShift1 = formData.toaShift1 || "";
      if (showManual1 || (formData.manualShift1 && formData.manualShift1.trim() !== "")) {
        updates.manualShift1 = formData.manualShift1 || "";
      }
      if (showKeterangan || (formData.keterangan && formData.keterangan.trim() !== "")) {
        updates.keterangan = formData.keterangan || "";
      }
    } else if (activeCategory === "totalToa") {
      updates.totalToa = formData.totalToa || "";
      if (showManual2 || (formData.manualShift2 && formData.manualShift2.trim() !== "")) {
        updates.manualShift2 = formData.manualShift2 || "";
      }
      if (showKeterangan || (formData.keterangan && formData.keterangan.trim() !== "")) {
        updates.keterangan = formData.keterangan || "";
      }
    } else {
      // Single KM Category
      const key = activeCategory as keyof BusData;
      (updates as Record<string, any>)[key] = formData[key] || "";
      if (showKeterangan || (formData.keterangan && formData.keterangan.trim() !== "")) {
        updates.keterangan = formData.keterangan || "";
      }
    }

    await onSave(updates);
  };

  const getSingleCategoryMeta = () => {
    switch (activeCategory) {
      case "kmAwal1":
        return { label: "KM Awal Shift 1", key: "kmAwal1" as keyof BusData };
      case "kmAkhir1":
        return { label: "KM Akhir Shift 1", key: "kmAkhir1" as keyof BusData };
      case "kmAwal2":
        return { label: "KM Awal Shift 2", key: "kmAwal2" as keyof BusData };
      case "kmAkhir2":
        return { label: "KM Akhir Shift 2", key: "kmAkhir2" as keyof BusData };
      default:
        return null;
    }
  };

  const singleMeta = getSingleCategoryMeta();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          margin: "0 auto",
          backgroundColor: "var(--card-bg, #0f172a)",
          borderTop: "1px solid var(--card-border, #334155)",
          borderTopLeftRadius: "22px",
          borderTopRightRadius: "22px",
          maxHeight: "calc(100dvh - 30px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.4)",
          animation: "slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Indicator Pill */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "10px", paddingBottom: "4px" }}>
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--card-border, #475569)",
              opacity: 0.8,
            }}
          />
        </div>

        {/* Sticky Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 18px 12px 18px",
            borderBottom: "1px solid var(--card-border, #1e293b)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {bus.unit}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--accent-color)",
                  background: "rgba(56, 189, 248, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                }}
              >
                {isAll ? "Semua Kolom" : activeCategory}
              </span>
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Baris spreadsheet ke-{bus.rowIndex}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "var(--input-bg, #1e293b)",
              border: "1px solid var(--card-border, #334155)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: "auto",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overscrollBehavior: "contain",
          }}
        >
          {isAll ? (
            /* Mode Semua Kolom (ALL) */
            <>
              {/* Trip Operasional */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(56, 189, 248, 0.06)",
                  border: "1px solid var(--shift1-border, rgba(56, 189, 248, 0.25))",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--accent-color)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Trip Operasional
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        display: "block",
                        marginBottom: "3px",
                        lineHeight: 1.3,
                      }}
                    >
                      {tripPergiLabel}
                    </label>
                    <input
                      ref={firstInputRef}
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px 10px", fontSize: "14px", fontWeight: 700, height: "38px" }}
                      value={formData.tripPergi || ""}
                      onChange={(e) => handleInputChange("tripPergi", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--text-secondary)",
                        display: "block",
                        marginBottom: "3px",
                        lineHeight: 1.3,
                      }}
                    >
                      {tripPulangLabel}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px 10px", fontSize: "14px", fontWeight: 700, height: "38px" }}
                      value={formData.tripPulang || ""}
                      onChange={(e) => handleInputChange("tripPulang", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Shift 1 */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(56, 189, 248, 0.06)",
                  border: "1px solid var(--shift1-border, rgba(56, 189, 248, 0.25))",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--shift1-color, #38bdf8)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Shift 1
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      TOA S1
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.toaShift1 || ""}
                      onChange={(e) => handleInputChange("toaShift1", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Manual S1
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.manualShift1 || ""}
                      onChange={(e) => handleInputChange("manualShift1", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      KM Awal S1
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.kmAwal1 || ""}
                      onChange={(e) => handleInputChange("kmAwal1", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      KM Akhir S1
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.kmAkhir1 || ""}
                      onChange={(e) => handleInputChange("kmAkhir1", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Shift 2 */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(192, 132, 252, 0.06)",
                  border: "1px solid var(--shift2-border, rgba(192, 132, 252, 0.25))",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--shift2-color, #c084fc)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Shift 2
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Total TOA
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.totalToa || ""}
                      onChange={(e) => handleInputChange("totalToa", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      Manual S2
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.manualShift2 || ""}
                      onChange={(e) => handleInputChange("manualShift2", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      KM Awal S2
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.kmAwal2 || ""}
                      onChange={(e) => handleInputChange("kmAwal2", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "2px" }}>
                      KM Akhir S2
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input-field"
                      style={{ padding: "8px", fontSize: "13.5px", height: "38px" }}
                      value={formData.kmAkhir2 || ""}
                      onChange={(e) => handleInputChange("kmAkhir2", e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: "8px 10px", fontSize: "13px", height: "38px" }}
                  value={formData.keterangan || ""}
                  onChange={(e) => handleInputChange("keterangan", e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Catatan unit..."
                />
              </div>
            </>
          ) : activeCategory === "toaShift1" ? (
            /* Mode Khusus TOA Shift 1 */
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--shift1-color, #38bdf8)", marginBottom: "6px", textTransform: "uppercase" }}>
                  TOA Shift 1
                </label>
                <input
                  ref={firstInputRef}
                  type="number"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="0"
                  value={formData.toaShift1 || ""}
                  onChange={(e) => handleInputChange("toaShift1", e.target.value)}
                  onFocus={handleInputFocus}
                  style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", height: "48px", borderRadius: "12px", border: "1.5px solid var(--shift1-border, #38bdf8)", width: "100%" }}
                />
              </div>

              {showManual1 && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--shift1-color, #38bdf8)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Manual Shift 1
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="0"
                    value={formData.manualShift1 || ""}
                    onChange={(e) => handleInputChange("manualShift1", e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ fontSize: "16px", fontWeight: 700, textAlign: "center", height: "42px", borderRadius: "10px", width: "100%" }}
                  />
                </div>
              )}

              {showKeterangan && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Catatan unit..."
                    value={formData.keterangan || ""}
                    onChange={(e) => handleInputChange("keterangan", e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "10px", width: "100%" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {!showManual1 && (
                  <button
                    type="button"
                    onClick={() => setShowManual1(true)}
                    className="pdo-swal-chip"
                  >
                    + Manual S1
                  </button>
                )}
                {!showKeterangan && (
                  <button
                    type="button"
                    onClick={() => setShowKeterangan(true)}
                    className="pdo-swal-chip pdo-swal-chip-right"
                  >
                    + Catatan
                  </button>
                )}
              </div>
            </>
          ) : activeCategory === "totalToa" ? (
            /* Mode Khusus Total TOA */
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--shift2-color, #c084fc)", marginBottom: "6px", textTransform: "uppercase" }}>
                  Total TOA
                </label>
                <input
                  ref={firstInputRef}
                  type="number"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="0"
                  value={formData.totalToa || ""}
                  onChange={(e) => handleInputChange("totalToa", e.target.value)}
                  onFocus={handleInputFocus}
                  style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", height: "48px", borderRadius: "12px", border: "1.5px solid var(--shift2-border, #c084fc)", width: "100%" }}
                />
              </div>

              {showManual2 && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--shift2-color, #c084fc)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Manual Shift 2
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="0"
                    value={formData.manualShift2 || ""}
                    onChange={(e) => handleInputChange("manualShift2", e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ fontSize: "16px", fontWeight: 700, textAlign: "center", height: "42px", borderRadius: "10px", width: "100%" }}
                  />
                </div>
              )}

              {showKeterangan && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Catatan unit..."
                    value={formData.keterangan || ""}
                    onChange={(e) => handleInputChange("keterangan", e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "10px", width: "100%" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                {!showManual2 && (
                  <button
                    type="button"
                    onClick={() => setShowManual2(true)}
                    className="pdo-swal-chip"
                  >
                    + Manual S2
                  </button>
                )}
                {!showKeterangan && (
                  <button
                    type="button"
                    onClick={() => setShowKeterangan(true)}
                    className="pdo-swal-chip pdo-swal-chip-right"
                  >
                    + Catatan
                  </button>
                )}
              </div>
            </>
          ) : singleMeta ? (
            /* Mode Single KM */
            <>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                  {singleMeta.label}
                </label>
                <input
                  ref={firstInputRef}
                  type="number"
                  inputMode="numeric"
                  className="input-field"
                  placeholder="0"
                  value={(formData[singleMeta.key] as string) || ""}
                  onChange={(e) => handleInputChange(singleMeta.key, e.target.value)}
                  onFocus={handleInputFocus}
                  style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", height: "48px", borderRadius: "12px", border: "1.5px solid var(--accent-color)", width: "100%" }}
                />
              </div>

              {showKeterangan && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Catatan unit..."
                    value={formData.keterangan || ""}
                    onChange={(e) => handleInputChange("keterangan", e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ fontSize: "13px", height: "38px", borderRadius: "10px", width: "100%" }}
                  />
                </div>
              )}

              {!showKeterangan && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setShowKeterangan(true)}
                    className="pdo-swal-chip pdo-swal-chip-right"
                  >
                    + Catatan
                  </button>
                </div>
              )}
            </>
          ) : null}
        </form>

        {/* Sticky Action Footer */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "12px 18px",
            borderTop: "1px solid var(--card-border, #1e293b)",
            backgroundColor: "var(--card-bg, #0f172a)",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-outline"
            style={{
              flex: 1,
              height: "42px",
              fontSize: "13.5px",
              fontWeight: 600,
              borderRadius: "12px",
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="btn"
            style={{
              flex: 1.6,
              height: "42px",
              fontSize: "13.5px",
              fontWeight: 700,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Menyimpan...</span>
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
