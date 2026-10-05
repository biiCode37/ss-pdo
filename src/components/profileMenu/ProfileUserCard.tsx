import React from "react";
import { User, X } from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { UserProfileState } from "./types";

interface ProfileUserCardProps {
  userProfile: UserProfileState;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onDismiss: () => void;
}

export const ProfileUserCard: React.FC<ProfileUserCardProps> = ({
  userProfile,
  avatarFailed,
  onAvatarError,
  onDismiss,
}) => {
  return (
    <>
      {/* Top Handle Bar for Touch Drag */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--text-secondary)",
            opacity: 0.3,
          }}
        />
      </div>

      {/* User Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "rgba(62, 207, 142, 0.06)",
          borderRadius: "16px",
          border: "1px solid rgba(62, 207, 142, 0.18)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
          }}
        >
          {userProfile.avatar_url && !avatarFailed ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.full_name}
              referrerPolicy="no-referrer"
              onError={onAvatarError}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(62, 207, 142, 0.3)",
              }}
            />
          ) : (
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3ECF8E, #24B47E)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#061a10",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(62, 207, 142, 0.3)",
              }}
            >
              <User size={22} />
            </div>
          )}
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "14.5px",
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {userProfile.full_name}
              </span>
              <RoleBadge role={userProfile.role} size="xs" />
            </div>
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--text-secondary)",
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: "2px",
              }}
            >
              {userProfile.email}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            padding: "6px",
          }}
          title={TEXT_DASHBOARD.PROFILE_MENU.TITLE}
        >
          <X size={20} />
        </button>
      </div>
    </>
  );
};
