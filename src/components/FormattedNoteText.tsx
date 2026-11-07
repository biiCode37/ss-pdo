/**
 * Merender teks keterangan/catatan sebagai teks polos per item dengan pemisah bullet
 * (tanpa badge — refact_212). Prefiks shift (S1/S2) tetap ditampilkan sebagai label teks.
 */
export function FormattedNoteText({ text }: { text?: string | null }) {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();
  const parts = cleanText.split(/\s+[|•]\s+/);

  const renderItem = (itemText: string, key?: number) => {
    const trimmed = itemText.trim();
    if (!trimmed) return null;

    // Prefiks shift (S1:/S2:) dipertahankan agar jelas shift mana yang berketerangan
    const shiftMatch = trimmed.match(/^(S[12])\s*[:.-]\s*(.+)$/i);
    const body = shiftMatch ? shiftMatch[2].trim() : trimmed;

    return (
      <div
        key={key}
        className="note-item"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
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
            className="note-bullet"
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "var(--color-text-secondary)",
              display: "inline-block",
            }}
          />
        </div>
        <span style={{ flex: 1, fontSize: "12px" }}>
          {shiftMatch && (
            <span
              className="note-shift-prefix"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--color-text-secondary)",
                marginRight: "6px",
              }}
            >
              {shiftMatch[1].toUpperCase()}
            </span>
          )}
          {body}
        </span>
      </div>
    );
  };

  if (parts.length <= 1) {
    return renderItem(cleanText);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {parts.map((part, index) => renderItem(part, index))}
    </div>
  );
}
