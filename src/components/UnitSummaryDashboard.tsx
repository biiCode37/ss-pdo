import { useState, useMemo, useCallback, memo } from "react";
import { Search, Bus } from "lucide-react";
import type { BusData } from "../services/googleSheets";
import { extractUnitList, detectTargetTrip } from "../utils/unitAnalytics";
import { UnitCard } from "./UnitCard";
import { UnitDetailModal } from "./UnitDetailModal";
import { UnitCardSkeleton } from "./Skeletons";
import { useMobileBackHandler } from "../hooks/useMobileBackHandler";
import { TEXT_DASHBOARD } from "../constants/texts";

interface Props {
  busData: BusData[] | null;
  sheetId: string;
  selectedTab: string;
  activeMonth?: number;
  activeYear?: number;
  accRange?: { startDay?: number; endDay?: number; startMonth?: number; endMonth?: number; startYear?: number; endYear?: number } | null;
}

function UnitSummaryDashboardComponent({
  busData,
  sheetId,
  selectedTab,
  activeMonth,
  activeYear,
  accRange,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Mobile Back Navigation: Close UnitDetailModal on hardware back / swipe back
  useMobileBackHandler({
    id: "unit_detail_modal",
    isOpen: Boolean(selectedUnit),
    onClose: () => setSelectedUnit(null),
  });

  const targetTrip = useMemo(() => {
    return detectTargetTrip(busData);
  }, [busData]);

  const unitList = useMemo(() => {
    if (!busData) return [];
    return extractUnitList(busData);
  }, [busData]);

  const filteredUnits = useMemo(() => {
    if (!searchQuery) return unitList;
    const q = searchQuery.toLowerCase();
    return unitList.filter((u) => u.unit.toLowerCase().includes(q));
  }, [unitList, searchQuery]);

  // BUG-61: Stabilkan callback agar memo(UnitCard) benar-benar efektif
  const handleSelectUnit = useCallback((unit: string) => {
    setSelectedUnit(unit);
  }, []);

  return (
    <div style={{ marginTop: "0px" }}>
      {/* Header & Search */}
      <div className="search-container" style={{ marginBottom: "12px" }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="input-field search-input"
            placeholder={TEXT_DASHBOARD.BUS_LIST.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Kartu Unit */}
      {!busData ? (
        <UnitCardSkeleton count={6} />
      ) : filteredUnits.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {filteredUnits.map((item) => (
            <UnitCard
              key={item.unit}
              item={item}
              targetTrip={targetTrip}
              onSelectUnit={handleSelectUnit}
            />
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          style={{ textAlign: "center", padding: "32px" }}
        >
          <Bus
            size={32}
            style={{ color: "var(--text-secondary)", marginBottom: "8px" }}
          />
          <p>{TEXT_DASHBOARD.BUS_LIST.EMPTY_SUMMARY(searchQuery)}</p>
        </div>
      )}

      {/* iOS-Style Expandable Bottom Sheet Modal Detail */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          busData={busData}
          targetTrip={targetTrip}
          sheetId={sheetId}
          selectedTab={selectedTab}
          activeMonth={activeMonth}
          activeYear={activeYear}
          accRange={accRange}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}

export const UnitSummaryDashboard = memo(UnitSummaryDashboardComponent);
