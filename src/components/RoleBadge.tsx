import React from 'react';
import { Crown, Shield, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role?: 'superadmin' | 'admin' | 'petugas' | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = 'petugas',
  size = 'sm',
  showIcon = true,
  className = '',
  style,
}) => {
  const normalizedRole = (role || 'petugas').toLowerCase();

  let badgeConfig = {
    label: 'Petugas',
    icon: UserCheck,
    classes: 'role-badge-petugas text-emerald-700 from-emerald-500',
    style: {
      background: 'rgba(16, 185, 129, 0.14)',
      borderColor: 'rgba(16, 185, 129, 0.38)',
      color: '#34d399',
    },
  };

  if (normalizedRole === 'superadmin') {
    badgeConfig = {
      label: 'Superadmin',
      icon: Crown,
      classes: 'role-badge-superadmin text-amber-700 from-amber-500',
      style: {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(168, 85, 247, 0.18))',
        borderColor: 'rgba(245, 158, 11, 0.48)',
        color: '#fbbf24',
      },
    };
  } else if (normalizedRole === 'admin') {
    badgeConfig = {
      label: 'Admin',
      icon: Shield,
      classes: 'role-badge-admin text-sky-700 from-sky-500',
      style: {
        background: 'rgba(14, 165, 233, 0.14)',
        borderColor: 'rgba(14, 165, 233, 0.42)',
        color: '#38bdf8',
      },
    };
  }

  const sizeStyles: Record<'xs' | 'sm' | 'md', React.CSSProperties> = {
    xs: { fontSize: '10.5px', padding: '2px 7px', gap: '4px' },
    sm: { fontSize: '11.5px', padding: '3.5px 9px', gap: '5.5px' },
    md: { fontSize: '13px', padding: '4.5px 12px', gap: '6.5px' },
  };

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
  }[size];

  const IconComponent = badgeConfig.icon;

  return (
    <span
      className={`role-badge-pill ${badgeConfig.classes} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...badgeConfig.style,
        ...sizeStyles[size],
        ...style,
      }}
    >
      {showIcon && <IconComponent size={iconSizes} style={{ flexShrink: 0 }} />}
      <span>{badgeConfig.label}</span>
    </span>
  );
};
