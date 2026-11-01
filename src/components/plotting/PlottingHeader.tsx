import { memo } from 'react';
import { TEXT_PLOTTING } from '@/constants/texts';
import { Settings, Check, Save, RotateCcw, Zap } from 'lucide-react';

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
  defaultTargetRitase?: number;
  isReordering: boolean;
  isSaving: boolean;
  onToggleReordering: () => void;
  onApplyRolling: () => void;
  onOpenTargetModal?: () => void;
  onSave: () => void;
}

export const PlottingHeader = memo(function PlottingHeader({
  routeCode,
  date,
  totalUnits,
  readyUnits,
  troubleUnits,
  defaultTargetRitase = 7.5,
  isReordering,
  isSaving,
  onToggleReordering,
  onApplyRolling,
  onOpenTargetModal,
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
      {/* 1. Judul & Subtitle Halaman Plotting (Lega, Tanpa Himpitan) */}
      <div style={{ marginBottom: '12px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--color-text-primary, #f8fafc)',
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
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

      {/* 2. Tombol Aksi Utama: Atur Urutan & Simpan Plotting */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <button
          type="button"
          onClick={onToggleReordering}
          data-testid="btn-toggle-reordering"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.82rem',
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
          {isReordering ? <Check size={15} /> : <Settings size={15} />}
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
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            border: 'none',
            background: 'var(--color-action-primary-bg, #0284c7)',
            color: 'var(--color-action-primary-fg, #ffffff)',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <Save size={15} />
          <span>
            {isSaving
              ? TEXT_PLOTTING.ACTIONS.SAVING
              : TEXT_PLOTTING.ACTIONS.SAVE}
          </span>
        </button>
      </div>

      {/* 3 Essential Metric Counters (Always balanced 3 columns on mobile) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        {/* Total Unit */}
        <div
          style={{
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: '10px',
            padding: '8px 10px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              color: 'var(--color-text-secondary, #94a3b8)',
              fontWeight: 600,
            }}
          >
            Total Unit
          </span>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--color-text-primary, #f8fafc)',
            }}
          >
            {totalUnits}
          </span>
        </div>

        {/* Siap Jalan */}
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '10px',
            padding: '8px 10px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              color: '#4ade80',
              fontWeight: 600,
            }}
          >
            Siap Jalan
          </span>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#22c55e',
            }}
          >
            {readyUnits}
          </span>
        </div>

        {/* Kendala / OFF */}
        <div
          style={{
            background: troubleUnits > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            border: troubleUnits > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
            borderRadius: '10px',
            padding: '8px 10px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              color: troubleUnits > 0 ? '#f87171' : 'var(--color-text-secondary, #94a3b8)',
              fontWeight: 600,
            }}
          >
            Kendala
          </span>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: troubleUnits > 0 ? '#ef4444' : 'var(--color-text-muted, #64748b)',
            }}
          >
            {troubleUnits}
          </span>
        </div>
      </div>

      {/* Operational Toolbar: Target Ritase Rute & Rolling Kemarin */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--color-surface-default, rgba(255, 255, 255, 0.03))',
          border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
          borderRadius: '10px',
          padding: '8px 12px',
        }}
      >
        {/* Target Ritase Default Controller */}
        <button
          type="button"
          onClick={onOpenTargetModal}
          data-testid="btn-open-target-modal-header"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary, #94a3b8)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <Zap size={14} color="#38bdf8" />
          <span>{TEXT_PLOTTING.TARGET_MODAL.DEFAULT_TARGET_LABEL}</span>
          <span
            style={{
              fontWeight: 800,
              color: 'var(--color-action-primary-bg, #38bdf8)',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            {defaultTargetRitase} Rit
          </span>
        </button>

        {/* Rolling Kemarin Action Button */}
        <button
          type="button"
          onClick={onApplyRolling}
          data-testid="btn-apply-rolling"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            background: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <RotateCcw size={12} />
          <span>{TEXT_PLOTTING.ACTIONS.APPLY_ROLLING}</span>
        </button>
      </div>
    </div>
  );
});
