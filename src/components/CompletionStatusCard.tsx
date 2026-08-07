import { FileText } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";
import { FormattedNoteText } from "./FormattedNoteText";

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
  dateBadge?: string;
}

export function CompletionStatusCard({
  summary,
  onSelectUnit,
  dateBadge,
}: Props) {
  const hasNotes = summary.busesWithNotes.length > 0;

  return (
    <div className="analytics-card glass">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
          gap: "8px",
        }}
      >
        <div className="analytics-card-title" style={{ marginTop: "2px" }}>
          <FileText size={18} />
          <span>Unit Dengan Keterangan Tertentu</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          {dateBadge && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: "var(--accent-color)",
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                padding: "3px 8px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                letterSpacing: "0.5px",
              }}
            >
              {dateBadge}
            </span>
          )}
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              color: hasNotes ? "var(--accent-color)" : "var(--text-secondary)",
            }}
          >
            {hasNotes ? `${summary.busesWithNotes.length} Unit` : "0 Unit"}
          </span>
        </div>
      </div>

      {hasNotes ? (
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {summary.busesWithNotes.map((note, idx) => (
            <div
              key={idx}
              onClick={() => onSelectUnit?.(note.unit)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "9px 12px",
                background: "var(--input-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "10px",
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                gap: "10px",
              }}
              title="Klik untuk lompat ke unit ini"
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#ffffff",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {note.unit}
              </span>
              <span
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  flex: 1,
                  fontSize: "12px",
                  lineHeight: 1.4,
                  color: "var(--warning-text)",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                <FormattedNoteText text={note.keterangan} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            textAlign: "center",
            margin: "8px 0 0 0",
          }}
        >
          Tidak ada keterangan unit untuk tanggal ini.
        </p>
      )}
    </div>
  );
}
