import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  onManageAccess?: () => void;
}

export const SuperadminMaintenanceBanner: React.FC<Props> = ({ onManageAccess }) => {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        backgroundColor: 'var(--color-warning-bg)',
        color: 'var(--color-warning-fg)',
        borderBottom: '1px solid var(--color-warning-border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12.5px',
        fontWeight: 600,
        boxShadow: '0 2px 8px var(--color-shadow, rgba(0, 0, 0, 0.15))',
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
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-warning-fg)',
            color: 'var(--color-surface-default)',
            border: 'none',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: '12px',
            transition: 'opacity 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <Settings size={13} />
          {TEXT_PAGE_MANAGEMENT.SUPERADMIN_BANNER.MANAGE_BTN}
        </button>
      )}
    </div>
  );
};
