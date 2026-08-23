import React from 'react';
import { Crown, Shield, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role?: 'superadmin' | 'admin' | 'petugas' | string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = 'petugas',
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const normalizedRole = (role || 'petugas').toLowerCase();

  let badgeConfig = {
    label: 'Petugas',
    icon: UserCheck,
    classes:
      'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-500/30',
  };

  if (normalizedRole === 'superadmin') {
    badgeConfig = {
      label: 'Superadmin',
      icon: Crown,
      classes:
        'bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40 dark:border-amber-400/50 font-semibold shadow-xs',
    };
  } else if (normalizedRole === 'admin') {
    badgeConfig = {
      label: 'Admin',
      icon: Shield,
      classes:
        'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300/50 dark:border-sky-500/30 font-medium',
    };
  }

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
  }[size];

  const IconComponent = badgeConfig.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide select-none ${sizeClasses} ${badgeConfig.classes} ${className}`}
    >
      {showIcon && <IconComponent size={iconSizes} className="shrink-0" />}
      <span>{badgeConfig.label}</span>
    </span>
  );
};
