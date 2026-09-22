import React, { useEffect } from "react";
import { CloudDownload, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";
import type { IngestionProgress } from "@/services/regionalIngestionService";

export interface IngestionProgressModalProps {
  isOpen: boolean;
  progress: IngestionProgress | null;
  onClose?: () => void;
}

export const IngestionProgressModal: React.FC<IngestionProgressModalProps> = ({
  isOpen,
  progress,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const percent = progress?.percent ?? 5;
  const isComplete = percent >= 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingestion-modal-title"
      data-testid="ingestion-progress-modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--card-bg, #161616)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
          borderRadius: "20px",
          padding: "24px 20px",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "140px",
            height: "140px",
            background: isComplete
              ? "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(62, 207, 142, 0.25) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Animated Icon Container */}
        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "16px",
            background: isComplete
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(62, 207, 142, 0.12)",
            border: isComplete
              ? "1.5px solid rgba(16, 185, 129, 0.4)"
              : "1.5px solid rgba(62, 207, 142, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            position: "relative",
            boxShadow: isComplete
              ? "0 0 20px rgba(16, 185, 129, 0.3)"
              : "0 0 20px rgba(62, 207, 142, 0.2)",
            transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {isComplete ? (
            <CheckCircle2
              size={30}
              style={{
                color: "#10b981",
                animation: "scaleIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            />
          ) : (
            <CloudDownload
              size={28}
              style={{
                color: "var(--accent-color, #3ECF8E)",
                animation: "bounce 1.5s infinite ease-in-out",
              }}
            />
          )}

          {!isComplete && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                display: "flex",
                height: "12px",
                width: "12px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  display: "inline-flex",
                  height: "100%",
                  width: "100%",
                  borderRadius: "50%",
                  background: "var(--accent-color, #3ECF8E)",
                  opacity: 0.75,
                  animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
                }}
              />
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  borderRadius: "50%",
                  height: "12px",
                  width: "12px",
                  background: "var(--accent-color, #3ECF8E)",
                }}
              />
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3
          id="ingestion-modal-title"
          style={{
            fontSize: "17px",
            fontWeight: 800,
            margin: "0 0 4px 0",
            color: "var(--text-primary, #ededed)",
            letterSpacing: "-0.2px",
          }}
        >
          {TEXT_MONITORING.INGESTION.MODAL_TITLE}
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #8b8b8b)",
            margin: "0 0 18px 0",
            lineHeight: 1.4,
          }}
        >
          {TEXT_MONITORING.INGESTION.MODAL_SUBTITLE}
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: "100%",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                color: "var(--text-secondary, #8b8b8b)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {!isComplete ? (
                <>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  <span>
                    {progress?.processedCount ?? 0} / {progress?.totalToSync ?? 18} Rute
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={13} style={{ color: "#10b981" }} />
                  <span style={{ color: "#10b981" }}>Selesai</span>
                </>
              )}
            </span>
            <span
              style={{
                color: "var(--accent-color, #3ECF8E)",
                fontWeight: 800,
              }}
            >
              {percent}%
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "8px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.08))",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              data-testid="ingestion-progress-bar-fill"
              style={{
                width: `${percent}%`,
                height: "100%",
                background: isComplete
                  ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                  : "linear-gradient(90deg, #3ECF8E 0%, #10b981 100%)",
                borderRadius: "999px",
                transition: "width 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
                boxShadow: isComplete
                  ? "0 0 10px rgba(16, 185, 129, 0.4)"
                  : "0 0 10px rgba(62, 207, 142, 0.4)",
              }}
            />
          </div>
        </div>

        {/* Current Dynamic Status Pill */}
        <div
          style={{
            width: "100%",
            background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "11.5px",
            color: "var(--text-secondary, #9a9a9a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "36px",
          }}
        >
          {progress?.currentRouteCode && !isComplete && (
            <span
              style={{
                padding: "2px 6px",
                borderRadius: "6px",
                background: "rgba(62, 207, 142, 0.15)",
                color: "var(--accent-color, #3ECF8E)",
                fontWeight: 700,
                fontSize: "11px",
                border: "1px solid rgba(62, 207, 142, 0.25)",
              }}
            >
              {progress.currentRouteCode}
            </span>
          )}
          <span
            style={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {progress?.stepMessage || TEXT_MONITORING.INGESTION.PROGRESS_INIT}
          </span>
        </div>

        {/* Action button if user wants to dismiss early when complete */}
        {isComplete && onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: "16px",
              padding: "8px 24px",
              borderRadius: "12px",
              background: "var(--accent-color, #3ECF8E)",
              color: "#000",
              fontWeight: 700,
              fontSize: "12.5px",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
};

export default IngestionProgressModal;
