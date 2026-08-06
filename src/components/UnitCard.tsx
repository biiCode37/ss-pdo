import { memo } from 'react';
import { Bus, ArrowRight, Navigation, Users, AlertTriangle } from 'lucide-react';
import type { UnitSummaryItem } from '../utils/unitAnalytics';

interface Props {
  item: UnitSummaryItem;
  onClick: () => void;
}

function UnitCardComponent({ item, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bus-card glass"
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.18s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Header: Unit Name & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '17px' }}>
          <Bus size={20} style={{ color: 'var(--accent-color)' }} />
          <span>{item.unit}</span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '10px',
            backgroundColor: item.isFilled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: item.isFilled ? 'var(--success-color, #22c55e)' : 'var(--danger-color, #ef4444)',
          }}
        >
          {item.isFilled ? 'Operasional' : 'Belum Ada Data'}
        </span>
      </div>

      {/* Grid 2 Column: Total KM & Total Pnp */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Total KM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL KM</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', lineHeight: 1.1 }}>
              {item.totalKm.toLocaleString('id-ID')} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>KM</span>
            </div>
          </div>
        </div>

        {/* Total Pnp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL PNP</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {item.totalPassengers.toLocaleString('id-ID')} <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pnp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Catatan Keterangan (Jika Ada) */}
      {item.notes && item.notes.length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(249, 115, 22, 0.08)',
            borderRadius: '10px',
            borderLeft: '3px solid rgba(249, 115, 22, 0.6)',
            fontSize: '12px',
            color: '#fdba74',
            fontWeight: 600,
            letterSpacing: '0.02em',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}
        >
          <AlertTriangle size={15} style={{ color: '#f97316', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ lineHeight: '1.4', wordBreak: 'break-word', textTransform: 'uppercase' }}>
            {item.notes[0]}
          </span>
        </div>
      )}

      {/* Footer Link / Trigger */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600, marginTop: '2px' }}>
        <span>Lihat Detail Ringkasan</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
