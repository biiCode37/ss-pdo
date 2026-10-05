import React from "react";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { BUS_CATEGORIES } from "./busListUtils";

interface BusListProgressBarProps {
  activeCategory: string;
  filledCount: number;
  totalCount: number;
  progressPercent: number;
}

export const BusListProgressBar: React.FC<BusListProgressBarProps> = ({
  activeCategory,
  filledCount,
  totalCount,
  progressPercent,
}) => {
  return (
    <div data-testid="daily-progress-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 4px 6px 4px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.1px",
          }}
        >
          {activeCategory === "ALL"
            ? TEXT_DASHBOARD.BUS_LIST.DAILY_PROGRESS
            : TEXT_DASHBOARD.BUS_LIST.COLUMN_PREFIX(
                BUS_CATEGORIES.find((c) => c.id === activeCategory)?.label ||
                  activeCategory,
              )}
        </span>
        <span className="tabular-nums" style={{ fontSize: "11.5px" }}>
          <strong
            style={{
              color:
                filledCount === totalCount
                  ? "var(--success-color)"
                  : "var(--text-primary)",
            }}
          >
            {filledCount}
          </strong>
          /{totalCount} Unit ({progressPercent}%)
        </span>
      </div>

      {/* 3px Hairline Progress Bar */}
      <div
        style={{
          height: "3px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            height: "100%",
            background:
              filledCount === totalCount
                ? "var(--success-color)"
                : "var(--accent-color)",
            width: `${progressPercent}%`,
            transition: "width 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        />
      </div>
    </div>
  );
};
