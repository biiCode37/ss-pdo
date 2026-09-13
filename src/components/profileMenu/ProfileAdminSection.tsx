import React from "react";
import { Users, History, ChevronRight } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { UserRole } from "@/utils/roleStorage";

interface ProfileAdminSectionProps {
  role?: UserRole | "petugas";
  onClose: () => void;
  onOpenUserManagement?: () => void;
}

export const ProfileAdminSection: React.FC<ProfileAdminSectionProps> = ({
  role,
  onClose,
  onOpenUserManagement,
}) => {
  if (role !== "superadmin" && role !== "admin") return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <span
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          display: "block",
          marginBottom: "8px",
          paddingLeft: "4px",
        }}
      >
        {TEXT_DASHBOARD.PROFILE_MENU.ADMIN_SECTION}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Kelola Pengguna */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenUserManagement?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "var(--bg-secondary, rgba(255,255,255,0.03))",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            fontWeight: 500,
            fontSize: "13.5px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={18} style={{ color: "#3b82f6" }} />
            <div style={{ textAlign: "left" }}>
              <div>{TEXT_DASHBOARD.PROFILE_MENU.USER_MANAGEMENT}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "1px",
                }}
              >
                {TEXT_DASHBOARD.PROFILE_MENU.USER_MANAGEMENT_DESC}
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>

        {/* Log Aktivitas & Audit (Disabled - Coming Soon) */}
        {/* BUG-66: Halaman belum siap production — dikunci untuk SEMUA
            role. Button disabled & nonaktifkan pintu masuk satu-satunya. */}
        <button
          type="button"
          disabled={true}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "var(--bg-secondary, rgba(255,255,255,0.03))",
            border: "1px solid var(--card-border)",
            color: "var(--text-secondary)",
            fontWeight: 500,
            fontSize: "13.5px",
            cursor: "not-allowed",
            opacity: 0.65,
          }}
          title={TEXT_DASHBOARD.PROFILE_MENU.COMING_SOON_TITLE}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <History size={18} style={{ color: "var(--text-secondary)" }} />
            <div style={{ textAlign: "left" }}>
              <div>{TEXT_DASHBOARD.PROFILE_MENU.AUDIT_LOG}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "1px",
                }}
              >
                {TEXT_DASHBOARD.PROFILE_MENU.AUDIT_LOG_DESC}
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "6px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--warning-color, #f59e0b)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_DASHBOARD.PROFILE_MENU.COMING_SOON}
          </span>
        </button>
      </div>
    </div>
  );
};
