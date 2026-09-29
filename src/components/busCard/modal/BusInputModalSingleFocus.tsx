import React from "react";
import { Info } from "lucide-react";
import type { BusInputFormReturn } from "./useBusInputForm";
import { SingleFocusToa } from "./singleFocus/SingleFocusToa";
import { SingleFocusKm } from "./singleFocus/SingleFocusKm";
import { SingleFocusNotes } from "./singleFocus/SingleFocusNotes";

export interface BusInputModalSingleFocusProps {
  form: BusInputFormReturn;
  activeCategory: string;
  busKmAwal1?: string;
}

export const BusInputModalSingleFocus: React.FC<BusInputModalSingleFocusProps> = ({
  form,
  activeCategory,
  busKmAwal1,
}) => {
  const currentCategory = form.effectiveCategory || activeCategory;
  const isToaCategory =
    currentCategory === "toaShift1" || currentCategory === "totalToa";
  const isKmCategory =
    currentCategory === "kmAwal1" ||
    currentCategory === "kmAkhir1" ||
    currentCategory === "kmAwal2" ||
    currentCategory === "kmAkhir2";
  const isNotesOnlyCategory = currentCategory === "keterangan";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Banner Panduan Ramah Redirection / Locking */}
      {form.guideMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "var(--color-primary, #38bdf8)",
            fontSize: "0.82rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>{form.guideMessage}</span>
        </div>
      )}

      {/* Kelompok Input TOA */}
      {isToaCategory && (
        <SingleFocusToa form={form} currentCategory={currentCategory} />
      )}

      {/* Kelompok Input KM */}
      {isKmCategory && (
        <SingleFocusKm
          form={form}
          currentCategory={currentCategory}
          busKmAwal1={busKmAwal1}
        />
      )}

      {/* Kelompok Catatan: jika chip catatan aktif atau kategori murni catatan */}
      {(form.showKeterangan || isNotesOnlyCategory) && (
        <SingleFocusNotes form={form} />
      )}
    </div>
  );
};
