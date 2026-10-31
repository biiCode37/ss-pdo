import React from "react";
import { Crown, Shield, UserCheck, Compass, Radio } from "lucide-react";
import type { UserRole } from "@/types/supabase";

export interface RoleBadgeProps {
  role?: UserRole | "petugas" | string;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = "pdo",
  size = "sm",
  showIcon = true,
  className = "",
  style,
}) => {
  const normalizedRole = (role || "pdo").toLowerCase();

  let badgeConfig = {
    label: "PDO",
    icon: UserCheck,
    classes:
      "role-badge-pdo role-badge-petugas text-emerald-700 from-emerald-500",
    style: {
      background: "var(--color-role-pdo-bg)",
      borderColor: "var(--color-role-pdo-border)",
      color: "var(--color-role-pdo-fg)",
    },
  };

  if (normalizedRole === "superadmin") {
    badgeConfig = {
      label: "Superadmin",
      icon: Crown,
      classes: "role-badge-superadmin text-amber-700 from-amber-500",
      style: {
        background: "var(--color-role-superadmin-bg)",
        borderColor: "var(--color-role-superadmin-border)",
        color: "var(--color-role-superadmin-fg)",
      },
    };
  } else if (normalizedRole === "admin") {
    badgeConfig = {
      label: "Admin",
      icon: Shield,
      classes: "role-badge-admin text-sky-700 from-sky-500",
      style: {
        background: "var(--color-role-admin-bg)",
        borderColor: "var(--color-role-admin-border)",
        color: "var(--color-role-admin-fg)",
      },
    };
  } else if (normalizedRole === "korwil") {
    badgeConfig = {
      label: "Korwil",
      icon: Compass,
      classes: "role-badge-korwil text-indigo-700 from-indigo-500",
      style: {
        background: "var(--color-role-korwil-bg)",
        borderColor: "var(--color-role-korwil-border)",
        color: "var(--color-role-korwil-fg)",
      },
    };
  } else if (normalizedRole === "korlap") {
    badgeConfig = {
      label: "Korlap",
      icon: Radio,
      classes: "role-badge-korlap text-orange-700 from-orange-500",
      style: {
        background: "var(--color-role-korlap-bg)",
        borderColor: "var(--color-role-korlap-border)",
        color: "var(--color-role-korlap-fg)",
      },
    };
  } else if (normalizedRole === "petugas") {
    badgeConfig = {
      label: "Petugas",
      icon: UserCheck,
      classes: "role-badge-petugas text-emerald-700 from-emerald-500",
      style: {
        background: "var(--color-role-pdo-bg)",
        borderColor: "var(--color-role-pdo-border)",
        color: "var(--color-role-pdo-fg)",
      },
    };
  }

  const sizeStyles: Record<"xs" | "sm" | "md", React.CSSProperties> = {
    xs: { fontSize: "10.5px", padding: "2px 7px", gap: "4px" },
    sm: { fontSize: "11.5px", padding: "3.5px 9px", gap: "5.5px" },
    md: { fontSize: "13px", padding: "4.5px 12px", gap: "6.5px" },
  };

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
  }[size];

  const IconComponent = badgeConfig.icon;

  return (
    <span
      className={`role-badge-pill inline-flex items-center font-bold rounded-lg border transition-all duration-150 ${badgeConfig.classes} ${className}`}
      style={{
        ...sizeStyles[size],
        ...badgeConfig.style,
        ...style,
      }}
    >
      {showIcon && (
        <IconComponent
          size={iconSizes}
          className="shrink-0 transition-transform duration-150"
          aria-hidden="true"
        />
      )}
      <span className="truncate tracking-wide">{badgeConfig.label}</span>
    </span>
  );
};

export default RoleBadge;
