import React from "react";
import { Clock } from "lucide-react";
import type { UserProfile, UserRole } from "@/types/supabase";
import { RoleBadge } from "@/components/RoleBadge";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";
import { UserCardAvatar } from "./UserCardAvatar";

interface UserCardItemProps {
  user: UserProfile;
  currentUserEmail: string;
  currentUserRole: UserRole | "petugas";
  onToggleStatus: (user: UserProfile) => void;
  onEditRole: (user: UserProfile) => void;
}

export const UserCardItem: React.FC<UserCardItemProps> = ({
  user,
  currentUserEmail,
  currentUserRole,
  onToggleStatus,
  onEditRole,
}) => {
  const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
  const isActive = user.is_active !== false;

  return (
    <div
      style={{
        background: "var(--card-bg, rgba(30, 41, 59, 0.7))",
        border: "1px solid",
        borderColor: isSelf
          ? "rgba(59, 130, 246, 0.4)"
          : "var(--card-border, rgba(255,255,255,0.08))",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        boxShadow: isSelf ? "0 0 20px rgba(59, 130, 246, 0.1)" : "none",
      }}
    >
      {/* Top Section: Avatar & Info (Left) | Role & Status Badge (Top-Right) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        {/* Left: Avatar + Full Name + Email */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <UserCardAvatar user={user} isSelf={isSelf} />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "var(--text-primary, #f8fafc)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.full_name || TEXT_USER_MANAGEMENT.CARD.NO_NAME}
              </span>
              {isSelf && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "5px",
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#60a5fa",
                  }}
                >
                  {TEXT_USER_MANAGEMENT.CARD.YOU_BADGE}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary, #94a3b8)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={user.email}
            >
              {user.email}
            </div>
          </div>
        </div>

        {/* Top-Right: Role Badge */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <RoleBadge role={user.role || "pdo"} />
        </div>
      </div>

      {/* Notes / Sub-info without decorative icon */}
      {user.notes && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
            fontSize: "11.5px",
            color: "var(--text-secondary, #94a3b8)",
            lineHeight: 1.4,
          }}
        >
          <span>{user.notes}</span>
        </div>
      )}

      {/* Metadata Row: Last login & Creator (Clock icon preserved) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--text-secondary, #64748b)",
          paddingTop: "6px",
          borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={11} />
          <span>
            {user.last_login_at
              ? new Date(user.last_login_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : TEXT_USER_MANAGEMENT.CARD.NEVER_LOGGED_IN}
          </span>
        </div>

        {user.created_by && (
          <span
            title={TEXT_USER_MANAGEMENT.CARD.CREATED_BY_TITLE(user.created_by)}
          >
            {TEXT_USER_MANAGEMENT.CARD.CREATED_BY(user.created_by.split("@")[0])}
          </span>
        )}
      </div>

      {/* Actions Section (Only for non-superadmin users) */}
      {user.role !== "superadmin" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            paddingTop: "8px",
            borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
          }}
        >
          {/* Interactive iOS-style Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => onToggleStatus(user)}
            disabled={isSelf}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "none",
              padding: "2px 0",
              cursor: isSelf ? "not-allowed" : "pointer",
              opacity: isSelf ? 0.45 : 1,
              outline: "none",
            }}
            title={
              isSelf
                ? TEXT_USER_MANAGEMENT.MODAL_STATUS.TITLE_SELF
                : isActive
                ? TEXT_USER_MANAGEMENT.MODAL_STATUS.TITLE_DEACTIVATE
                : TEXT_USER_MANAGEMENT.MODAL_STATUS.TITLE_ACTIVATE
            }
          >
            <div
              style={{
                width: "36px",
                height: "20px",
                borderRadius: "9999px",
                background: isActive ? "#10b981" : "rgba(255, 255, 255, 0.16)",
                border: isActive
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
                position: "relative",
                transition:
                  "background-color 0.25s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                padding: "2px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.25)",
                  transform: isActive ? "translateX(16px)" : "translateX(0px)",
                  transition:
                    "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: isActive ? "#34d399" : "var(--text-secondary, #94a3b8)",
                userSelect: "none",
              }}
            >
              {isActive
                ? TEXT_USER_MANAGEMENT.MODAL_STATUS.LABEL_ACTIVE
                : TEXT_USER_MANAGEMENT.MODAL_STATUS.LABEL_INACTIVE}
            </span>
          </button>

          {/* Role Actions (Clean text button) */}
          <div>
            {currentUserRole === "superadmin" && (
              <button
                onClick={() => onEditRole(user)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  border:
                    "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--text-primary, #f8fafc)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title={TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.BTN_TITLE}
              >
                {TEXT_USER_MANAGEMENT.MODAL_EDIT_ROLE.BTN_EDIT}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
