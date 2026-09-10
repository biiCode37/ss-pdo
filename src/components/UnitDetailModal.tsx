import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import type { BusData } from '../services/googleSheets';
import { calculateUnitMetrics } from '../utils/unitAnalytics';
import { safeFormatNumber } from '../utils/numberUtils';
import { getFormattedDateBadge } from '../utils/analytics';
import { DailyToaTrendCard } from './DailyToaTrendCard';
import { TEXT_UNIT_DETAIL } from '../constants/texts';

interface Props {
  unit: string;
  busData: BusData[] | null;
  targetTrip?: { pergi: number; pulang: number } | null;
  sheetId: string;
  selectedTab: string;
  activeMonth?: number;
  activeYear?: number;
  accRange?: { startDay?: number; endDay?: number; startMonth?: number; endMonth?: number; startYear?: number; endYear?: number } | null;
  onClose: () => void;
}

export function UnitDetailModal({
  unit,
  busData,
  targetTrip,
  sheetId,
  selectedTab,
  activeMonth,
  activeYear,
  accRange,
  onClose,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

  const dateBadge = useMemo(() => {
    return getFormattedDateBadge(selectedTab, activeMonth, activeYear, accRange);
  }, [selectedTab, activeMonth, activeYear, accRange]);

  const metrics = useMemo(() => {
    return calculateUnitMetrics(busData || [], unit);
  }, [busData, unit]);

  useEffect(() => {
    // Trigger entrance morphing animation after mount
    const frameId = requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismissRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Lock body scrolling when modal is active
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, []);

  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  // BUG-58: Ref agar listener Escape memanggil handleDismiss terbaru
  const handleDismissRef = useRef(handleDismiss);
  handleDismissRef.current = handleDismiss;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isDraggingRef.current = true;
      currentDragYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current || touchStartYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && contentRef.current) {
      currentDragYRef.current = diff;
      contentRef.current.style.transition = 'none';
      contentRef.current.style.transform = `translateY(${diff}px) scale(${Math.max(0.95, 1 - diff / 2000)})`;
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'none';
        const opacity = Math.max(0.2, 0.65 - diff / 500);
        overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = currentDragYRef.current;
    const duration = Date.now() - touchStartTimeRef.current;
    const velocity = duration > 0 ? diff / duration : 0;
    touchStartYRef.current = 0;

    if (diff > 60 || (diff > 25 && velocity > 0.35)) {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(100%) scale(0.95)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.opacity = '0';
      }
      handleDismiss();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(0px) scale(1)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
      }
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay unit-detail-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition: 'opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'opacity, background-color',
      }}
      onClick={handleDismiss}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass unit-detail-modal-content"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(88dvh, 760px)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
          transform: isClosing || !isMounted ? 'translateY(100%) scale(0.95)' : 'translateY(0px) scale(1)',
          transition: 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Top Handle Bar for Touch Swipe */}
        <div className="unit-detail-modal-handle" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {/* ponytail: clean unit title without decorative Bus icon wrapper */}
          <div>
            <h3 className="gradient-title-text" style={{ margin: 0, fontSize: '18px' }}>{unit}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.TITLE}</span>
          </div>
          <button
            onClick={handleDismiss}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Executive Summary: Row 1 (Shift 1 & Shift 2 Side-by-Side) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          {/* Card 1: Shift 1 */}
          <div className="card glass" style={{ padding: '12px', borderRadius: '16px', background: 'var(--shift1-bg)', border: '1px solid var(--shift1-border)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--shift1-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{TEXT_UNIT_DETAIL.SHIFT_1_TITLE}</span>
              {dateBadge && (
                <span style={{ fontSize: '9.5px', padding: '2px 5px', borderRadius: '6px', background: 'var(--shift1-bg)', color: 'var(--shift1-color)', border: '1px solid var(--shift1-border)' }}>
                  {dateBadge}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* ponytail: clean typography without redundant Navigation icon */}
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--shift1-color)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.kmShift1)} <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.KM_UNIT}</span>
              </div>

              {/* ponytail: clean typography without redundant Users icon */}
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.totalShift1Pnp)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.PASSENGER_UNIT}</span>
              </div>

              {metrics.manualShift1 > 0 && (
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '3px 6px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                  {TEXT_UNIT_DETAIL.TOA_LABEL} <strong>{safeFormatNumber(metrics.toaShift1)}</strong> | {TEXT_UNIT_DETAIL.MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift1)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Shift 2 */}
          <div className="card glass" style={{ padding: '12px', borderRadius: '16px', background: 'var(--shift2-bg)', border: '1px solid var(--shift2-border)' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--shift2-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{TEXT_UNIT_DETAIL.SHIFT_2_TITLE}</span>
              {dateBadge && (
                <span style={{ fontSize: '9.5px', padding: '2px 5px', borderRadius: '6px', background: 'var(--shift2-bg)', color: 'var(--shift2-color)', border: '1px solid var(--shift2-border)' }}>
                  {dateBadge}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* ponytail: clean typography without redundant Navigation icon */}
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--shift2-color)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.kmShift2)} <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.KM_UNIT}</span>
              </div>

              {/* ponytail: clean typography without redundant Users icon */}
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.totalShift2Pnp)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.PASSENGER_UNIT}</span>
              </div>

              {metrics.manualShift2 > 0 && (
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '3px 6px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                  {TEXT_UNIT_DETAIL.TOA_LABEL} <strong>{safeFormatNumber(metrics.toaShift2)}</strong> | {TEXT_UNIT_DETAIL.MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift2)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Executive Summary: Row 2 (Akumulasi Total Full Width) */}
        <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'var(--total-bg)', border: '1px solid var(--total-border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--total-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{TEXT_UNIT_DETAIL.TOTAL_TITLE}</span>
            {dateBadge && (
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'var(--total-bg)', color: 'var(--total-color)', border: '1px solid var(--total-border)' }}>
                {dateBadge}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* ponytail: clean typography without redundant Navigation icon */}
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--total-color)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.totalKm)} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.KM_TOTAL_UNIT}</span>
              </div>
            </div>

            {/* ponytail: clean typography without redundant Users icon */}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--total-color)', lineHeight: 1.1 }}>
                {safeFormatNumber(metrics.totalPassengers)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.PASSENGER_TOTAL_UNIT}</span>
              </div>
            </div>

            {Boolean(metrics.tripPergi || metrics.tripPulang) && (
              /* ponytail: clean typography without redundant Repeat icon */
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {metrics.tripPergi || '0'}/{metrics.tripPulang || '0'}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{TEXT_UNIT_DETAIL.RITASE_UNIT}</span>
                  {targetTrip && targetTrip.pergi > 0 && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor:
                          parseInt(metrics.tripPergi || '0', 10) >= targetTrip.pergi &&
                          parseInt(metrics.tripPulang || '0', 10) >= targetTrip.pulang
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          parseInt(metrics.tripPergi || '0', 10) >= targetTrip.pergi &&
                          parseInt(metrics.tripPulang || '0', 10) >= targetTrip.pulang
                            ? '#10b981'
                            : 'var(--warning-text, #f59e0b)',
                        border: `1px solid ${
                          parseInt(metrics.tripPergi || '0', 10) >= targetTrip.pergi &&
                          parseInt(metrics.tripPulang || '0', 10) >= targetTrip.pulang
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)'
                        }`,
                      }}
                    >
                      {parseInt(metrics.tripPergi || '0', 10) >= targetTrip.pergi &&
                      parseInt(metrics.tripPulang || '0', 10) >= targetTrip.pulang
                        ? TEXT_UNIT_DETAIL.TARGET_ACHIEVED
                        : TEXT_UNIT_DETAIL.TARGET_DEFICIT(targetTrip.pergi, targetTrip.pulang)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {(metrics.manualShift1 + metrics.manualShift2) > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                {TEXT_UNIT_DETAIL.TOTAL_TOA_LABEL} <strong>{safeFormatNumber(metrics.totalToa)}</strong> | {TEXT_UNIT_DETAIL.TOTAL_MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift1 + metrics.manualShift2)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Chart Tren Harian Per Unit */}
        <div style={{ marginBottom: '20px' }}>
          <DailyToaTrendCard
            sheetId={sheetId}
            selectedTab={selectedTab}
            unitFilter={unit}
          />
        </div>

        {/* Riwayat Catatan */}
        <div className="card glass" style={{ padding: '16px', marginBottom: '16px', borderRadius: '16px' }}>
          {/* ponytail: clean title without decorative MessageSquare icon */}
          <div className="analytics-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
            <span>{TEXT_UNIT_DETAIL.NOTES_SECTION_TITLE}</span>
          </div>
          {metrics.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {metrics.notes.map((n, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--warning-text)', fontWeight: 600, letterSpacing: '0.02em', background: 'var(--warning-badge-bg)', padding: '8px 12px', borderRadius: '10px', borderLeft: '3px solid var(--orange-color)' }}>
                  <AlertTriangle size={15} style={{ color: 'var(--orange-color)', flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ lineHeight: 1.4, wordBreak: 'break-word', textTransform: 'uppercase' }}>{n}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {TEXT_UNIT_DETAIL.NO_NOTES}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
