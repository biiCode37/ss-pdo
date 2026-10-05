import React from "react";
import { AlertCircle } from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";

interface MonitoringStatesProps {
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export const MonitoringStates: React.FC<MonitoringStatesProps> = ({
  loading,
  errorMessage,
  onRetry,
}) => {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            height: "70px",
            borderRadius: "16px",
            background: "var(--card-bg, rgba(255, 255, 255, 0.04))",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: "90px",
                borderRadius: "14px",
                background: "var(--card-bg, rgba(255, 255, 255, 0.04))",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "12px",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: "160px",
                borderRadius: "16px",
                background: "var(--card-bg, rgba(255, 255, 255, 0.04))",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        style={{
          padding: "24px",
          borderRadius: "16px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <AlertCircle
          size={36}
          style={{ color: "var(--danger-color, #ef4444)" }}
        />
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 700,
            margin: 0,
            color: "var(--danger-color, #ef4444)",
          }}
        >
          {TEXT_MONITORING.ERROR_STATE.TITLE}
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary, #8b8b8b)",
            margin: 0,
            maxWidth: "400px",
          }}
        >
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: "6px",
            padding: "8px 18px",
            borderRadius: "10px",
            background: "var(--danger-color, #ef4444)",
            color: "#ffffff",
            border: "none",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          {TEXT_MONITORING.ERROR_STATE.RETRY_BTN}
        </button>
      </div>
    );
  }

  return null;
};
