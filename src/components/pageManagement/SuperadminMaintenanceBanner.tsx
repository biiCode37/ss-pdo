import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  onManageAccess?: () => void;
  style?: React.CSSProperties;
}

export const SuperadminMaintenanceBanner: React.FC<Props> = ({ onManageAccess, style }) => {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'var(--color-warning-bg)',
        color: 'var(--color-warning-fg)',
        borderBottom: '1px solid var(--color-warning-border)',
        padding: '8px 16px',
        margin: '-12px -16px 10px -16px',
        borderRadius: '0 0 10px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontWeight: 600,
        boxShadow: '0 2px 8px var(--color-shadow, rgba(0, 0, 0, 0.15))',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <AlertTriangle size={16} style={{ color: 'var(--color-warning-fg)', flexShrink: 0 }} />
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.TEXT}
        </span>
      </div>

      {onManageAccess && (
        <button
          type="button"
          onClick={onManageAccess}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-warning-fg)',
            color: 'var(--color-surface-default)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: '10px',
            transition: 'opacity 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <Settings size={16} />
          {TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.MANAGE_BTN}
        </button>
      )}
    </div>
  );
};
