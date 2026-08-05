import { memo } from 'react';
import { Bus, ArrowRight, MessageSquare } from 'lucide-react';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
          <Bus size={18} style={{ color: 'var(--accent-color)' }} />
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div>
          Total TOA: <strong style={{ color: 'var(--text-primary)' }}>{item.totalToa.toLocaleString('id-ID')} Pnp</strong>
        </div>
        {item.noteCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning-color, #f59e0b)', fontSize: '12px' }}>
            <MessageSquare size={14} />
            <span>Ada Catatan</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>
        <span>Lihat Detail Ringkasan</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
