import { useState, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import type { BusData } from '../../services/googleSheets';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';
import { splitShiftKeterangan, cleanShiftNote } from '../../utils/keteranganUtils';
import { TEXT_FLEET_STATUS } from '../../constants/texts';

const isTestEnv =
  import.meta.env?.MODE === 'test' ||
  Boolean((globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT);

export type BrushMode = 'SGO' | 'OFF' | 'TO' | 'BA';

export interface FleetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  renopsTarget: number;
  dayLabel?: string;
  buses: BusData[];
  initialShift?: 1 | 2;
  onNavigateToReport?: () => void;
  onConfirmStatus: (
    shift: 1 | 2,
    statusMap: Map<number, { s1: string; s2: string }>
  ) => Promise<void>;
}

function FleetStatusModalComponent({
  isOpen,
  onClose,
  routeCode,
  selectedDate,
  renopsTarget,
  dayLabel,
  buses,
  initialShift = 1,
  onNavigateToReport,
  onConfirmStatus,
}: FleetStatusModalProps) {
  useMobileBackHandler({
    id: 'fleet_status_modal',
    isOpen,
    onClose,
  });

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const [currentShift, setCurrentShift] = useState<1 | 2>(initialShift);
  const [activeBrush, setActiveBrush] = useState<BrushMode>('SGO');
  const [isSaving, setIsSaving] = useState(false);

  // Status map: rowIndex -> { s1: string, s2: string }
  const [unitMap, setUnitMap] = useState<Map<number, { s1: string; s2: string }>>(new Map());

  // Inisialisasi unitMap dari daftar buses
  useEffect(() => {
    if (!buses || buses.length === 0) return;
    const nextMap = new Map<number, { s1: string; s2: string }>();
    for (const b of buses) {
      const split = splitShiftKeterangan(b.keterangan);
      nextMap.set(b.rowIndex, { s1: split.s1, s2: split.s2 });
    }
    setUnitMap(nextMap);
  }, [buses]);

  // Handle tap pada kartu bus: terapkan activeBrush ke shift yang sedang aktif
  const handleCardTap = (rowIndex: number) => {
    setUnitMap((prev) => {
      const next = new Map(prev);
      const current = next.get(rowIndex) || { s1: '', s2: '' };

      let nextVal = '';
      if (activeBrush === 'OFF') nextVal = 'OFF';
      else if (activeBrush === 'TO') nextVal = 'TO EVDAL';
      else if (activeBrush === 'BA') nextVal = 'BA.02 NP1'; // Default BA chip
      else nextVal = ''; // SGO (kosong)

      if (currentShift === 1) {
        next.set(rowIndex, { ...current, s1: nextVal });
      } else {
        next.set(rowIndex, { ...current, s2: nextVal });
      }
      return next;
    });
  };

  // Quick Action: SGO Semua Unit pada shift aktif
  const handleSgoAll = () => {
    setUnitMap((prev) => {
      const next = new Map(prev);
      for (const [rowIndex, val] of next.entries()) {
        if (currentShift === 1) {
          next.set(rowIndex, { ...val, s1: '' });
        } else {
          next.set(rowIndex, { ...val, s2: '' });
        }
      }
      return next;
    });
  };

  // Perhitungan ringkasan real-time
  const summaryCounts = useMemo(() => {
    let sgo = 0;
    let off = 0;
    let to = 0;
    let ba = 0;

    for (const b of buses) {
      const unitVal = unitMap.get(b.rowIndex);
      const status = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
      const upper = status.toUpperCase();

      if (!upper) {
        sgo++;
      } else if (upper.includes('OFF')) {
        off++;
      } else if (upper.includes('TO')) {
        to++;
      } else {
        ba++;
      }
    }

    return { sgo, off, to, ba };
  }, [buses, unitMap, currentShift]);

  // Submit konfirmasi
  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      await onConfirmStatus(currentShift, unitMap);
      if (onNavigateToReport) {
        onNavigateToReport();
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('[FleetStatusModal] Gagal menyimpan status armada:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div
      className="modal-overlay fleet-status-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: isOpen ? 'flex' : 'none',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 99999,
        touchAction: 'none',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="glass fleet-status-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          height: '92vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: 'var(--bg-card, #171717)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Top Handle Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--text-secondary)',
              opacity: 0.35,
            }}
          />
        </div>

        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.2px',
                }}
              >
                Status Armada: {routeCode}
              </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(62, 207, 142, 0.14)',
                    color: 'var(--accent-color, #3ECF8E)',
                    border: '1px solid rgba(62, 207, 142, 0.3)',
                  }}
                >
                  Target Renops: {renopsTarget} Unit
                </span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                {selectedDate} {dayLabel ? `• ${dayLabel}` : ''}
              </span>
            </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '6px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={TEXT_FLEET_STATUS.MODAL.CLOSE_TITLE}
          >
            <X size={20} />
          </button>
        </div>

        {/* Segmented Control: Status Armada vs Laporan Operasional */}
        {onNavigateToReport && (
          <div
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '4px',
                borderRadius: '12px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              }}
            >
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--bg-secondary, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <span>{TEXT_FLEET_STATUS.MODAL.SEGMENT_FLEET}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={TEXT_FLEET_STATUS.MODAL.REPORT_TITLE}
              >
                <span>{TEXT_FLEET_STATUS.MODAL.SEGMENT_REPORT}</span>
              </button>
            </div>
          </div>
        )}

        {/* Shift Switcher & Brush Toolbar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Shift Toggle Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentShift(1)}
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: 'none',
                background: currentShift === 1 ? 'var(--accent-color, #3ECF8E)' : 'transparent',
                color: currentShift === 1 ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {TEXT_FLEET_STATUS.MODAL.SHIFT_1_TAB}
            </button>
            <button
              type="button"
              onClick={() => setCurrentShift(2)}
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: 'none',
                background: currentShift === 2 ? 'var(--accent-color, #3ECF8E)' : 'transparent',
                color: currentShift === 2 ? '#000' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {TEXT_FLEET_STATUS.MODAL.SHIFT_2_TAB}
            </button>
          </div>

          {/* Mode Pemilih Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {/* Status SGO */}
              <button
                type="button"
                onClick={() => setActiveBrush('SGO')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: activeBrush === 'SGO' ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                  background: activeBrush === 'SGO' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: '#10b981',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {TEXT_FLEET_STATUS.STATUS_CODES.SGO}
              </button>

              {/* Status OFF */}
              <button
                type="button"
                onClick={() => setActiveBrush('OFF')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: activeBrush === 'OFF' ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                  background: activeBrush === 'OFF' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: '#f59e0b',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {TEXT_FLEET_STATUS.STATUS_CODES.OFF}
              </button>

              {/* Status TO */}
              <button
                type="button"
                onClick={() => setActiveBrush('TO')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: activeBrush === 'TO' ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                  background: activeBrush === 'TO' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: '#ef4444',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {TEXT_FLEET_STATUS.STATUS_CODES.TO}
              </button>

              {/* Status BA */}
              <button
                type="button"
                onClick={() => setActiveBrush('BA')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: activeBrush === 'BA' ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                  background: activeBrush === 'BA' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {TEXT_FLEET_STATUS.STATUS_CODES.BA}
              </button>
            </div>

            {/* Quick Button: SGO Semua */}
            <button
              type="button"
              onClick={handleSgoAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success-color, #10b981)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{TEXT_FLEET_STATUS.MODAL.SGO_ALL_BTN}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Bus Cards Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px',
            }}
          >
            {buses.map((bus) => {
              const unitVal = unitMap.get(bus.rowIndex);
              const note = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
              const upper = note.toUpperCase();

              const isSgo = !upper;
              const isOff = upper.includes('OFF');
              const isTo = upper.includes('TO');
              const isBa = !isSgo && !isOff && !isTo;

              let cardBg = 'var(--input-bg, rgba(255, 255, 255, 0.03))';
              let cardBorder = '1px solid var(--border-color, rgba(255, 255, 255, 0.08))';
              let badgeBg = 'rgba(16, 185, 129, 0.12)';
              let badgeColor = '#10b981';
              let badgeText = 'SGO';

              if (isOff) {
                cardBg = 'rgba(245, 158, 11, 0.08)';
                cardBorder = '1px solid rgba(245, 158, 11, 0.35)';
                badgeBg = 'rgba(245, 158, 11, 0.2)';
                badgeColor = '#f59e0b';
                badgeText = 'OFF';
              } else if (isTo) {
                cardBg = 'rgba(239, 68, 68, 0.08)';
                cardBorder = '1px solid rgba(239, 68, 68, 0.35)';
                badgeBg = 'rgba(239, 68, 68, 0.2)';
                badgeColor = '#ef4444';
                badgeText = 'T.O';
              } else if (isBa) {
                cardBg = 'rgba(14, 165, 233, 0.08)';
                cardBorder = '1px solid rgba(14, 165, 233, 0.35)';
                badgeBg = 'rgba(14, 165, 233, 0.2)';
                badgeColor = '#38bdf8';
                badgeText = note.length > 10 ? `${note.slice(0, 10)}...` : note;
              }

              return (
                <div
                  key={bus.rowIndex}
                  onClick={() => handleCardTap(bus.rowIndex)}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '72px',
                    transition: 'all 0.15s ease',
                  }}
                  title={TEXT_FLEET_STATUS.MODAL.APPLY_STATUS_TITLE(activeBrush)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {bus.unit}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: badgeBg,
                        color: badgeColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {isSgo ? TEXT_FLEET_STATUS.MODAL.SGO_FULL_LABEL : note}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Bottom Summary & CTA */}
        <div
          style={{
            padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 14px)) 20px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            backgroundColor: 'var(--bg-card, #171717)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Summary Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#10b981' }}>SGO: {summaryCounts.sgo}</span>
            <span style={{ color: '#f59e0b' }}>OFF: {summaryCounts.off}</span>
            <span style={{ color: '#ef4444' }}>T.O: {summaryCounts.to}</span>
            <span style={{ color: '#38bdf8' }}>BA: {summaryCounts.ba}</span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent-color, #3ECF8E)',
              color: '#000',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(62, 207, 142, 0.35)',
              transition: 'all 0.18s ease',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>{TEXT_FLEET_STATUS.MODAL.SAVING}</span>
              </>
            ) : (
              <span>
                {onNavigateToReport
                  ? TEXT_FLEET_STATUS.MODAL.CONFIRM_CONTINUE_REPORT
                  : TEXT_FLEET_STATUS.MODAL.CONFIRM_APPLY_SHIFT(currentShift)}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isTestEnv || !isOpen) {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}

export const FleetStatusModal = memo(FleetStatusModalComponent);
