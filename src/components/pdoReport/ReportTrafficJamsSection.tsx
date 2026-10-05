import React from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { TEXT_PDO_FORM } from "@/constants/texts";

interface ReportTrafficJamsSectionProps {
  availableSpots: string[];
  selectedSpots: string[];
  newSpotText: string;
  onToggleSpot: (spot: string) => void;
  onNewSpotTextChange: (text: string) => void;
  onAddCustomSpot: () => void;
}

export const ReportTrafficJamsSection: React.FC<
  ReportTrafficJamsSectionProps
> = ({
  availableSpots,
  selectedSpots,
  newSpotText,
  onToggleSpot,
  onNewSpotTextChange,
  onAddCustomSpot,
}) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
        }}
      >
        <AlertTriangle size={14} color="var(--warning-color, #f59e0b)" />
        <label
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            margin: 0,
          }}
        >
          {TEXT_PDO_FORM.TRAFFIC_JAMS.SECTION_TITLE}
        </label>
      </div>

      {/* Chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "10px",
        }}
      >
        {availableSpots.map((spot) => {
          const isSelected = selectedSpots.includes(spot);
          return (
            <button
              key={spot}
              type="button"
              onClick={() => onToggleSpot(spot)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: isSelected ? 700 : 500,
                background: isSelected
                  ? "rgba(245, 158, 11, 0.18)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.04))",
                color: isSelected
                  ? "var(--warning-color, #f59e0b)"
                  : "var(--text-secondary)",
                border: isSelected
                  ? "1px solid rgba(245, 158, 11, 0.45)"
                  : "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                cursor: "pointer",
                transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isSelected && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--warning-color, #f59e0b)",
                  }}
                />
              )}
              <span>{spot}</span>
            </button>
          );
        })}
      </div>

      {/* Input Tambah Titik Macet */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          className="input-field"
          placeholder={TEXT_PDO_FORM.TRAFFIC_JAMS.ADD_SPOT_PLACEHOLDER}
          value={newSpotText}
          onChange={(e) => onNewSpotTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddCustomSpot();
            }
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "10px",
            fontSize: "12.5px",
          }}
        />
        <button
          type="button"
          onClick={onAddCustomSpot}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "background 0.15s ease",
          }}
        >
          <Plus size={14} />{" "}
          <span>{TEXT_PDO_FORM.TRAFFIC_JAMS.ADD_BTN}</span>
        </button>
      </div>
    </div>
  );
};
