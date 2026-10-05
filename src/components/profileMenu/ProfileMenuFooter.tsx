import React from "react";
import { LogOut } from "lucide-react";
import { showLogoutConfirm } from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface ProfileMenuFooterProps {
  onLogout: () => void;
  onDismiss: () => void;
}

export const ProfileMenuFooter: React.FC<ProfileMenuFooterProps> = ({
  onLogout,
  onDismiss,
}) => {
  const handleLogoutClick = async () => {
    const confirmed = await showLogoutConfirm();
    if (confirmed) {
      onLogout();
      onDismiss();
    }
  };

  return (
    <>
      {/* Catatan Transparansi Aktivitas */}
      <div style={{ textAlign: "center", padding: "0 8px 2px 8px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          {TEXT_DASHBOARD.PROFILE_MENU.SESSION_NOTE}
        </p>
      </div>

      {/* SECTION: Manajemen Akun (Logout) */}
      <div>
        <button
          type="button"
          onClick={handleLogoutClick}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            borderRadius: "12px",
            background: "rgba(247, 85, 85, 0.08)",
            border: "1px solid rgba(247, 85, 85, 0.2)",
            color: "var(--danger-color, #f75555)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <LogOut size={18} />
          <span>{TEXT_DASHBOARD.PROFILE_MENU.LOGOUT_BTN}</span>
        </button>
      </div>
    </>
  );
};
