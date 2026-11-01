import { useState, useEffect } from 'react';
import { X, Minus, Plus, Zap, Check } from 'lucide-react';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';

export interface TargetRitaseModalProps {
  isOpen: boolean;
  initialValue: number;
  targetUnit?: string;
  endpointName?: string;
  selectedCount?: number;
  onClose: () => void;
  onApply: (val: number, scope: 'unit' | 'base' | 'all' | 'selected') => void;
}

const COMMON_PRESETS = [0, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];

export const TargetRitaseModal: React.FC<TargetRitaseModalProps> = ({
  isOpen,
  initialValue,
  targetUnit,
  endpointName,
  selectedCount,
  onClose,
  onApply,
}) => {
  const [val, setVal] = useState<number>(initialValue !== undefined ? initialValue : 7.5);

  useEffect(() => {
    if (isOpen) {
      setVal(initialValue !== undefined ? initialValue : 7.5);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleStep = (delta: number) => {
    setVal((prev) => Math.max(0, Math.min(20, Number((prev + delta).toFixed(1)))));
  };

  const handleDirectChange = (raw: string) => {
    if (raw === '') {
      setVal(0);
      return;
    }
    const num = parseFloat(raw.replace(',', '.'));
    if (!isNaN(num)) {
      setVal(Math.max(0, Math.min(20, num)));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--color-surface-raised, #1e293b)',
          borderRadius: '18px',
          border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              {selectedCount && selectedCount > 0
                ? TEXT_PLOTTING.BULK_TARGET_MODAL.TITLE(selectedCount)
                : TEXT_PLOTTING.TARGET_MODAL.TITLE}
            </h3>
            <p
              style={{
                margin: '3px 0 0 0',
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary, #94a3b8)',
              }}
            >
              {selectedCount && selectedCount > 0
                ? TEXT_PLOTTING.BULK_TARGET_MODAL.SUBTITLE
                : TEXT_PLOTTING.TARGET_MODAL.SUBTITLE(targetUnit)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary, #94a3b8)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper + Input Numeric */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '14px',
            background: 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
            borderRadius: '14px',
            border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
          }}
        >
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            disabled={val <= 0}
            aria-label="Kurang 0.5 rit"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.15))',
              background: 'var(--color-surface-raised, rgba(255, 255, 255, 0.08))',
              color: 'var(--color-text-primary, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: val <= 0 ? 'not-allowed' : 'pointer',
              opacity: val <= 0 ? 0.4 : 1,
            }}
          >
            <Minus size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <input
              type="number"
              step="0.5"
              min="0"
              max="25"
              value={val}
              onChange={(e) => handleDirectChange(e.target.value)}
              style={{
                width: '74px',
                textAlign: 'center',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--color-action-primary-bg, #38bdf8)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary, #94a3b8)',
              }}
            >
              {TEXT_PLOTTING.UNIT_CARD.RITASE_UNIT}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            aria-label="Tambah 0.5 rit"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.15))',
              background: 'var(--color-surface-raised, rgba(255, 255, 255, 0.08))',
              color: 'var(--color-text-primary, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.74rem',
              color: 'var(--color-text-secondary, #94a3b8)',
              marginBottom: '6px',
              fontWeight: 600,
            }}
          >
            {TEXT_PLOTTING.TARGET_MODAL.QUICK_PRESETS}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {COMMON_PRESETS.map((preset) => {
              const isSelected = val === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVal(preset)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    border: isSelected
                      ? '1px solid var(--color-action-primary-bg, #38bdf8)'
                      : '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))',
                    background: isSelected
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
                    color: isSelected
                      ? 'var(--color-action-primary-bg, #38bdf8)'
                      : 'var(--color-text-primary, #f8fafc)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset} Rit
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          {selectedCount && selectedCount > 0 ? (
            <button
              type="button"
              onClick={() => onApply(val, 'selected')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--color-action-primary-bg, #0284c7)',
                color: 'var(--color-action-primary-fg, #ffffff)',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Zap size={16} />
              <span>{TEXT_PLOTTING.BULK_TARGET_MODAL.APPLY_BTN(selectedCount)}</span>
            </button>
          ) : targetUnit ? (
            <>
              <button
                type="button"
                onClick={() => onApply(val, 'unit')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--color-action-primary-bg, #0284c7)',
                  color: 'var(--color-action-primary-fg, #ffffff)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} />
                <span>{TEXT_PLOTTING.TARGET_MODAL.APPLY_THIS_UNIT}</span>
              </button>

              {endpointName && (
                <button
                  type="button"
                  onClick={() => onApply(val, 'base')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'var(--color-surface-default, rgba(255, 255, 255, 0.06))',
                    color: 'var(--color-text-primary, #f8fafc)',
                    border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.12))',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {TEXT_PLOTTING.TARGET_MODAL.APPLY_ALL_BASE} ({endpointName})
                </button>
              )}

              <button
                type="button"
                onClick={() => onApply(val, 'all')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'var(--color-text-secondary, #94a3b8)',
                  border: '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08))',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {TEXT_PLOTTING.TARGET_MODAL.APPLY_ALL_ROUTE}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onApply(val, 'all')}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--color-action-primary-bg, #0284c7)',
                color: 'var(--color-action-primary-fg, #ffffff)',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Zap size={16} />
              <span>{TEXT_PLOTTING.TARGET_MODAL.APPLY_ALL_ROUTE}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--color-text-muted, #64748b)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '2px',
            }}
          >
            {TEXT_COMMON.BUTTONS.CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
};
