import type { UnitKeteranganStatus } from "@/utils/keteranganUtils";

/** Kelas kartu per status keterangan sepanjang hari (lihat `.bus-card.unit-status-*` di index.css). */
export const UNIT_STATUS_CARD_CLASS: Record<UnitKeteranganStatus, string> = {
  NORMAL: "",
  OFF_LIBUR: "unit-status-off",
  KENDALA: "unit-status-kendala",
  TO: "unit-status-to",
};
