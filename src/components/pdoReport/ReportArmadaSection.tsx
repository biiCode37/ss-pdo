import React from "react";
import { TEXT_PDO_FORM } from "@/constants/texts";

interface ReportArmadaSectionProps {
  renopsS1: number;
  realopsS1: number;
  renopsS2: number;
  realopsS2: number;
  onRenopsS1Change: (value: number) => void;
  onRealopsS1Change: (value: number) => void;
  onRenopsS2Change: (value: number) => void;
  onRealopsS2Change: (value: number) => void;
}

export const ReportArmadaSection: React.FC<ReportArmadaSectionProps> = ({
  renopsS1,
  realopsS1,
  renopsS2,
  realopsS2,
  onRenopsS1Change,
  onRealopsS1Change,
  onRenopsS2Change,
  onRealopsS2Change,
}) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
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
          {TEXT_PDO_FORM.ARMADA_SECTION}
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        {/* Shift 1 */}
        <div
          style={{
            background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.06))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#38bdf8",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {TEXT_PDO_FORM.SHIFT_1.TITLE}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="renops-s1"
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {TEXT_PDO_FORM.SHIFT_1.RENOPS_LABEL}
              </label>
              <input
                id="renops-s1"
                type="number"
                min={0}
                className="input-field tabular-nums"
                value={renopsS1}
                onChange={(e) => onRenopsS1Change(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="realops-s1"
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {TEXT_PDO_FORM.SHIFT_1.REALOPS_LABEL}
              </label>
              <input
                id="realops-s1"
                type="number"
                min={0}
                className="input-field tabular-nums"
                value={realopsS1}
                onChange={(e) => onRealopsS1Change(Number(e.target.value))}
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

        {/* Shift 2 */}
        <div
          style={{
            background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.06))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#a855f7",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {TEXT_PDO_FORM.SHIFT_2.TITLE}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="renops-s2"
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {TEXT_PDO_FORM.SHIFT_2.RENOPS_LABEL}
              </label>
              <input
                id="renops-s2"
                type="number"
                min={0}
                className="input-field tabular-nums"
                value={renopsS2}
                onChange={(e) => onRenopsS2Change(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="realops-s2"
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                {TEXT_PDO_FORM.SHIFT_2.REALOPS_LABEL}
              </label>
              <input
                id="realops-s2"
                type="number"
                min={0}
                className="input-field tabular-nums"
                value={realopsS2}
                onChange={(e) => onRealopsS2Change(Number(e.target.value))}
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
      </div>
    </div>
  );
};
