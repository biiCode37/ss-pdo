import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bus, TrendingUp, Navigation, MessageSquare } from 'lucide-react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => {
    return calculateUnitMetrics(busData || [], unit);
  }, [busData, unit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Lock body scrolling when modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

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
      onClose();
    } else {
      setDragY(0);
    }
    setTouchStartY(0);
    setIsDragging(false);
  };

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
        backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, 0.65 - dragY / 400)})`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onClick={onClose}
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
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
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
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 4 KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> TOA Shift 1
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.toaShift1.toLocaleString('id-ID')} Pnp</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} /> TOA Shift 2
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.toaShift2.toLocaleString('id-ID')} Pnp</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} /> KM Shift 1
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.kmShift1.toLocaleString('id-ID')} KM</div>
          </div>
          <div className="card glass" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={12} /> KM Shift 2
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{metrics.kmShift2.toLocaleString('id-ID')} KM</div>
          </div>
        </div>

        {/* Chart Tren Harian */}
        <div style={{ marginBottom: '20px' }}>
          <DailyToaTrendCard
            sheetId={sheetId}
            selectedTab={selectedTab}
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
