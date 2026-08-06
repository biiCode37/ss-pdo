import { useState, useMemo } from "react";
import { Search, Bus } from "lucide-react";
import type { BusData } from "../services/googleSheets";
import { extractUnitList } from "../utils/unitAnalytics";
import { UnitCard } from "./UnitCard";
import { UnitDetailModal } from "./UnitDetailModal";
import { UnitCardSkeleton } from "./Skeletons";

interface Props {
  busData: BusData[] | null;
  sheetId: string;
  selectedTab: string;
}

export function UnitSummaryDashboard({ busData, sheetId, selectedTab }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const unitList = useMemo(() => {
    if (!busData) return [];
    return extractUnitList(busData);
  }, [busData]);

  const filteredUnits = useMemo(() => {
    if (!searchQuery) return unitList;
    const q = searchQuery.toLowerCase();
    return unitList.filter((u) => u.unit.toLowerCase().includes(q));
  }, [unitList, searchQuery]);

  return (
    <div style={{ marginTop: "0px" }}>
      {/* Header & Search */}
      <div className="search-container" style={{ marginBottom: "12px" }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Cari No. Body Unit..."
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
              onClick={() => setSelectedUnit(item.unit)}
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
          <p>Tidak ada armada yang sesuai dengan kata kunci "{searchQuery}"</p>
        </div>
      )}

      {/* iOS-Style Expandable Bottom Sheet Modal Detail */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          busData={busData}
          sheetId={sheetId}
          selectedTab={selectedTab}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
}
