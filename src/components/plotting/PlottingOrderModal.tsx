import React, { useState, useEffect } from 'react';
import { X, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from 'lucide-react';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import type { UnitPlottingItem } from '@/types/supabase';

export interface PlottingOrderModalProps {
  isOpen: boolean;
  unitsToMove: string[];
  allBaseUnits: UnitPlottingItem[];
  onClose: () => void;
  onApplyMove: (
    unitsToMove: string[],
    placement: 'TOP' | 'BOTTOM' | 'ABOVE' | 'BELOW',
    referenceUnit?: string
  ) => void;
}

export const PlottingOrderModal: React.FC<PlottingOrderModalProps> = ({
  isOpen,
  unitsToMove,
  allBaseUnits,
  onClose,
  onApplyMove,
}) => {
  const [placement, setPlacement] = useState<'ABOVE' | 'BELOW'>('BELOW');
  const [selectedRefUnit, setSelectedRefUnit] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPlacement('BELOW');
      setSelectedRefUnit('');
    }
  }, [isOpen, unitsToMove]);

  if (!isOpen || unitsToMove.length === 0) {
    return null;
  }

  const isSingle = unitsToMove.length === 1;
  const currentItem = isSingle
    ? allBaseUnits.find((u) => u.unit === unitsToMove[0])
    : undefined;
  const currentOrder = currentItem ? currentItem.order : 1;

  const modalTitle = isSingle
    ? TEXT_PLOTTING.ORDER_MODAL.TITLE_SINGLE(unitsToMove[0], currentOrder)
    : TEXT_PLOTTING.ORDER_MODAL.TITLE_MULTI(unitsToMove.length);

  const candidateUnits = allBaseUnits.filter(
    (u) => !unitsToMove.includes(u.unit) && u.order > 0,
  );

  const handleQuickTop = () => {
    onApplyMove(unitsToMove, 'TOP', undefined);
  };

  const handleQuickBottom = () => {
    onApplyMove(unitsToMove, 'BOTTOM', undefined);
  };

  const handleSubmitRelative = () => {
    if (!selectedRefUnit) return;
    onApplyMove(unitsToMove, placement, selectedRefUnit);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-overlay)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-surface-raised)',
          borderRadius: '18px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 12px 36px var(--color-shadow)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--color-text-primary)',
              }}
            >
              {modalTitle}
            </h3>
          </div>
          <button
            type="button"
            data-testid="btn-close-modal"
            onClick={onClose}
            aria-label={TEXT_COMMON.BUTTONS.CLOSE}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Units Chips */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            maxHeight: '80px',
            overflowY: 'auto',
          }}
        >
          {unitsToMove.map((unit) => (
            <span
              key={unit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'var(--color-action-secondary-bg)',
                color: 'var(--color-action-secondary-fg)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              {unit}
            </span>
          ))}
        </div>

        {/* Quick 1-Tap Placement */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <button
            type="button"
            data-testid="btn-order-top"
            onClick={handleQuickTop}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-control)',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowUpToLine size={16} />
            <span>{TEXT_PLOTTING.ORDER_MODAL.QUICK_TOP}</span>
          </button>

          <button
            type="button"
            data-testid="btn-order-bottom"
            onClick={handleQuickBottom}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-control)',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowDownToLine size={16} />
            <span>{TEXT_PLOTTING.ORDER_MODAL.QUICK_BOTTOM}</span>
          </button>
        </div>

        {/* Relative Placement Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            {TEXT_PLOTTING.ORDER_MODAL.RELATIVE_HEADER}
          </span>

          {/* Direction Segmented Toggle */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'var(--color-surface-subtle)',
              padding: '4px',
              borderRadius: '10px',
            }}
          >
            <button
              type="button"
              data-testid="btn-dir-above"
              onClick={() => setPlacement('ABOVE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background:
                  placement === 'ABOVE'
                    ? 'var(--color-action-primary-bg)'
                    : 'transparent',
                color:
                  placement === 'ABOVE'
                    ? 'var(--color-action-primary-fg)'
                    : 'var(--color-text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowUp size={14} />
              <span>{TEXT_PLOTTING.ORDER_MODAL.DIR_ABOVE}</span>
            </button>

            <button
              type="button"
              data-testid="btn-dir-below"
              onClick={() => setPlacement('BELOW')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background:
                  placement === 'BELOW'
                    ? 'var(--color-action-primary-bg)'
                    : 'transparent',
                color:
                  placement === 'BELOW'
                    ? 'var(--color-action-primary-fg)'
                    : 'var(--color-text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowDown size={14} />
              <span>{TEXT_PLOTTING.ORDER_MODAL.DIR_BELOW}</span>
            </button>
          </div>

          {/* Reference Unit Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="select-ref-unit-input"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
              }}
            >
              {TEXT_PLOTTING.ORDER_MODAL.REF_LABEL}
            </label>
            <select
              id="select-ref-unit-input"
              data-testid="select-ref-unit"
              value={selectedRefUnit}
              onChange={(e) => setSelectedRefUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--color-border-control)',
                background: 'var(--color-surface-default)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="">{TEXT_PLOTTING.ORDER_MODAL.REF_PLACEHOLDER}</option>
              {candidateUnits.map((item) => (
                <option key={item.unit} value={item.unit}>
                  #{item.order} • {item.unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            data-testid="btn-order-cancel"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface-subtle)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {TEXT_COMMON.BUTTONS.CANCEL}
          </button>
          <button
            type="button"
            data-testid="btn-order-submit"
            disabled={!selectedRefUnit}
            onClick={handleSubmitRelative}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: selectedRefUnit
                ? 'var(--color-action-primary-bg)'
                : 'var(--color-disabled-bg)',
              color: selectedRefUnit
                ? 'var(--color-action-primary-fg)'
                : 'var(--color-disabled-fg)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: selectedRefUnit ? 'pointer' : 'not-allowed',
              opacity: selectedRefUnit ? 1 : 0.6,
              transition: 'all 0.15s ease',
            }}
          >
            {TEXT_PLOTTING.ORDER_MODAL.SUBMIT}
          </button>
        </div>
      </div>
    </div>
  );
};
