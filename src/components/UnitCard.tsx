import { memo } from 'react';
import { Bus, Navigation, Users, AlertTriangle, ChevronRight } from 'lucide-react';
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
        padding: '12px 14px',
        borderRadius: '14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'transform 0.18s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Line 1: Unit Title + Status + Chevron Arrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
          <Bus size={17} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <span>{item.unit}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '8px',
              backgroundColor: item.isFilled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: item.isFilled ? 'var(--success-color, #22c55e)' : 'var(--danger-color, #ef4444)',
            }}
          >
            {item.isFilled ? 'Operasional' : 'Kosong'}
          </span>
          <ChevronRight size={16} style={{ color: 'var(--text-secondary)', opacity: 0.6 }} />
        </div>
      </div>

      {/* Line 2: Inline Compact Stats Badges (KM & Pnp) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {/* Total KM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <strong style={{ color: '#38bdf8', fontWeight: 800 }}>{item.totalKm.toLocaleString('id-ID')}</strong> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>KM</span>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        {/* Total Pnp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{item.totalPassengers.toLocaleString('id-ID')}</strong> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pnp</span>
        </div>
      </div>

      {/* Line 3: Value Catatan Keterangan (Tanpa Pembungkus) */}
      {item.notes && item.notes.length > 0 && (
        <div
          style={{
            fontSize: '11px',
            color: '#fdba74',
            fontWeight: 600,
            letterSpacing: '0.01em',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <AlertTriangle size={13} style={{ color: '#f97316', flexShrink: 0 }} />
          <span style={{ lineHeight: '1.3', wordBreak: 'break-word', textTransform: 'uppercase' }}>
            {item.notes[0]}
          </span>
        </div>
      )}
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
