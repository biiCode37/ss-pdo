/**
 * Komponen pembantu untuk merender teks keterangan/catatan dengan
 * smart visual badging profesional (BA.01-04, OFF, NP1/NP2, TO EVDAL) dan simbol bullet point.
 */
export function FormattedNoteText({ text }: { text?: string | null }) {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();
  const parts = cleanText.split(/\s+[|•]\s+/);

  const renderItem = (itemText: string, key?: number) => {
    const trimmed = itemText.trim();
    if (!trimmed) return null;

    // 1. BA.01 - BA.04 Prefix Detection (Preserves ⚠️ icon as critical trouble indicator)
    const baMatch = trimmed.match(/^(BA\.0[1-4])(?:\s*[-:]?\s*(.*))?$/i);
    if (baMatch) {
      const prefix = baMatch[1].toUpperCase();
      const detail = baMatch[2]?.trim();
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            lineHeight: 1.4,
          }}
        >
          <span className="note-badge-ba">⚠️ {prefix}</span>
          {detail && (
            <span
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              {detail}
            </span>
          )}
        </div>
      );
    }

    // 2. OFF (Libur) Detection - Clean Professional Badge
    if (/^OFF(?:\s*\(.*\))?$/i.test(trimmed)) {
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            lineHeight: 1.4,
          }}
        >
          <span className="note-badge-off">{trimmed.toUpperCase()}</span>
        </div>
      );
    }

    // 3. NP1 / NP2 (Negatif Pramudi) Detection - Clean Professional Badge
    const npMatch = trimmed.match(/^(NP\s*[-.]?\s*[12])(?:\s*[-:]?\s*(.*))?$/i);
    if (npMatch) {
      const tag = npMatch[1].replace(/[\s-.]+/g, "").toUpperCase();
      const detail = npMatch[2]?.trim();
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            lineHeight: 1.4,
          }}
        >
          <span className="note-badge-np">{tag}</span>
          {detail && (
            <span
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              {detail}
            </span>
          )}
        </div>
      );
    }

    // 4. TO EVDAL Detection - Clean Professional Badge
    if (/^TO\s*[-.]?\s*EVDAL$/i.test(trimmed)) {
      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            lineHeight: 1.4,
          }}
        >
          <span className="note-badge-to">TO EVDAL</span>
        </div>
      );
    }

    // 5. Default Bullet Point Item
    return (
      <div
        key={key}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "7px",
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            height: "16.8px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-color, #38bdf8)",
              boxShadow: "0 0 5px rgba(56, 189, 248, 0.7)",
              display: "inline-block",
            }}
          />
        </div>
        <span style={{ flex: 1, fontSize: "12px" }}>{trimmed}</span>
      </div>
    );
  };

  if (parts.length <= 1) {
    return renderItem(cleanText);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {parts.map((part, index) => renderItem(part, index))}
    </div>
  );
}
