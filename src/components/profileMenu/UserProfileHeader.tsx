import { useState, useEffect, memo } from "react";
import { User } from "lucide-react";
import { TEXT_DASHBOARD, TEXT_USER_MANAGEMENT } from "../../constants/texts";
import { getStoredUserRole, type UserRole } from "../../utils/roleStorage";

export interface UserProfileHeaderProps {
  onOpenProfile: () => void;
}

const ROLE_DISPLAY_CONFIG: Record<
  UserRole,
  { label: string; className: string }
> = {
  superadmin: {
    label: TEXT_USER_MANAGEMENT.TABS.SUPERADMIN,
    className: "header-role-superadmin",
  },
  admin: {
    label: TEXT_USER_MANAGEMENT.TABS.ADMIN,
    className: "header-role-admin",
  },
  korwil: {
    label: TEXT_USER_MANAGEMENT.TABS.KORWIL,
    className: "header-role-korwil",
  },
  korlap: {
    label: TEXT_USER_MANAGEMENT.TABS.KORLAP,
    className: "header-role-korlap",
  },
  pdo: {
    label: TEXT_USER_MANAGEMENT.TABS.PDO,
    className: "header-role-pdo",
  },
};

function UserProfileHeaderComponent({ onOpenProfile }: UserProfileHeaderProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [profile, setProfile] = useState<{
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
  }>({
    fullName:
      localStorage.getItem("PDO_USER_NAME")?.trim() ||
      TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_NAME,
    role: getStoredUserRole(),
    avatarUrl: localStorage.getItem("PDO_USER_AVATAR") || undefined,
  });

  useEffect(() => {
    const handleStorage = () => {
      setProfile({
        fullName:
          localStorage.getItem("PDO_USER_NAME")?.trim() ||
          TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_NAME,
        role: getStoredUserRole(),
        avatarUrl: localStorage.getItem("PDO_USER_AVATAR") || undefined,
      });
      setAvatarFailed(false);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const roleConfig = ROLE_DISPLAY_CONFIG[profile.role] || ROLE_DISPLAY_CONFIG.pdo;

  return (
    <div
      onClick={onOpenProfile}
      data-testid="user-profile-header-btn"
      className="profile-btn-header"
      title="Buka Pengaturan & Akun"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "5px 12px 5px 6px",
        borderRadius: "9999px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        backgroundColor: "var(--card-bg, rgba(255, 255, 255, 0.05))",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProfile();
        }
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-primary-bg, rgba(59, 130, 246, 0.15))",
          color: "var(--color-primary, #3b82f6)",
          flexShrink: 0,
          border: "1.5px solid var(--color-primary, #3b82f6)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
        }}
      >
        {profile.avatarUrl && !avatarFailed ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <User size={18} strokeWidth={2.2} />
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: "1.15",
          maxWidth: "115px",
        }}
      >
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 650,
            color: "var(--text-main)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            letterSpacing: "-0.01em",
          }}
        >
          {profile.fullName}
        </span>
        <span
          className={`header-role-badge ${roleConfig.className}`}
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            opacity: 0.9,
          }}
        >
          {roleConfig.label}
        </span>
      </div>
    </div>
  );
}

export const UserProfileHeader = memo(UserProfileHeaderComponent);
export default UserProfileHeader;
