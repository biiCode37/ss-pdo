import { memo } from 'react';
import type { UnitPlottingItem, PlottingUnitStatus } from '@/types/supabase';
import { TEXT_PLOTTING } from '@/constants/texts';
import { ArrowDown, GripVertical, CheckCircle2, AlertTriangle, XCircle, ArrowLeftRight } from 'lucide-react';

export interface PlottingUnitCardProps {
  item: UnitPlottingItem;
  endpointAName: string;
  endpointBName: string;
  isReordering: boolean;
  isSelectedForMultiSelect: boolean;
  onToggleSelect: (unit: string) => void;
  onMoveToBottom: (unit: string) => void;
  onToggleStartPoint: (unit: string) => void;
  onUpdateTargetRitase: (unit: string, ritase: number) => void;
  onUpdateStatus: (unit: string, status: PlottingUnitStatus) => void;
  onCardClick?: (unit: string) => void;
  onDragStart?: (e: React.DragEvent, unit: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, unit: string) => void;
}

const RITASE_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

export const PlottingUnitCard = memo(function PlottingUnitCard({
  item,
  endpointAName,
  endpointBName,
  isReordering,
  isSelectedForMultiSelect,
  onToggleSelect,
  onMoveToBottom,
  onToggleStartPoint,
  onUpdateTargetRitase,
  onUpdateStatus,
  onCardClick,
  onDragStart,
  onDragOver,
  onDrop,
}: PlottingUnitCardProps) {
  const currentBaseName = item.start_point === 'A' ? endpointAName : endpointBName;

  const getStatusColor = (status: PlottingUnitStatus) => {
    switch (status) {
      case 'READY':
        return {
          bg: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.3)',
          fg: '#4ade80',
          icon: CheckCircle2,
          text: TEXT_PLOTTING.UNIT_CARD.STATUS_READY,
        };
      case 'TROUBLE':
        return {
          bg: 'rgba(234, 179, 8, 0.1)',
          border: 'rgba(234, 179, 8, 0.3)',
          fg: '#facc15',
          icon: AlertTriangle,
          text: TEXT_PLOTTING.UNIT_CARD.STATUS_TROUBLE,
        };
      case 'OFF':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          fg: '#f87171',
          icon: XCircle,
          text: TEXT_PLOTTING.UNIT_CARD.STATUS_OFF,
        };
    }
  };

  const statusConfig = getStatusColor(item.status);
  const StatusIcon = statusConfig.icon;

  const cycleStatus = () => {
    if (item.status === 'READY') onUpdateStatus(item.unit, 'TROUBLE');
    else if (item.status === 'TROUBLE') onUpdateStatus(item.unit, 'OFF');
    else onUpdateStatus(item.unit, 'READY');
  };

  return (
    <div
      draggable={isReordering}
      onDragStart={(e) => onDragStart?.(e, item.unit)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, item.unit)}
      onClick={() => {
        if (isReordering) {
          onToggleSelect(item.unit);
          onCardClick?.(item.unit);
        }
      }}
      data-testid={`plotting-card-${item.unit}`}
      style={{
        background: isSelectedForMultiSelect
          ? 'rgba(56, 189, 248, 0.12)'
          : 'var(--color-surface-raised, rgba(30, 41, 59, 0.6))',
        border: isSelectedForMultiSelect
          ? '1.5px solid var(--color-action-primary-bg, #38bdf8)'
          : '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
        borderRadius: '14px',
        padding: '12px 14px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
        cursor: isReordering ? 'pointer' : 'default',
        userSelect: isReordering ? 'none' : 'auto',
      }}
    >
      {/* Left: Drag Handle or Order Badge + Unit Body */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isReordering && (
          <div
            title="Tarik untuk memindahkan urutan"
            style={{
              color: 'var(--color-text-muted, #64748b)',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <GripVertical size={18} />
          </div>
        )}

        {/* Order Badge */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: isSelectedForMultiSelect
              ? 'var(--color-action-primary-bg, #0284c7)'
              : 'var(--color-surface-default, rgba(255, 255, 255, 0.08))',
            color: isSelectedForMultiSelect
              ? '#ffffff'
              : 'var(--color-text-primary, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.85rem',
            flexShrink: 0,
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))',
          }}
        >
          {item.order}
        </div>

        {/* Unit Name & Start Point Pill */}
        <div>
          <span
            style={{
              display: 'block',
              fontWeight: 800,
              fontSize: '0.98rem',
              color: 'var(--color-text-primary, #f8fafc)',
              letterSpacing: '-0.01em',
            }}
          >
            {item.unit}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStartPoint(item.unit);
            }}
            title="Klik untuk menukar titik start"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '3px',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              border: '1px solid rgba(56, 189, 248, 0.25)',
              background: 'rgba(56, 189, 248, 0.08)',
              color: '#38bdf8',
              cursor: 'pointer',
            }}
          >
            <span>📍 {currentBaseName}</span>
            <ArrowLeftRight size={10} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      {/* Right Controls: Target Ritase, Status Toggle, & Move To Bottom Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Target Ritase Selector */}
        <select
          value={item.target_ritase}
          onChange={(e) => onUpdateTargetRitase(item.unit, Number(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Target ritase ${item.unit}`}
          style={{
            padding: '4px 6px',
            borderRadius: '7px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
            color: 'var(--color-text-primary, #f8fafc)',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
            cursor: 'pointer',
          }}
        >
          {RITASE_OPTIONS.map((val) => (
            <option key={val} value={val} style={{ background: '#1e293b', color: '#fff' }}>
              {val} {TEXT_PLOTTING.UNIT_CARD.RITASE_UNIT}
            </option>
          ))}
        </select>

        {/* Status Pill Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            cycleStatus();
          }}
          title={`Ubah status ${item.unit} (Klik untuk berganti)`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: `1px solid ${statusConfig.border}`,
            background: statusConfig.bg,
            color: statusConfig.fg,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <StatusIcon size={12} />
          <span>{statusConfig.text}</span>
        </button>

        {/* Move To Bottom Button (In Reorder Mode) */}
        {isReordering && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveToBottom(item.unit);
            }}
            title={TEXT_PLOTTING.ACTIONS.MOVE_TO_BOTTOM}
            data-testid={`btn-move-bottom-${item.unit}`}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '7px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--color-text-secondary, #94a3b8)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
});
