import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bus, Navigation, MessageSquare, Users, AlertTriangle } from 'lucide-react';
import type { BusData } from '../services/googleSheets';
import { calculateUnitMetrics } from '../utils/unitAnalytics';
import { safeFormatNumber } from '../utils/numberUtils';
import { DailyToaTrendCard } from './DailyToaTrendCard';

interface Props {
  unit: string;
  busData: BusData[] | null;
  sheetId: string;
  selectedTab: string;
  onClose: () => void;
}

export function UnitDetailModal({ unit, busData, sheetId, selectedTab, onClose }: Props) {
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => {
    return calculateUnitMetrics(busData || [], unit);
  }, [busData, unit]);

  useEffect(() => {
    // Trigger entrance morphing animation after mount
    requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Lock body scrolling when modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      setTouchStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging || touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dragY > 90) {
      handleDismiss();
    } else {
      setDragY(0);
    }
    setTouchStartY(0);
    setIsDragging(false);
  };

  const opacityValue = isClosing
    ? 0
    : isMounted
    ? Math.max(0.15, 0.65 - dragY / 400)
    : 0;

  const modalTransform = isClosing
    ? 'translateY(100%) scale(0.95)'
    : !isMounted
    ? 'translateY(100%) scale(0.95)'
    : `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1500)})`;

  return createPortal(
    <div
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
        backgroundColor: `rgba(0, 0, 0, ${opacityValue})`,
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
          maxHeight: '88vh',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
          transform: modalTransform,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Top Handle Bar for Touch Swipe */}
        <div className="unit-detail-modal-handle" style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-color)' }}>
              <Bus size={22} />
            </div>
            <div>
              <h3 className="gradient-title-text" style={{ margin: 0, fontSize: '18px' }}>{unit}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ringkasan Rekapitulasi Armada</span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Grid Executive Summary (Shift 1, Shift 2, Akumulasi Total) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {/* Grid 1: Shift 1 */}
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'var(--shift1-bg)', border: '1px solid var(--shift1-border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--shift1-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Shift 1</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'var(--shift1-bg)', color: 'var(--shift1-color)', border: '1px solid var(--shift1-border)' }}>Operasional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--shift1-color)' }}>
                  <Navigation size={18} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--shift1-color)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.kmShift1)} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--shift1-color)' }}>
                  <Users size={18} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.totalShift1Pnp)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah (Hanya Tampil Jika Penjualan Manual > 0) */}
              {metrics.manualShift1 > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                  TOA: <strong>{safeFormatNumber(metrics.toaShift1)}</strong> | Manual: <strong>{safeFormatNumber(metrics.manualShift1)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Grid 2: Shift 2 */}
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'var(--shift2-bg)', border: '1px solid var(--shift2-border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--shift2-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Shift 2</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'var(--shift2-bg)', color: 'var(--shift2-color)', border: '1px solid var(--shift2-border)' }}>Operasional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--shift2-color)' }}>
                  <Navigation size={18} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--shift2-color)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.kmShift2)} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--shift2-color)' }}>
                  <Users size={18} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.totalShift2Pnp)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah (Hanya Tampil Jika Penjualan Manual > 0) */}
              {metrics.manualShift2 > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                  TOA: <strong>{safeFormatNumber(metrics.toaShift2)}</strong> | Manual: <strong>{safeFormatNumber(metrics.manualShift2)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Grid 3: Total Akumulasi (Shift 1 + 2) */}
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'var(--total-bg)', border: '1px solid var(--total-border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--total-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Akumulasi Total</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'var(--total-bg)', color: 'var(--total-color)', border: '1px solid var(--total-border)' }}>Shift 1 + 2</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--total-color)' }}>
                  <Navigation size={20} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--total-color)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.totalKm)} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM Total</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--total-color)' }}>
                  <Users size={20} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--total-color)', lineHeight: 1.1 }}>
                  {safeFormatNumber(metrics.totalPassengers)} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp Total</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah (Hanya Tampil Jika Penjualan Manual > 0) */}
              {(metrics.manualShift1 + metrics.manualShift2) > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px', border: '1px solid var(--card-border)' }}>
                  Total TOA: <strong>{safeFormatNumber(metrics.totalToa)}</strong> | Manual: <strong>{safeFormatNumber(metrics.manualShift1 + metrics.manualShift2)}</strong>
                </div>
              )}
            </div>
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
          <div className="analytics-card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
            <MessageSquare size={18} />
            <span>Catatan & Keterangan Operasional</span>
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
              Tidak ada catatan khusus yang dilaporkan untuk unit ini.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
