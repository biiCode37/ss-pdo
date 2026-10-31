import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Users,
  RotateCcw,
  X,
} from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  selectedCount: number;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onSetRoles: () => void;
  onResetDefault: () => void;
  onDeselectAll: () => void;
  isLoading?: boolean;
}

export const FloatingBulkActionBar: React.FC<Props> = ({
  selectedCount,
  onEnableAll,
  onDisableAll,
  onSetRoles,
  onResetDefault,
  onDeselectAll,
  isLoading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        width: 'calc(100% - 32px)',
        maxWidth: '680px',
        backgroundColor: 'var(--color-surface-default)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '20px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'pmSpringSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Left Info & Deselect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <button
          type="button"
          data-testid="bulk-action-deselect"
          onClick={onDeselectAll}
          aria-label={TEXT_PAGE_MANAGEMENT.BULK_ACTION.DESELECT_ALL}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-surface-subtle)',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={15} />
        </button>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {TEXT_PAGE_MANAGEMENT.BULK_ACTION.SELECTED_COUNT(selectedCount)}
        </span>
      </div>

      {/* Right Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Enable All */}
        <button
          type="button"
          data-testid="bulk-action-enable"
          disabled={isLoading}
          onClick={onEnableAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 11px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-success-bg, rgba(16, 185, 129, 0.14))',
            border: '1px solid var(--color-success-border, rgba(16, 185, 129, 0.3))',
            color: 'var(--color-success-fg, #10b981)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '36px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_ENABLE_ALL}</span>
        </button>

        {/* Disable All */}
        <button
          type="button"
          data-testid="bulk-action-disable"
          disabled={isLoading}
          onClick={onDisableAll}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 11px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-warning-bg, rgba(245, 158, 11, 0.14))',
            border: '1px solid var(--color-warning-border, rgba(245, 158, 11, 0.3))',
            color: 'var(--color-warning-fg, #f59e0b)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '36px',
          }}
        >
          <AlertCircle size={14} />
          <span>{TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_DISABLE_ALL}</span>
        </button>

        {/* Set Roles */}
        <button
          type="button"
          data-testid="bulk-action-roles"
          disabled={isLoading}
          onClick={onSetRoles}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 11px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-action-primary-bg)',
            border: 'none',
            color: 'var(--color-action-primary-fg)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '36px',
          }}
        >
          <Users size={14} />
          <span>{TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_SET_ROLES}</span>
        </button>

        {/* Reset Default */}
        <button
          type="button"
          data-testid="bulk-action-reset"
          disabled={isLoading}
          onClick={onResetDefault}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 11px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '36px',
          }}
        >
          <RotateCcw size={14} />
          <span>{TEXT_PAGE_MANAGEMENT.BULK_ACTION.ACTION_RESET_DEFAULT}</span>
        </button>
      </div>
    </div>
  );
};
