import { useState, useEffect, memo } from "react";
import { User } from "lucide-react";
import { TEXT_DASHBOARD, TEXT_USER_MANAGEMENT } from "../constants/texts";
import { getStoredUserRole, type UserRole } from "../utils/roleStorage";

interface UserProfileHeaderProps {
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

  const syncProfile = () => {
    const freshAvatar = localStorage.getItem("PDO_USER_AVATAR") || undefined;
    setProfile((prev) => {
      if (prev.avatarUrl !== freshAvatar) {
        setAvatarFailed(false);
      }
      return {
        fullName:
          localStorage.getItem("PDO_USER_NAME")?.trim() ||
          TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_NAME,
        role: getStoredUserRole(),
        avatarUrl: freshAvatar,
      };
    });
  };

  useEffect(() => {
    window.addEventListener("storage", syncProfile);
    window.addEventListener("focus", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("focus", syncProfile);
    };
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenProfile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProfile();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        minWidth: 0,
        cursor: "pointer",
        padding: "4px 8px 4px 4px",
        borderRadius: "12px",
        transition:
          "background 0.2s cubic-bezier(0.32, 0.72, 0, 1), transform 0.15s ease",
        userSelect: "none",
        textAlign: "left",
      }}
      title="Buka Menu Profil & Pengaturan Akun"
      aria-label="Profil Akun Pengguna"
      className="hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
      data-testid="user-profile-header-btn"
    >
      {/* Avatar Container */}
      {profile.avatarUrl && !avatarFailed ? (
        <img
          src={profile.avatarUrl}
          alt={profile.fullName}
          onError={() => setAvatarFailed(true)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: "1.5px solid var(--border-color, rgba(255, 255, 255, 0.15))",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
          }}
        />
      ) : (
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3ECF8E, #24B47E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#061a10",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(62, 207, 142, 0.25)",
          }}
        >
          <User size={18} />
        </div>
      )}

      {/* User Info Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "flex-start",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.2px",
            textAlign: "left",
            display: "block",
            width: "100%",
          }}
        >
          {profile.fullName}
        </span>
        {(() => {
          const roleConfig =
            ROLE_DISPLAY_CONFIG[profile.role] || ROLE_DISPLAY_CONFIG.pdo;
          return (
            <span
              className={`header-profile-role ${roleConfig.className}`}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.25,
                marginTop: "1.5px",
                textAlign: "left",
                display: "block",
                width: "100%",
                letterSpacing: "0.2px",
              }}
            >
              {roleConfig.label}
            </span>
          );
        })()}
      </div>
    </div>
  );
}

export const UserProfileHeader = memo(UserProfileHeaderComponent);
