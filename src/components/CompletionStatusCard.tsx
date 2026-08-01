import { FileText } from "lucide-react";
import type { AnalyticsSummary } from "../utils/analytics";

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
}

export function CompletionStatusCard({ summary, onSelectUnit }: Props) {
  const hasNotes = summary.busesWithNotes.length > 0;

  return (
    <div className="analytics-card glass">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: hasNotes ? "12px" : 0,
        }}
      >
        <div
          className="analytics-card-title"
          style={{ color: "var(--accent-color)" }}
        >
          <FileText size={18} />
          <span>Unit Dengan Keterangan Tertentu</span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--accent-color)",
            background: "rgba(59, 130, 246, 0.12)",
            padding: "2px 8px",
            borderRadius: "999px",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          {summary.busesWithNotes.length} Unit
        </span>
      </div>

      {hasNotes ? (
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "200px",
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
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--input-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Klik untuk lompat ke unit ini"
            >
              <b style={{ color: "var(--accent-color)" }}>{note.unit}</b>
              <span
                style={{
                  color: "var(--warning-color)",
                  fontWeight: 600,
                  marginLeft: "8px",
                  textAlign: "right",
                }}
              >
                {note.keterangan}
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
