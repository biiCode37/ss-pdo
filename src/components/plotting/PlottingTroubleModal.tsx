import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, ShieldAlert, Check } from 'lucide-react';
import { TEXT_PLOTTING, TEXT_COMMON } from '@/constants/texts';
import { isUnitOffOrToEvdal } from '@/utils/keteranganUtils';
import type { PlottingUnitStatus } from '@/types/supabase';

export interface PlottingTroubleModalProps {
  isOpen: boolean;
  unit: string;
  currentStatus: PlottingUnitStatus;
  currentKeterangan?: string;
  currentNote?: string;
  onClose: () => void;
  onApplyTrouble: (unit: string, keterangan: string, note?: string) => void;
  onResetReady: (unit: string) => void;
}

const COMMON_TROUBLE_CODES = [
  { code: 'BA.02', label: 'BA.02 (BAP Gangguan Operasional)' },
  { code: 'NP', label: 'NP (Non Pelayanan)' },
  { code: 'OFF', label: 'OFF (Mati / Bengkel / Perawatan)' },
  { code: 'T.O EVDAL', label: 'T.O EVDAL (Sanksi / Administrasi)' },
];

const parseInitialTroubleState = (
  keterangan: string,
  initialNote: string,
): { codes: string[]; note: string } => {
  const codes: string[] = [];
  if (!keterangan && !initialNote) return { codes: [], note: '' };

  const knownCodes = COMMON_TROUBLE_CODES.map((c) => c.code);
  const ketUpper = (keterangan || '').toUpperCase();

  for (const item of knownCodes) {
    if (ketUpper.includes(item.toUpperCase())) {
      codes.push(item);
    }
  }

  let finalNote = initialNote || '';
  if (!finalNote && keterangan) {
    if (keterangan.includes(' - ')) {
      finalNote = keterangan.split(' - ').slice(1).join(' - ').trim();
    } else if (codes.length === 0) {
      finalNote = keterangan.trim();
    }
  }

  return { codes, note: finalNote };
};

export const PlottingTroubleModal: React.FC<PlottingTroubleModalProps> = ({
  isOpen,
  unit,
  currentStatus,
  currentKeterangan = '',
  currentNote = '',
  onClose,
  onApplyTrouble,
  onResetReady,
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialTroubleState(currentKeterangan, currentNote);
      setSelectedCodes(parsed.codes);
      setNote(parsed.note);
    }
  }, [isOpen, currentKeterangan, currentNote]);

  if (!isOpen) return null;

  const isOffSelected =
    selectedCodes.some((code) => isUnitOffOrToEvdal(code)) ||
    isUnitOffOrToEvdal(note);

  const canSave = selectedCodes.length > 0 || note.trim().length > 0;

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    const codesString = selectedCodes.join(', ');
    let combinedKeterangan = '';
    if (codesString && note.trim()) {
      combinedKeterangan = `${codesString} - ${note.trim()}`;
    } else if (codesString) {
      combinedKeterangan = codesString;
    } else {
      combinedKeterangan = note.trim();
    }
    onApplyTrouble(unit, combinedKeterangan, note.trim() || undefined);
    onClose();
  };

  const handleResetToReady = () => {
    onResetReady(unit);
    onClose();
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
          gap: '14px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--color-warning-fg, #f59e0b)" />
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, #f8fafc)',
                }}
              >
                {TEXT_PLOTTING.TROUBLE_MODAL.TITLE(unit)}
              </h3>
            </div>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary, #94a3b8)',
              }}
            >
              {TEXT_PLOTTING.TROUBLE_MODAL.SUBTITLE}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
            aria-label="Tutup modal kendala"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pilihan Kode Kendala Cepat (Opsional & Multi-Select) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              {TEXT_PLOTTING.TROUBLE_MODAL.PRESET_LABEL}
            </label>
            {selectedCodes.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCodes([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                {TEXT_PLOTTING.TROUBLE_MODAL.RESET_SELECTION}
              </button>
            )}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {COMMON_TROUBLE_CODES.map((item) => {
              const isSelected = selectedCodes.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleToggleCode(item.code)}
                  aria-pressed={isSelected}
                  data-testid={`trouble-code-${item.code}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isSelected
                      ? '1.5px solid var(--color-warning-fg, #f59e0b)'
                      : '1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))',
                    background: isSelected
                      ? 'rgba(245, 158, 11, 0.18)'
                      : 'var(--color-surface-default, rgba(255, 255, 255, 0.04))',
                    color: isSelected
                      ? 'var(--color-warning-fg, #f59e0b)'
                      : 'var(--color-text-primary, #f8fafc)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  <span>{item.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Peringatan Khusus OFF / T.O EVDAL */}
        {isOffSelected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-error-fg, #f87171)',
              fontSize: '0.74rem',
              lineHeight: 1.4,
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{TEXT_PLOTTING.TROUBLE_MODAL.WARNING_OFF}</span>
          </div>
        )}

        {/* Input Catatan Tambahan (Opsional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary, #94a3b8)',
            }}
          >
            {TEXT_PLOTTING.TROUBLE_MODAL.NOTE_LABEL}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={TEXT_PLOTTING.TROUBLE_MODAL.NOTE_PLACEHOLDER}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--color-border-control, rgba(255, 255, 255, 0.14))',
              background: 'var(--color-surface-default, rgba(0, 0, 0, 0.2))',
              color: 'var(--color-text-primary, #f8fafc)',
              fontSize: '0.8rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--color-action-primary-bg, #0284c7)',
              color: 'var(--color-action-primary-fg, #ffffff)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={15} />
            <span>{TEXT_PLOTTING.TROUBLE_MODAL.APPLY_BTN}</span>
          </button>

          {currentStatus !== 'READY' && (
            <button
              type="button"
              onClick={handleResetToReady}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--color-success-fg, #10b981)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} />
              <span>{TEXT_PLOTTING.TROUBLE_MODAL.RESET_READY_BTN}</span>
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
            }}
          >
            {TEXT_COMMON.BUTTONS.CANCEL}
          </button>
        </div>
      </div>
    </div>
  );
};
