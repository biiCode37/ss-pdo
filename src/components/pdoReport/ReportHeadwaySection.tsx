import React from "react";
import { Clock } from "lucide-react";
import { TEXT_PDO_FORM } from "@/constants/texts";

interface ReportHeadwaySectionProps {
  headwayFastest: number;
  headwaySlowest: number;
  onHeadwayFastestChange: (value: number) => void;
  onHeadwaySlowestChange: (value: number) => void;
}

export const ReportHeadwaySection: React.FC<ReportHeadwaySectionProps> = ({
  headwayFastest,
  headwaySlowest,
  onHeadwayFastestChange,
  onHeadwaySlowestChange,
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
        <Clock size={14} color="var(--accent-color, #3ECF8E)" />
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
          {TEXT_PDO_FORM.HEADWAY.SECTION_TITLE}
        </label>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div>
          <label
            htmlFor="headway-fastest"
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: "4px",
              fontWeight: 600,
            }}
          >
            {TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL}
          </label>
          <input
            id="headway-fastest"
            type="number"
            min={1}
            className="input-field tabular-nums"
            value={headwayFastest}
            onChange={(e) => onHeadwayFastestChange(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          />
        </div>
        <div>
          <label
            htmlFor="headway-slowest"
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: "4px",
              fontWeight: 600,
            }}
          >
            {TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL}
          </label>
          <input
            id="headway-slowest"
            type="number"
            min={1}
            className="input-field tabular-nums"
            value={headwaySlowest}
            onChange={(e) => onHeadwaySlowestChange(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          />
        </div>
      </div>
    </div>
  );
};
