import { memo } from 'react';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import { Settings, Check, Save, RotateCcw } from 'lucide-react';

export interface PlottingHeaderProps {
  routeCode: string;
  date: string;
  endpointAName: string;
  endpointBName: string;
  totalUnits: number;
  readyUnits: number;
  troubleUnits: number;
  countA: number;
  countB: number;
  isReordering: boolean;
  isSaving: boolean;
  onToggleReordering: () => void;
  onApplyRolling: () => void;
  onSave: () => void;
}

export const PlottingHeader = memo(function PlottingHeader({
  routeCode,
  date,
  endpointAName,
  endpointBName,
  totalUnits,
  readyUnits,
  troubleUnits,
  countA,
  countB,
  isReordering,
  isSaving,
  onToggleReordering,
  onApplyRolling,
  onSave,
}: PlottingHeaderProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface-raised, rgba(30, 41, 59, 0.7))',
        borderRadius: '16px',
        border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
        padding: '16px',
        marginBottom: '14px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Title & Date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--color-text-primary, #f8fafc)',
              letterSpacing: '-0.01em',
            }}
          >
            {TEXT_PLOTTING.TITLE}
          </h2>
          <p
            style={{
              margin: '3px 0 0 0',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #94a3b8)',
            }}
          >
            {TEXT_PLOTTING.SUBTITLE(routeCode, date)}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onToggleReordering}
            data-testid="btn-toggle-reordering"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isReordering
                ? '1px solid var(--color-success-border, rgba(34, 197, 94, 0.4))'
                : '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.15))',
              background: isReordering
                ? 'var(--color-success-bg, rgba(34, 197, 94, 0.15))'
                : 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
              color: isReordering
                ? 'var(--color-success-fg, #4ade80)'
                : 'var(--color-text-primary, #f8fafc)',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {isReordering ? <Check size={14} /> : <Settings size={14} />}
            <span>
              {isReordering
                ? TEXT_PLOTTING.ACTIONS.FINISH_REORDER
                : TEXT_PLOTTING.ACTIONS.START_REORDER}
            </span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            data-testid="btn-save-plotting"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              border: 'none',
              background: 'var(--color-action-primary-bg, #0284c7)',
              color: 'var(--color-action-primary-fg, #ffffff)',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <Save size={14} />
            <span>
              {isSaving
                ? TEXT_PLOTTING.ACTIONS.SAVING
                : TEXT_COMMON.BUTTONS.SAVE}
            </span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
        }}
      >
        <div
          style={{
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: '10px',
            padding: '6px 8px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontWeight: 600,
            }}
          >
            Total
          </span>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--color-text-primary, #f8fafc)',
            }}
          >
            {totalUnits}
          </span>
        </div>

        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '10px',
            padding: '6px 8px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              color: '#4ade80',
              fontWeight: 600,
            }}
          >
            Siap
          </span>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: '#22c55e',
            }}
          >
            {readyUnits}
          </span>
        </div>

        {troubleUnits > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '0.68rem',
                color: '#f87171',
                fontWeight: 600,
              }}
            >
              Kendala
            </span>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#ef4444',
              }}
            >
              {troubleUnits}
            </span>
          </div>
        )}

        <div
          style={{
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: '10px',
            padding: '6px 8px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontWeight: 600,
            }}
          >
            {endpointAName}
          </span>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--color-action-primary-bg, #38bdf8)',
            }}
          >
            {countA}
          </span>
        </div>

        <div
          style={{
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: '10px',
            padding: '6px 8px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontWeight: 600,
            }}
          >
            {endpointBName}
          </span>
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--color-accent-amber, #fbbf24)',
            }}
          >
            {countB}
          </span>
        </div>
      </div>

      {/* Extra Action when Reordering: Smart Rolling Kemarin Button */}
      {isReordering && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary, #94a3b8)',
            }}
          >
            {TEXT_PLOTTING.ACTIONS.APPLY_ROLLING_DESC}
          </span>

          <button
            type="button"
            onClick={onApplyRolling}
            data-testid="btn-apply-rolling"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <RotateCcw size={13} />
            <span>{TEXT_PLOTTING.ACTIONS.APPLY_ROLLING}</span>
          </button>
        </div>
      )}
    </div>
  );
});
