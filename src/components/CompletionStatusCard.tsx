import { memo } from "react";
import { FileText } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";
import { FormattedNoteText } from "./FormattedNoteText";
import { TEXT_DASHBOARD } from "../constants/texts";

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
  dateBadge?: string;
}

function CompletionStatusCardComponent({
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
          <span>{TEXT_DASHBOARD.COMPLETION_STATUS.TITLE}</span>
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
                background: "rgba(62, 207, 142, 0.12)",
                border: "1px solid rgba(62, 207, 142, 0.25)",
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
            {TEXT_DASHBOARD.COMPLETION_STATUS.UNIT_COUNT(hasNotes ? summary.busesWithNotes.length : 0)}
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
              title={TEXT_DASHBOARD.COMPLETION_STATUS.JUMP_TO_UNIT_TITLE}
            >
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: "#061a10",
                  background:
                    "linear-gradient(135deg, #3ECF8E 0%, #24B47E 100%)",
                  padding: "3px 8px",
                  minWidth: "92px",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "6px",
                  letterSpacing: "0.3px",
                  boxShadow: "0 2px 6px rgba(62, 207, 142, 0.35)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {note.unit}
              </span>
              <div
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
              </div>
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
          {TEXT_DASHBOARD.COMPLETION_STATUS.NO_NOTES}
        </p>
      )}
    </div>
  );
}

export const CompletionStatusCard = memo(CompletionStatusCardComponent);
