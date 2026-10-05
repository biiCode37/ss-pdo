import React from "react";
import { ArrowLeft, Users, RefreshCw, UserPlus } from "lucide-react";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";

interface UserManagementHeaderProps {
  onBack: () => void;
  activeCount: number;
  totalCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddUserModal: () => void;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  onBack,
  activeCount,
  totalCount,
  isLoading,
  onRefresh,
  onOpenAddUserModal,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--card-bg, rgba(15, 23, 42, 0.92))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <button
            onClick={onBack}
            className="btn btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 11px",
              borderRadius: "10px",
              fontSize: "12.5px",
              fontWeight: 600,
              border: "1px solid var(--card-border, rgba(255,255,255,0.15))",
              background: "rgba(255,255,255,0.05)",
              color: "var(--text-primary, #f8fafc)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            title={TEXT_USER_MANAGEMENT.HEADER.BACK_TITLE}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              {TEXT_USER_MANAGEMENT.HEADER.BACK_BTN}
            </span>
          </button>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "15.5px",
                fontWeight: 700,
                color: "var(--text-primary, #f8fafc)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <Users
                size={18}
                className="text-blue-500"
                style={{ flexShrink: 0 }}
              />
              <span>{TEXT_USER_MANAGEMENT.HEADER.TITLE}</span>
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "var(--text-secondary, #94a3b8)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {TEXT_USER_MANAGEMENT.HEADER.SUBTITLE(activeCount, totalCount)}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-outline"
            style={{
              padding: "7px 9px",
              borderRadius: "10px",
              border: "1px solid var(--card-border, rgba(255,255,255,0.12))",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary, #94a3b8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title={TEXT_USER_MANAGEMENT.HEADER.REFRESH_TITLE}
          >
            <RefreshCw
              size={15}
              className={isLoading ? "animate-spin" : ""}
            />
          </button>

          <button
            onClick={onOpenAddUserModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 13px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#ffffff",
              border: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            <UserPlus size={15} />
            <span>{TEXT_USER_MANAGEMENT.HEADER.ADD_BTN}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
