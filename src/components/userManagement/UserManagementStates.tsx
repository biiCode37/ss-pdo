import React from "react";
import { Users } from "lucide-react";
import { SkeletonBox } from "@/components/Skeletons";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";

export const UserManagementSkeleton: React.FC = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "12px",
      }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="glass"
          style={{
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid var(--card-border, rgba(255,255,255,0.08))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <SkeletonBox
              width="44px"
              height="44px"
              borderRadius="12px"
              style={{ flexShrink: 0 }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <SkeletonBox width="120px" height="15px" borderRadius="6px" />
              <SkeletonBox width="160px" height="12px" borderRadius="4px" />
              <SkeletonBox width="70px" height="18px" borderRadius="6px" />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "6px",
            }}
          >
            <SkeletonBox width="100px" height="12px" borderRadius="4px" />
            <SkeletonBox width="60px" height="12px" borderRadius="4px" />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "8px",
              borderTop: "1px solid var(--card-border, rgba(255,255,255,0.05))",
            }}
          >
            <SkeletonBox width="70px" height="26px" borderRadius="8px" />
            <SkeletonBox width="90px" height="26px" borderRadius="8px" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface UserManagementEmptyStateProps {
  isSearchActive: boolean;
}

export const UserManagementEmptyState: React.FC<
  UserManagementEmptyStateProps
> = ({ isSearchActive }) => {
  return (
    <div
      style={{
        padding: "60px 20px",
        textAlign: "center",
        background: "var(--card-bg, rgba(30, 41, 59, 0.4))",
        borderRadius: "16px",
        border: "1px dashed var(--card-border, rgba(255,255,255,0.12))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <Users
        size={36}
        style={{ color: "var(--text-secondary, #64748b)", opacity: 0.5 }}
      />
      <h3
        style={{
          margin: 0,
          fontSize: "15px",
          color: "var(--text-primary, #f8fafc)",
        }}
      >
        {TEXT_USER_MANAGEMENT.EMPTY_STATE.TITLE}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "12.5px",
          color: "var(--text-secondary, #94a3b8)",
          maxWidth: "300px",
        }}
      >
        {isSearchActive
          ? TEXT_USER_MANAGEMENT.EMPTY_STATE.SEARCH_NO_MATCH
          : TEXT_USER_MANAGEMENT.EMPTY_STATE.CATEGORY_EMPTY}
      </p>
    </div>
  );
};
