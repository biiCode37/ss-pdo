import React from "react";
import type { BusInputFormReturn } from "../useBusInputForm";
import { SingleFocusKmShift1 } from "./SingleFocusKmShift1";
import { SingleFocusKmShift2 } from "./SingleFocusKmShift2";

export interface SingleFocusKmProps {
  form: BusInputFormReturn;
  currentCategory: string;
  busKmAwal1?: string;
}

export const SingleFocusKm: React.FC<SingleFocusKmProps> = ({
  form,
  currentCategory,
  busKmAwal1,
}) => {
  if (currentCategory === "kmAwal1" || currentCategory === "kmAkhir1") {
    return (
      <SingleFocusKmShift1
        form={form}
        currentCategory={currentCategory}
        busKmAwal1={busKmAwal1}
      />
    );
  }

  if (currentCategory === "kmAwal2" || currentCategory === "kmAkhir2") {
    return <SingleFocusKmShift2 form={form} currentCategory={currentCategory} />;
  }

  return null;
};
