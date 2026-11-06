import { classifyUnitKeterangan } from "@/utils/keteranganUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

const LABELS = TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_LABEL;

/** Badge kategori kartu unit. Warna tidak pernah jadi satu-satunya penanda (WCAG 1.4.1). */
export function UnitStatusBadge({ keterangan }: { keterangan?: string | null }) {
  const status = classifyUnitKeterangan(keterangan);
  if (status === "NORMAL") return null;

  const label =
    status === "TO"
      ? LABELS.TO
      : status === "KENDALA"
        ? LABELS.KENDALA
        : /\bOFF\b/i.test(keterangan || "")
          ? LABELS.OFF
          : LABELS.LIBUR;
  const variant = status === "TO" ? "to" : status === "KENDALA" ? "kendala" : "off";

  return (
    <span
      className={`unit-status-badge unit-status-badge-${variant}`}
      title={TEXT_DASHBOARD.BUS_CARD_ACTIONS.UNIT_STATUS_TOOLTIP(keterangan || "")}
    >
      {label}
    </span>
  );
}
