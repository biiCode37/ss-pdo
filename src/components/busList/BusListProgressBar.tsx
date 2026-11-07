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
  const isDone = totalCount > 0 && filledCount === totalCount;
  return (
    <div data-testid="daily-progress-container">
      <div className="buslist-progress-row">
        <span className="buslist-progress-label">
          {activeCategory === "ALL"
            ? TEXT_DASHBOARD.BUS_LIST.DAILY_PROGRESS
            : TEXT_DASHBOARD.BUS_LIST.COLUMN_PREFIX(
                BUS_CATEGORIES.find((c) => c.id === activeCategory)?.label ||
                  activeCategory,
              )}
        </span>
        <span className="tabular-nums">
          <strong className="buslist-progress-label">{filledCount}</strong>
          {TEXT_DASHBOARD.BUS_LIST.PROGRESS_COUNT_SUFFIX(totalCount, progressPercent)}
        </span>
      </div>

      <div className="buslist-progress-track">
        <div
          className={`buslist-progress-fill${isDone ? " buslist-progress-fill--done" : ""}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
