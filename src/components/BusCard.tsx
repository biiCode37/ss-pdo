import { useState, useEffect, useRef, memo } from "react";
import { useDebounce } from "../hooks/useDebounce";
import type { BusData, HeaderMap } from "../services/googleSheets";
import { updateBusData, getBusRowData } from "../services/googleSheets";
import { isNetworkError } from "../hooks/useOfflineSync";
import { formatUserError } from "../utils/errorFormatter";
import { slugifyUnitId } from "../utils/analytics";
import { parseIndonesianNumber } from "../utils/numberUtils";
import {
  Save,
  Loader2,
  Check,
  Copy,
  AlertTriangle,
  Navigation,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Props {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  isQueued: boolean;
  addToQueue: (item: any) => void;
  activeCategory: string;
  onUpdateBus?: (updates: Partial<BusData>) => void;
}

function BusCardComponent({
  bus,
  sheetId,
  tabName,
  headerMap,
  isQueued,
  addToQueue,
  activeCategory,
  onUpdateBus,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const draftKey = `draft_bus_${sheetId}_${tabName}_${bus.rowIndex}`;

  const isDirtyRef = useRef(false);

  const [formData, setFormData] = useState<Partial<BusData>>(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        const getVal = (key: keyof BusData): string => {
          const dVal = parsed[key];
          if (
            dVal !== undefined &&
            dVal !== null &&
            String(dVal).trim() !== ""
          ) {
            return String(dVal);
          }
          const bVal = bus[key];
          return typeof bVal === "string" ? bVal : "";
        };
        return {
          toaShift1: getVal("toaShift1"),
          manualShift1: getVal("manualShift1"),
          manualShift2: getVal("manualShift2"),
          totalToa: getVal("totalToa"),
          kmAwal1: getVal("kmAwal1"),
          kmAkhir1: getVal("kmAkhir1"),
          kmAwal2: getVal("kmAwal2"),
          kmAkhir2: getVal("kmAkhir2"),
          keterangan: getVal("keterangan"),
        };
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return {
      toaShift1: bus.toaShift1 || "",
      manualShift1: bus.manualShift1 || "",
      manualShift2: bus.manualShift2 || "",
      totalToa: bus.totalToa || "",
      kmAwal1: bus.kmAwal1 || "",
      kmAkhir1: bus.kmAkhir1 || "",
      kmAwal2: bus.kmAwal2 || "",
      kmAkhir2: bus.kmAkhir2 || "",
      keterangan: bus.keterangan || "",
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "queued">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [conflictData, setConflictData] = useState<Partial<BusData> | null>(
    null,
  );

  const debouncedFormData = useDebounce(formData, 1000);

  // Sync formData when bus prop changes from reload/refresh (if not dirty)
  useEffect(() => {
    if (!isDirtyRef.current) {
      setFormData({
        toaShift1: bus.toaShift1 || "",
        manualShift1: bus.manualShift1 || "",
        manualShift2: bus.manualShift2 || "",
        totalToa: bus.totalToa || "",
        kmAwal1: bus.kmAwal1 || "",
        kmAkhir1: bus.kmAkhir1 || "",
        kmAwal2: bus.kmAwal2 || "",
        kmAkhir2: bus.kmAkhir2 || "",
        keterangan: bus.keterangan || "",
      });
    }
  }, [bus]);

  const inputRefs = {
    toaShift1: useRef<HTMLInputElement>(null),
    totalToa: useRef<HTMLInputElement>(null),
    manualShift1: useRef<HTMLInputElement>(null),
    manualShift2: useRef<HTMLInputElement>(null),
    kmAwal1: useRef<HTMLInputElement>(null),
    kmAkhir1: useRef<HTMLInputElement>(null),
    kmAwal2: useRef<HTMLInputElement>(null),
    kmAkhir2: useRef<HTMLInputElement>(null),
    keterangan: useRef<HTMLInputElement>(null),
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      handleSave(false);
    }
  };

  useEffect(() => {
    // Only save draft when user has actively edited the fields
    if (isDirtyRef.current) {
      localStorage.setItem(draftKey, JSON.stringify(debouncedFormData));
    }
  }, [debouncedFormData, draftKey]);

  // BUG-09: Simpan draft segera saat user meninggalkan halaman
  useEffect(() => {
    const saveImmediately = () => {
      if (isDirtyRef.current) {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveImmediately();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveImmediately);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveImmediately);
    };
  }, [formData, draftKey]);

  useEffect(() => {
    if (isExpanded && activeCategory !== "ALL") {
      const timer = setTimeout(() => {
        const ref = inputRefs[activeCategory as keyof typeof inputRefs];
        if (ref && ref.current && !ref.current.disabled) {
          ref.current.focus();
        }
      }, 300); // Tunggu animasi expand selesai
      return () => clearTimeout(timer);
    }
  }, [isExpanded, activeCategory]);

  const handleChange =
    (field: keyof BusData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      isDirtyRef.current = true;
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setSaveStatus("idle");
      setError(null);
    };

  const handleCopyKm = () => {
    if (formData.kmAkhir1) {
      isDirtyRef.current = true;
      setFormData((prev) => ({ ...prev, kmAwal2: prev.kmAkhir1 }));
      setSaveStatus("idle");
      setError(null);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async (forceOverwrite = false) => {
    // Validation
    const checkKm = (awal?: string, akhir?: string) => {
      if (awal && akhir) {
        const numAwal = Number(awal);
        const numAkhir = Number(akhir);
        if (!isNaN(numAwal) && !isNaN(numAkhir) && numAkhir < numAwal) {
          return false;
        }
      }
      return true;
    };

    if (!checkKm(formData.kmAwal1, formData.kmAkhir1)) {
      setError("KM Akhir Shift 1 tidak boleh lebih kecil dari KM Awal Shift 1");
      return;
    }
    if (!checkKm(formData.kmAwal2, formData.kmAkhir2)) {
      setError("KM Akhir Shift 2 tidak boleh lebih kecil dari KM Awal Shift 2");
      return;
    }
    if (!checkKm(formData.kmAkhir1, formData.kmAwal2)) {
      setError("KM Awal Shift 2 tidak boleh lebih kecil dari KM Akhir Shift 1");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!forceOverwrite) {
        // Pre-flight check
        const remoteData = await getBusRowData(
          sheetId,
          tabName,
          bus.rowIndex,
          headerMap,
        );

        // Cek apakah ada field yang berubah dari snapshot asli (bus props)
        const fieldsToCheck: (keyof BusData)[] = [
          "toaShift1",
          "manualShift1",
          "manualShift2",
          "totalToa",
          "kmAwal1",
          "kmAkhir1",
          "kmAwal2",
          "kmAkhir2",
          "keterangan",
        ];

        let hasCollision = false;
        for (const field of fieldsToCheck) {
          if ((remoteData[field] || "") !== (bus[field] || "")) {
            hasCollision = true;
            break;
          }
        }

        if (hasCollision) {
          setConflictData(remoteData);
          setIsLoading(false);
          return; // Hentikan penyimpanan
        }
      }

      await updateBusData(sheetId, tabName, bus.rowIndex, formData, headerMap);
      isDirtyRef.current = false;
      setSaveStatus("success");
      localStorage.removeItem(draftKey);
      setConflictData(null);
      if (onUpdateBus) {
        onUpdateBus(formData);
      }
      setIsExpanded(false); // Auto close immediately on success
    } catch (err: any) {
      if (isNetworkError(err)) {
        // BUG-03: Hanya masukkan ke antrean jika benar-benar error jaringan
        // BUG-02: Sertakan originalSnapshot untuk collision detection di jalur antrean
        const originalSnapshot: Partial<BusData> = {
          toaShift1: bus.toaShift1,
          manualShift1: bus.manualShift1,
          manualShift2: bus.manualShift2,
          totalToa: bus.totalToa,
          kmAwal1: bus.kmAwal1,
          kmAkhir1: bus.kmAkhir1,
          kmAwal2: bus.kmAwal2,
          kmAkhir2: bus.kmAkhir2,
          keterangan: bus.keterangan,
        };
        addToQueue({
          sheetId,
          tabName,
          rowIndex: bus.rowIndex,
          updates: formData,
          headerMap,
          originalSnapshot,
        });
        isDirtyRef.current = false;
        setSaveStatus("queued");
        localStorage.removeItem(draftKey);
        setIsExpanded(false);
      } else {
        // BUG-30: Centrally format all errors (including session/auth/credentials) via formatUserError
        setSaveStatus("idle");
        setError(
          formatUserError(err, "Gagal menyimpan data bus. Silakan coba lagi."),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldDisabled = (fieldName: string) => {
    if (isLoading) return true;
    if (activeCategory === "ALL") return false;
    // BUG-07: Field pelengkap (catatan/manual) selalu aktif, bukan kolom kerja utama
    const alwaysEnabledFields = ["manualShift1", "manualShift2", "keterangan"];
    if (alwaysEnabledFields.includes(fieldName)) return false;
    return fieldName !== activeCategory;
  };

  const renderServerSummary = () => {
    // Hitung Total Pnp & Total KM untuk ringkasan kartu unit
    const toaShift1Num = parseIndonesianNumber(formData.toaShift1 || bus.toaShift1);
    const totalToaNum = parseIndonesianNumber(formData.totalToa || bus.totalToa);
    const manual1Num = parseIndonesianNumber(formData.manualShift1 || bus.manualShift1);
    const manual2Num = parseIndonesianNumber(formData.manualShift2 || bus.manualShift2);

    const totalToa = totalToaNum > 0 ? totalToaNum : toaShift1Num;
    const totalPnp = totalToa + manual1Num + manual2Num;

    const kmA1 = parseIndonesianNumber(formData.kmAwal1 || bus.kmAwal1);
    const kmAk1 = parseIndonesianNumber(formData.kmAkhir1 || bus.kmAkhir1);
    const kmS1 = kmAk1 > kmA1 ? kmAk1 - kmA1 : 0;

    const kmA2 = parseIndonesianNumber(formData.kmAwal2 || bus.kmAwal2);
    const kmAk2 = parseIndonesianNumber(formData.kmAkhir2 || bus.kmAkhir2);
    const kmS2 = kmAk2 > kmA2 ? kmAk2 - kmA2 : 0;

    const totalKm = kmS1 + kmS2;

    const hasKm = totalKm > 0 || !!(formData.kmAwal1 || bus.kmAwal1);
    const hasPnp =
      totalPnp > 0 || !!(formData.toaShift1 || bus.toaShift1 || bus.totalToa);

    // Kategori Spesifik (Jika BUKAN 'ALL')
    if (activeCategory !== "ALL") {
      const CATEGORY_LABELS: Record<string, string> = {
        toaShift1: "TOA S1",
        totalToa: "Total TOA",
        manualShift1: "Manual S1",
        manualShift2: "Manual S2",
        kmAwal1: "KM Awal S1",
        kmAkhir1: "KM Akhir S1",
        kmAwal2: "KM Awal S2",
        kmAkhir2: "KM Akhir S2",
        keterangan: "Keterangan",
      };
      const val =
        formData[activeCategory as keyof BusData] ??
        bus[activeCategory as keyof BusData];
      const label = CATEGORY_LABELS[activeCategory] || activeCategory;
      const isFilled =
        val !== undefined && val !== null && String(val).trim() !== "";

      return (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: isFilled
              ? "rgba(34, 197, 94, 0.15)"
              : "rgba(239, 68, 68, 0.15)",
            color: isFilled
              ? "var(--success-color, #22c55e)"
              : "var(--danger-color, #ef4444)",
            border: isFilled
              ? "1px solid rgba(34, 197, 94, 0.3)"
              : "1px solid rgba(239, 68, 68, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {isFilled ? (
            <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={12} style={{ flexShrink: 0 }} />
          )}
          <span>
            {label}: {isFilled ? String(val) : "0"}
          </span>
        </div>
      );
    }

    if (!hasKm && !hasPnp) {
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger-color, #ef4444)",
          }}
        >
          Kosong
        </span>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Badge 1: KM */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(56, 189, 248, 0.12)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Navigation size={12} style={{ flexShrink: 0 }} />
          <span>
            {totalKm > 0 ? `${totalKm.toLocaleString("id-ID")} KM` : `0 KM`}
          </span>
        </div>

        {/* Badge 2: Pnp */}
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            color: "var(--text-primary)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Users size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />
          <span>
            {totalPnp > 0 ? `${totalPnp.toLocaleString("id-ID")} Pnp` : `0 Pnp`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div id={`bus-card-${slugifyUnitId(bus.unit)}`} className="bus-card glass">
      <div
        className="bus-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Title: No Body / Unit */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 800, fontSize: "16px" }}>{bus.unit}</span>
          {(saveStatus === "queued" || isQueued) && (
            <span className="bus-card-status status-queued">
              Menunggu Sinyal
            </span>
          )}
        </div>

        {/* Pojok Kanan Atas: Helper Summary Badges (Terpisah KM & Pnp) */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {renderServerSummary()}
        </div>
      </div>

      {formData.keterangan && formData.keterangan.trim() !== "" && (
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            margin: "0 20px 12px 20px",
            fontSize: "12px",
            color: "#fdba74",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "6px",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <AlertTriangle
            size={14}
            style={{ color: "#f97316", flexShrink: 0 }}
          />
          <span
            style={{
              lineHeight: "1.4",
              wordBreak: "break-word",
              textTransform: "uppercase",
            }}
          >
            {formData.keterangan}
          </span>
        </div>
      )}

      {isExpanded && (
        <div className="bus-card-content">
          <div className="form-grid full">
            <div className="input-group">
              <label>TOA SHIFT 1</label>
              <input
                ref={inputRefs.toaShift1}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.toaShift1 || ""}
                onChange={handleChange("toaShift1")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("toaShift1")}
              />
            </div>
            <div className="input-group">
              <label>TOTAL TOA</label>
              <input
                ref={inputRefs.totalToa}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.totalToa || ""}
                onChange={handleChange("totalToa")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("totalToa")}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>MANUAL SHIFT 1</label>
              <input
                ref={inputRefs.manualShift1}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.manualShift1 || ""}
                onChange={handleChange("manualShift1")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("manualShift1")}
              />
            </div>
            <div className="input-group">
              <label>MANUAL SHIFT 2</label>
              <input
                ref={inputRefs.manualShift2}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.manualShift2 || ""}
                onChange={handleChange("manualShift2")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("manualShift2")}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>KM Awal Shift 1</label>
              <input
                ref={inputRefs.kmAwal1}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.kmAwal1 || ""}
                onChange={handleChange("kmAwal1")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("kmAwal1")}
              />
            </div>
            <div className="input-group">
              <label>KM Akhir Shift 1</label>
              <input
                ref={inputRefs.kmAkhir1}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.kmAkhir1 || ""}
                onChange={handleChange("kmAkhir1")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("kmAkhir1")}
              />
            </div>
          </div>

          <div className="form-grid">
            <div
              className="input-group"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label style={{ marginBottom: 0 }}>KM Awal Shift 2</label>
                <button
                  type="button"
                  onClick={handleCopyKm}
                  disabled={isFieldDisabled("kmAwal2") || !formData.kmAkhir1}
                  aria-label="Salin KM Akhir 1"
                  style={{
                    background: "none",
                    border: "none",
                    color: isCopied
                      ? "var(--success-color)"
                      : "var(--accent-color)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <input
                ref={inputRefs.kmAwal2}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.kmAwal2 || ""}
                onChange={handleChange("kmAwal2")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("kmAwal2")}
              />
            </div>
            <div
              className="input-group"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <label>KM Akhir Shift 2</label>
              <input
                ref={inputRefs.kmAkhir2}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                value={formData.kmAkhir2 || ""}
                onChange={handleChange("kmAkhir2")}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled("kmAkhir2")}
              />
            </div>
          </div>

          <div className="form-grid full">
            <div className="input-group">
              <label>KETERANGAN</label>
              <input
                ref={inputRefs.keterangan}
                type="text"
                className="input-field"
                value={formData.keterangan || ""}
                onChange={handleChange("keterangan")}
                onKeyDown={handleKeyDown}
                placeholder="Tambahkan keterangan..."
                disabled={isFieldDisabled("keterangan")}
              />
            </div>
          </div>

          {error && (
            <div className="error-text" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          {conflictData && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--danger-color)",
                borderRadius: "8px",
                padding: "12px",
                marginTop: "12px",
                marginBottom: "12px",
              }}
            >
              <h4
                style={{
                  color: "var(--danger-color)",
                  margin: "0 0 8px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ⚠️ Tabrakan Data Terdeteksi
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  margin: "0 0 12px 0",
                  lineHeight: 1.4,
                  color: "var(--text-secondary)",
                }}
              >
                Petugas lain baru saja mengubah data bus ini di Google Sheets.
                Berikut adalah rincian data terbaru dari server:
              </p>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginBottom: "12px",
                  fontSize: "12px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                      }}
                    >
                      <th style={{ padding: "4px 0" }}>KOLOM</th>
                      <th
                        style={{
                          padding: "4px 0",
                          color: "var(--accent-color)",
                        }}
                      >
                        DATA SERVER
                      </th>
                      <th
                        style={{
                          padding: "4px 0",
                          color: "var(--danger-color)",
                        }}
                      >
                        INPUT ANDA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: "toaShift1", label: "TOA Shift 1" },
                      { key: "totalToa", label: "Total TOA" },
                      { key: "manualShift1", label: "Manual Shift 1" },
                      { key: "manualShift2", label: "Manual Shift 2" },
                      { key: "kmAwal1", label: "KM Awal S1" },
                      { key: "kmAkhir1", label: "KM Akhir S1" },
                      { key: "kmAwal2", label: "KM Awal S2" },
                      { key: "kmAkhir2", label: "KM Akhir S2" },
                      { key: "keterangan", label: "Keterangan" },
                    ].map((f) => {
                      const serverVal =
                        conflictData[f.key as keyof BusData] || "";
                      const localVal = formData[f.key as keyof BusData] || "";
                      const isDiff =
                        serverVal !== (bus[f.key as keyof BusData] || "") ||
                        serverVal !== localVal;
                      if (!isDiff && !serverVal) return null;
                      return (
                        <tr
                          key={f.key}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <td style={{ padding: "6px 0", fontWeight: 600 }}>
                            {f.label}
                          </td>
                          <td
                            style={{
                              padding: "6px 0",
                              color: "var(--accent-color)",
                              fontWeight: "bold",
                            }}
                          >
                            {serverVal || (
                              <span
                                style={{ opacity: 0.5, fontStyle: "italic" }}
                              >
                                (Kosong)
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "6px 0",
                              color: isDiff
                                ? "var(--danger-color)"
                                : "var(--text-primary)",
                            }}
                          >
                            {localVal || (
                              <span
                                style={{ opacity: 0.5, fontStyle: "italic" }}
                              >
                                (Kosong)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={{ display: "flex", gap: "8px", flexDirection: "column" }}
              >
                <button
                  className="btn"
                  style={{
                    background: "var(--surface-color)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  onClick={() => {
                    isDirtyRef.current = false;
                    setFormData((prev) => ({ ...prev, ...conflictData }));
                    setConflictData(null);
                    setError(
                      "Form Anda telah diperbarui dengan data terbaru dari server.",
                    );
                  }}
                >
                  Gunakan Data Server
                </button>
                <button
                  className="btn"
                  style={{ background: "var(--danger-color)" }}
                  onClick={() => handleSave(true)}
                >
                  Tetap Timpa (Force Save)
                </button>
              </div>
            </div>
          )}

          <button
            className="btn"
            onClick={() => handleSave(false)}
            disabled={isLoading}
            style={{
              backgroundColor:
                saveStatus === "success" ? "var(--success-color)" : "",
              marginTop: "8px",
            }}
          >
            {isLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : saveStatus === "success" ? (
              <Check size={20} />
            ) : (
              <Save size={20} />
            )}
            {isLoading
              ? "Menyimpan..."
              : saveStatus === "success"
                ? "Tersimpan!"
                : "Simpan Data"}
          </button>
        </div>
      )}
    </div>
  );
}

export const BusCard = memo(BusCardComponent);
