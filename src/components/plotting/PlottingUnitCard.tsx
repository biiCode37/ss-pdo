import { memo } from 'react';
import type { UnitPlottingItem, PlottingUnitStatus } from '@/types/supabase';
import { TEXT_PLOTTING } from '@/constants/texts';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  Minus,
  Plus,
  Circle,
  Zap,
} from 'lucide-react';

export interface PlottingUnitCardProps {
  item: UnitPlottingItem;
  endpointAName: string;
  endpointBName: string;
  isReordering: boolean;
  isSelectedForMultiSelect: boolean;
  onToggleSelect: (unit: string) => void;
  onMoveUp?: (unit: string) => void;
  onMoveDown?: (unit: string) => void;
  onToggleStartPoint: (unit: string) => void;
  onUpdateTargetRitase: (unit: string, ritase: number) => void;
  onOpenTargetModal?: (unit: string, currentRitase: number) => void;
  onOpenTroubleModal?: (unit: string) => void;
  onUpdateStatus: (unit: string, status: PlottingUnitStatus) => void;
  onCardClick?: (unit: string) => void;
  onDragStart?: (e: React.DragEvent, unit: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, unit: string) => void;
}

export const PlottingUnitCard = memo(function PlottingUnitCard({
  item,
  endpointAName,
  endpointBName,
  isReordering,
  isSelectedForMultiSelect,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onToggleStartPoint,
  onUpdateTargetRitase,
  onOpenTargetModal,
  onOpenTroubleModal,
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
          bg: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))',
          border: 'var(--color-success-border, rgba(34, 197, 94, 0.3))',
          fg: 'var(--color-success-fg, #4ade80)',
          icon: CheckCircle2,
          text: TEXT_PLOTTING.UNIT_CARD.STATUS_READY,
        };
      case 'TROUBLE':
        return {
          bg: 'var(--color-warning-bg, rgba(234, 179, 8, 0.12))',
          border: 'var(--color-warning-border, rgba(234, 179, 8, 0.35))',
          fg: 'var(--color-warning-fg, #facc15)',
          icon: AlertTriangle,
          text: item.keterangan || item.note || TEXT_PLOTTING.UNIT_CARD.STATUS_TROUBLE,
        };
      case 'OFF':
        return {
          bg: 'var(--color-error-bg, rgba(239, 68, 68, 0.12))',
          border: 'var(--color-error-border, rgba(239, 68, 68, 0.35))',
          fg: 'var(--color-error-fg, #f87171)',
          icon: XCircle,
          text: item.keterangan || TEXT_PLOTTING.UNIT_CARD.STATUS_OFF,
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

  const handleStepRitase = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = Math.max(0, Math.min(20, Number((item.target_ritase + delta).toFixed(1))));
    onUpdateTargetRitase(item.unit, nextVal);
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
        marginBottom: '10px',
        cursor: isReordering ? 'grab' : 'default',
        userSelect: isReordering ? 'none' : 'auto',
        WebkitUserSelect: isReordering ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* BARIS 1: Drag Handle, Urutan, Nama Unit, Tombol Panah Reorder, Badge Titik Start (Pojok Kanan) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Sisi Kiri: Selector Checkbox, Drag Handle, Order Badge, Unit Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          {/* Checkbox Selector Bebas */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.unit);
            }}
            data-testid={`btn-select-${item.unit}`}
            aria-label={TEXT_PLOTTING.UNIT_CARD.SELECT_UNIT_ARIA(item.unit)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isSelectedForMultiSelect ? (
              <CheckCircle2 size={18} color="var(--color-action-primary-bg, #38bdf8)" />
            ) : (
              <Circle size={18} color="var(--color-text-secondary, #64748b)" />
            )}
          </button>

          {/* Drag Handle Indicator */}
          {isReordering && (
            <div
              style={{
                color: 'var(--color-text-secondary, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                cursor: 'grab',
                flexShrink: 0,
              }}
              title={TEXT_PLOTTING.UNIT_CARD.DRAG_HANDLE_TITLE}
            >
              <GripVertical size={16} />
            </div>
          )}

          {/* Sequential Order Badge */}
          <span
            data-testid={`badge-order-${item.unit}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '24px',
              height: '24px',
              padding: '0 5px',
              borderRadius: '6px',
              background: 'var(--color-surface-default, rgba(255, 255, 255, 0.08))',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
              color: 'var(--color-text-primary, #f8fafc)',
              fontSize: '0.8rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {item.order}
          </span>

          {/* Unit Name (KWK 222153) - Satu baris rapi tanpa wrapping */}
          <span
            style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'var(--color-text-primary, #f8fafc)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.unit}
          </span>
        </div>

        {/* Sisi Kanan: Tombol Reorder Panah Atas & Bawah, lalu Badge Titik Start (Pojok Kanan) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Tombol Reorder Panah Atas & Bawah */}
          {isReordering && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.(item.unit);
                }}
                data-testid={`btn-move-up-${item.unit}`}
                title={TEXT_PLOTTING.UNIT_CARD.MOVE_UP_TITLE}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
                  border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--color-text-secondary, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowUp size={14} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.(item.unit);
                }}
                data-testid={`btn-move-down-${item.unit}`}
                title={TEXT_PLOTTING.UNIT_CARD.MOVE_DOWN_TITLE}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
                  border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
                  color: 'var(--color-text-secondary, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowDown size={14} />
              </button>
            </div>
          )}

          {/* Pangkalan Start Switch Badge (Pojok Paling Kanan) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStartPoint(item.unit);
            }}
            data-testid={`btn-toggle-base-${item.unit}`}
            title={`Pangkalan start: ${currentBaseName} (Klik untuk memindahkan pangkalan)`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              border: '1px solid var(--color-info-border, rgba(56, 189, 248, 0.25))',
              background: 'var(--color-info-bg, rgba(56, 189, 248, 0.08))',
              color: 'var(--color-info-fg, #38bdf8)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <span>📍 {currentBaseName}</span>
            <ArrowLeftRight size={10} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      {/* BARIS 2: Kontrol Operasional (Target Ritase Fleksibel & Status Kesiapan) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06))',
          paddingTop: '8px',
          gap: '8px',
        }}
      >
        {/* Target Ritase: Stepper & Interactive Pill (Bisa diatur bebas berapapun) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={(e) => handleStepRitase(-0.5, e)}
            aria-label={TEXT_PLOTTING.UNIT_CARD.STEP_MINUS_ARIA}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
              background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
              color: 'var(--color-text-secondary, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Minus size={12} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenTargetModal) {
                onOpenTargetModal(item.unit, item.target_ritase);
              }
            }}
            data-testid={`btn-ritase-modal-${item.unit}`}
            title={TEXT_PLOTTING.UNIT_CARD.RITASE_PILL_TITLE}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
              background: 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
              color: 'var(--color-text-primary, #f8fafc)',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Zap size={11} color="var(--color-action-primary-bg, #38bdf8)" />
            <span>{item.target_ritase} {TEXT_PLOTTING.UNIT_CARD.RITASE_UNIT}</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleStepRitase(0.5, e)}
            aria-label={TEXT_PLOTTING.UNIT_CARD.STEP_PLUS_ARIA}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
              background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
              color: 'var(--color-text-secondary, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Status Pill Toggle (Siap / Kendala / OFF) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenTroubleModal) {
              onOpenTroubleModal(item.unit);
            } else {
              cycleStatus();
            }
          }}
          data-testid={`btn-status-${item.unit}`}
          title={TEXT_PLOTTING.UNIT_CARD.STATUS_PILL_TITLE(item.unit)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: 700,
            border: `1px solid ${statusConfig.border}`,
            background: statusConfig.bg,
            color: statusConfig.fg,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <StatusIcon size={13} />
          <span>{statusConfig.text}</span>
        </button>
      </div>
    </div>
  );
});
