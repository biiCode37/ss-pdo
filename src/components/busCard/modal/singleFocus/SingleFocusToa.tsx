import React from "react";
import { MAX_TOA_VALUE } from "@/utils/modals/busInput/busModalTypes";
import { TEXT_ALERTS } from "@/constants/texts";
import type { BusInputFormReturn } from "../useBusInputForm";
import {
  singleFocusPrimaryInputStyle,
  getSingleFocusChipStyle,
  singleFocusSubInputStyle,
  singleFocusLabelStyle,
  singleFocusHelperTextStyle,
} from "./singleFocusStyles";

interface SingleFocusToaProps {
  form: BusInputFormReturn;
  currentCategory: string;
}

export const SingleFocusToa: React.FC<SingleFocusToaProps> = ({
  form,
  currentCategory,
}) => {
  const {
    singlePrimaryInputRef,
    handleInputFocus,
    handleInputKeyDown,
    toaShift1,
    setToaShift1,
    manualShift1,
    setManualShift1,
    showManual1,
    setShowManual1,
    totalToa,
    setTotalToa,
    manualShift2,
    setManualShift2,
    showManual2,
    setShowManual2,
    showKeterangan,
    setShowKeterangan,
  } = form;

  if (currentCategory === "toaShift1") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label htmlFor="single-input-toaShift1" style={singleFocusLabelStyle}>
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1}
          </label>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-toaShift1"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TOA_VALUE}
            value={toaShift1}
            onChange={(e) => setToaShift1(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOA_S1}
            style={singleFocusPrimaryInputStyle}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowManual1((prev) => !prev)}
            style={getSingleFocusChipStyle(showManual1)}
          >
            {showManual1
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_MANUAL_S1
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S1}
          </button>
          <button
            type="button"
            onClick={() => setShowKeterangan((prev) => !prev)}
            style={getSingleFocusChipStyle(showKeterangan)}
          >
            {showKeterangan
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KETERANGAN
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}
          </button>
        </div>

        {showManual1 && (
          <div>
            <label
              htmlFor="single-input-manualShift1"
              style={{
                ...singleFocusHelperTextStyle,
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1}
            </label>
            <input
              id="single-input-manualShift1"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max={MAX_TOA_VALUE}
              value={manualShift1}
              onChange={(e) => setManualShift1(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S1}
              style={singleFocusSubInputStyle(false)}
            />
          </div>
        )}
      </div>
    );
  }

  if (currentCategory === "totalToa") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label htmlFor="single-input-totalToa" style={singleFocusLabelStyle}>
            {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOTAL_TOA}
          </label>
          <input
            ref={singlePrimaryInputRef}
            id="single-input-totalToa"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            max={MAX_TOA_VALUE}
            value={totalToa}
            onChange={(e) => setTotalToa(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.META_PLACEHOLDERS.TOTAL_TOA}
            style={singleFocusPrimaryInputStyle}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowManual2((prev) => !prev)}
            style={getSingleFocusChipStyle(showManual2)}
          >
            {showManual2
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_MANUAL_S2
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_MANUAL_S2}
          </button>
          <button
            type="button"
            onClick={() => setShowKeterangan((prev) => !prev)}
            style={getSingleFocusChipStyle(showKeterangan)}
          >
            {showKeterangan
              ? TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_ACTIVE_KETERANGAN
              : TEXT_ALERTS.BUS_INPUT_MODAL.CHIP_KETERANGAN}
          </button>
        </div>

        {showManual2 && (
          <div>
            <label
              htmlFor="single-input-manualShift2"
              style={{
                ...singleFocusHelperTextStyle,
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              {TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S2}
            </label>
            <input
              id="single-input-manualShift2"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              max={MAX_TOA_VALUE}
              value={manualShift2}
              onChange={(e) => setManualShift2(e.target.value)}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={TEXT_ALERTS.BUS_INPUT_MODAL.PLACEHOLDER_MANUAL_S2}
              style={singleFocusSubInputStyle(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};
