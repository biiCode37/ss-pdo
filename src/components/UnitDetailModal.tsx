import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bus, Navigation, MessageSquare, Users } from 'lucide-react';
import type { BusData } from '../services/googleSheets';
import { calculateUnitMetrics } from '../utils/unitAnalytics';
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
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          height: '90vh',
          backgroundColor: 'var(--surface-color, #1e293b)',
          color: 'var(--text-primary, #f8fafc)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
          transform: modalTransform,
          transformOrigin: 'bottom center',
          transition: isDragging
            ? 'none'
            : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        {/* Swipe Handle Bar */}
        <div style={{ width: '100%', padding: '4px 0 12px 0', display: 'flex', justifyContent: 'center', cursor: 'grab' }}>
          <div style={{ width: '44px', height: '5px', backgroundColor: 'var(--text-secondary, #94a3b8)', opacity: 0.5, borderRadius: '3px' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-color)' }}>
              <Bus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{unit}</h3>
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
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Shift 1</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)' }}>Operasional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#38bdf8' }}>
                  <Navigation size={18} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', lineHeight: 1.1 }}>
                  {metrics.kmShift1.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-color)' }}>
                  <Users size={18} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {metrics.totalShift1Pnp.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px' }}>
                TOA: <strong>{metrics.toaShift1.toLocaleString('id-ID')}</strong> | Manual: <strong>{metrics.manualShift1.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

          {/* Grid 2: Shift 2 */}
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Shift 2</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)' }}>Operasional</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#c084fc' }}>
                  <Navigation size={18} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#c084fc', lineHeight: 1.1 }}>
                  {metrics.kmShift2.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#c084fc' }}>
                  <Users size={18} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {metrics.totalShift2Pnp.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px' }}>
                TOA: <strong>{metrics.toaShift2.toLocaleString('id-ID')}</strong> | Manual: <strong>{metrics.manualShift2.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

          {/* Grid 3: Total Akumulasi (Shift 1 + 2) */}
          <div className="card glass" style={{ padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Akumulasi Total</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>Shift 1 + 2</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. KM Paling Atas (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#4ade80' }}>
                  <Navigation size={20} />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#4ade80', lineHeight: 1.1 }}>
                  {metrics.totalKm.toLocaleString('id-ID')} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>KM Total</span>
                </div>
              </div>

              {/* 2. Jumlah Pnp di bawah KM (Menonjol & Simetris) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#4ade80' }}>
                  <Users size={20} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80', lineHeight: 1.1 }}>
                  {metrics.totalPassengers.toLocaleString('id-ID')} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp Total</span>
                </div>
              </div>

              {/* 3. Detail TOA & Manual Paling Bawah */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '6px', marginTop: '2px' }}>
                Total TOA: <strong>{metrics.totalToa.toLocaleString('id-ID')}</strong> | Manual: <strong>{(metrics.manualShift1 + metrics.manualShift2).toLocaleString('id-ID')}</strong>
              </div>
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
        <div className="card glass" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color, #f59e0b)' }}>
            <MessageSquare size={16} /> Catatan & Keterangan Operasional
          </div>
          {metrics.notes.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {metrics.notes.map((n, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{n}</li>
              ))}
            </ul>
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
