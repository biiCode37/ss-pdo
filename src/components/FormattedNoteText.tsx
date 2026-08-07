/**
 * Komponen pembantu untuk merender teks keterangan/catatan dengan
 * simbol pemisah titik ( • ) berwarna aksen yang kontras dengan warna teks.
 */
export function FormattedNoteText({ text }: { text?: string | null }) {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();
  const parts = cleanText.split(/\s+[|•]\s+/);

  if (parts.length <= 1) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
        <span
          style={{
            color: "var(--accent-color, #38bdf8)",
            fontWeight: 800,
            fontSize: "13px",
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          •
        </span>
        <span style={{ flex: 1 }}>{cleanText}</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {parts.map((part, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              color: "var(--accent-color, #38bdf8)",
              fontWeight: 800,
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            •
          </span>
          <span style={{ flex: 1 }}>{part}</span>
        </div>
      ))}
    </div>
  );
}
