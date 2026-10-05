import React from "react";
import { Search } from "lucide-react";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";
import type { UserRole } from "@/types/supabase";

export type FilterTab =
  | "all"
  | "superadmin"
  | "admin"
  | "korwil"
  | "korlap"
  | "pdo"
  | "petugas"
  | "inactive";

export interface UserCounts {
  all: number;
  superadmin: number;
  admin: number;
  korwil: number;
  korlap: number;
  pdo: number;
  petugas: number;
  inactive: number;
  active: number;
}

interface UserManagementFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  counts: UserCounts;
  currentUserRole: UserRole | "petugas";
}

export const UserManagementFilters: React.FC<UserManagementFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  counts,
  currentUserRole,
}) => {
  const filterTabs = [
    { key: "all", label: TEXT_USER_MANAGEMENT.TABS.ALL, count: counts.all },
    ...(currentUserRole === "superadmin"
      ? [
          {
            key: "superadmin",
            label: TEXT_USER_MANAGEMENT.TABS.SUPERADMIN,
            count: counts.superadmin,
          },
          {
            key: "admin",
            label: TEXT_USER_MANAGEMENT.TABS.ADMIN,
            count: counts.admin,
          },
        ]
      : []),
    {
      key: "korwil",
      label: TEXT_USER_MANAGEMENT.TABS.KORWIL,
      count: counts.korwil,
    },
    {
      key: "korlap",
      label: TEXT_USER_MANAGEMENT.TABS.KORLAP,
      count: counts.korlap,
    },
    { key: "pdo", label: TEXT_USER_MANAGEMENT.TABS.PDO, count: counts.pdo },
    {
      key: "inactive",
      label: TEXT_USER_MANAGEMENT.TABS.INACTIVE,
      count: counts.inactive,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Search Box */}
      <div
        style={{
          position: "relative",
          width: "100%",
        }}
      >
        <Search
          size={17}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-secondary, #94a3b8)",
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={TEXT_USER_MANAGEMENT.SEARCH_PLACEHOLDER}
          style={{
            width: "100%",
            padding: "10px 14px 10px 40px",
            borderRadius: "12px",
            border: "1px solid var(--card-border, rgba(255,255,255,0.12))",
            background: "var(--card-bg, rgba(30, 41, 59, 0.6))",
            color: "var(--text-primary, #f8fafc)",
            fontSize: "13.5px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Segmented Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "4px",
          scrollbarWidth: "none",
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key as FilterTab)}
              style={{
                padding: "6px 12px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontWeight: isActive ? 600 : 500,
                border: "1px solid",
                borderColor: isActive
                  ? "#3b82f6"
                  : "var(--card-border, rgba(255,255,255,0.08))",
                background: isActive
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(255,255,255,0.03)",
                color: isActive ? "#60a5fa" : "var(--text-secondary, #94a3b8)",
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  background: isActive
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(255,255,255,0.08)",
                  color: isActive ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
