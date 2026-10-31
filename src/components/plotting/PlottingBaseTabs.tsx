import { memo } from 'react';
import type { PlottingStartPoint } from '@/types/supabase';
import { TEXT_PLOTTING } from '@/constants/texts';

export interface PlottingBaseTabsProps {
  activePoint: PlottingStartPoint;
  onSelectPoint: (point: PlottingStartPoint) => void;
  endpointAName: string;
  endpointBName: string;
  countA: number;
  countB: number;
}

export const PlottingBaseTabs = memo(function PlottingBaseTabs({
  activePoint,
  onSelectPoint,
  endpointAName,
  endpointBName,
  countA,
  countB,
}: PlottingBaseTabsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '12px',
        padding: '4px',
        background: 'var(--color-surface-raised, rgba(30, 41, 59, 0.5))',
        borderRadius: '12px',
        border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
      }}
      role="tablist"
      aria-label="Pilihan Pangkalan Start"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activePoint === 'A'}
        onClick={() => onSelectPoint('A')}
        data-testid="tab-start-a"
        style={{
          padding: '8px 12px',
          borderRadius: '9px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          background:
            activePoint === 'A'
              ? 'var(--color-action-primary-bg, #0284c7)'
              : 'transparent',
          color:
            activePoint === 'A'
              ? 'var(--color-action-primary-fg, #ffffff)'
              : 'var(--color-text-secondary, #94a3b8)',
          boxShadow:
            activePoint === 'A' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
        }}
      >
        <span>{TEXT_PLOTTING.TABS.START_POINT_A(endpointAName, countA)}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activePoint === 'B'}
        onClick={() => onSelectPoint('B')}
        data-testid="tab-start-b"
        style={{
          padding: '8px 12px',
          borderRadius: '9px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          background:
            activePoint === 'B'
              ? 'var(--color-action-primary-bg, #0284c7)'
              : 'transparent',
          color:
            activePoint === 'B'
              ? 'var(--color-action-primary-fg, #ffffff)'
              : 'var(--color-text-secondary, #94a3b8)',
          boxShadow:
            activePoint === 'B' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
        }}
      >
        <span>{TEXT_PLOTTING.TABS.START_POINT_B(endpointBName, countB)}</span>
      </button>
    </div>
  );
});
