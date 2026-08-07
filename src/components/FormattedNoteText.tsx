/**
 * Komponen pembantu untuk merender teks keterangan/catatan dengan
 * simbol pemisah titik ( • ) berwarna aksen yang kontras dengan warna teks.
 */
export function FormattedNoteText({ text }: { text?: string | null }) {
  if (!text || !text.trim()) return null;

  const cleanText = text.trim();
  const parts = cleanText.split(/\s+[|•]\s+/);

  const renderBulletItem = (itemText: string, key?: number) => (
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
      <span style={{ flex: 1 }}>{itemText}</span>
    </div>
  );

  if (parts.length <= 1) {
    return renderBulletItem(cleanText);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {parts.map((part, index) => renderBulletItem(part, index))}
    </div>
  );
}
