import React from "react";
import { parseIndonesianNumber } from "@/utils/numberUtils";
import { MAX_TRIP_COUNT } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "./useBusInputForm";
import { BusFormField } from "./fields/BusFormField";
import type { UnitPlottingItem } from "@/types/supabase";
import {
  calculateSmartTripSplit,
  validateSmartTripPhysicalInvariants,
} from "@/utils/smartRitaseUtils";
import { AlertTriangle, MapPin, Zap } from "lucide-react";

interface BusInputModalTripProps {
  form: BusInputFormReturn;
  tripPergiLabel: string;
  tripPulangLabel: string;
  plottingItem?: UnitPlottingItem | null;
  endpointAName?: string;
  endpointBName?: string;
}

const PRESET_RITASE = [6.5, 7.0, 7.5, 8.0];

export const BusInputModalTrip: React.FC<BusInputModalTripProps> = ({
  form,
  tripPergiLabel,
  tripPulangLabel,
  plottingItem,
  endpointAName = "Titik A",
  endpointBName = "Titik B",
}) => {
  const {
    tripPergiInputRef,
    tripPergi,
    setTripPergi,
    tripPulang,
    setTripPulang,
    handleInputFocus,
    handleInputKeyDown,
  } = form;

  const numPergi = parseIndonesianNumber(tripPergi) || 0;
  const numPulang = parseIndonesianNumber(tripPulang) || 0;

  // ponytail: 1 Ritase = 2 Trip (PP / Pulang-Pergi)
  const totalRitasePP = Number(((numPergi + numPulang) / 2).toFixed(1));

  const startPoint = plottingItem?.start_point || "A";
  const startBaseName = startPoint === "A" ? endpointAName : endpointBName;

  // Validasi Fisika Rute
  const validation = validateSmartTripPhysicalInvariants({
    tripPergi: numPergi,
    tripPulang: numPulang,
    startPoint,
    endpointAName,
    endpointBName,
  });

  const handleApplyPreset = (targetRit: number) => {
    const split = calculateSmartTripSplit(targetRit, startPoint);
    setTripPergi(split.tripPergi.toString());
    setTripPulang(split.tripPulang.toString());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Target Ritase & Info Start Point (Jika ada plotting) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: "8px",
          background: "var(--color-surface-default, rgba(255, 255, 255, 0.04))",
          border: "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))",
          fontSize: "0.78rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={13} color="var(--color-action-primary-bg, #38bdf8)" />
          <span style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
            Start Awal:
          </span>
          <span style={{ fontWeight: 700, color: "var(--color-text-primary, #f8fafc)" }}>
            {startBaseName}
          </span>
        </div>

        {plottingItem && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "var(--color-text-secondary, #94a3b8)" }}>
              Target:
            </span>
            <span style={{ fontWeight: 800, color: "#38bdf8" }}>
              {plottingItem.target_ritase} Rit
            </span>
          </div>
        )}
      </div>

      {/* Preset Cepat Ritase Pintar */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            fontSize: "0.74rem",
            color: "var(--color-text-secondary, #94a3b8)",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <Zap size={12} color="#fbbf24" /> Auto-Set:
        </span>
        {PRESET_RITASE.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleApplyPreset(val)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              border:
                totalRitasePP === val
                  ? "1px solid var(--color-action-primary-bg, #38bdf8)"
                  : "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))",
              background:
                totalRitasePP === val
                  ? "rgba(56, 189, 248, 0.15)"
                  : "var(--color-surface-default, rgba(255, 255, 255, 0.05))",
              color:
                totalRitasePP === val
                  ? "var(--color-action-primary-bg, #38bdf8)"
                  : "var(--color-text-primary, #f8fafc)",
              transition: "all 0.15s ease",
            }}
          >
            {val} Rit
          </button>
        ))}
      </div>

      {/* Grid 2 Kolom untuk Input Trip Pergi & Pulang */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <BusFormField
          ref={tripPergiInputRef}
          id="input-trip-pergi"
          label={tripPergiLabel}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TRIP_COUNT}
          value={tripPergi}
          onChange={(e) => setTripPergi(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder="0"
        />

        <BusFormField
          id="input-trip-pulang"
          label={tripPulangLabel}
          variant="hero"
          type="number"
          min="0"
          max={MAX_TRIP_COUNT}
          value={tripPulang}
          onChange={(e) => setTripPulang(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder="0"
        />
      </div>

      {/* Total Ritase Live Summary & Titik Akhir */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "12px",
          background: "rgba(56, 189, 248, 0.08)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary, #94a3b8)", fontWeight: 500 }}>
            {TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TRIP_LABEL}
          </span>
          {validation.isValid && validation.finalEndpoint && totalRitasePP > 0 && (
            <div
              style={{
                fontSize: "0.72rem",
                color: validation.isBackToBase ? "#4ade80" : "#fbbf24",
                fontWeight: 600,
                marginTop: "2px",
              }}
            >
              📍 Titik Akhir: {validation.finalEndpoint} ({validation.isBackToBase ? "Kembali" : "Di Seberang"})
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-color, #38bdf8)" }}>
            {totalRitasePP}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary, #94a3b8)" }}>
            {TEXT_ALERTS.BUS_INPUT_MODAL.TRIP_UNIT} (PP)
          </span>
        </div>
      </div>

      {/* Peringatan Invarian Fisika (Jika Ada Kesalahan Arah atau Selisih > 1) */}
      {!validation.isValid && validation.warning && (
        <div
          data-testid="trip-physical-warning"
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.76rem",
            color: "#f87171",
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{validation.warning}</span>
        </div>
      )}
    </div>
  );
};
