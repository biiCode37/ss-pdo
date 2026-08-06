import { Gauge, Users, UserCheck, Bus } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function KPICard({ summary }: Props) {
  // Format numbers using Indonesian locale without rounding away decimals
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const formatRaw = (val: number) =>
    val.toLocaleString('id-ID', { maximumFractionDigits: 10 });

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title">
        <Gauge size={18} />
        <span>Produktivitas & KM Armada</span>
      </div>

      <div className="analytics-grid-2">
        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Gauge size={14} style={{ color: 'var(--success-color)' }} />
            <span>TOTAL KM</span>
          </div>
          <div className="analytics-stat-value" style={{ color: 'var(--success-color)' }}>
            {formatRaw(summary.totalKm)} <span style={{ fontSize: '12px', fontWeight: 400 }}>KM</span>
          </div>
        </div>

        <div className="analytics-stat-box">
          <div className="analytics-stat-label">
            <Users size={14} style={{ color: 'var(--accent-color)' }} />
            <span>PELANGGAN (TOA)</span>
          </div>
          <div className="analytics-stat-value" style={{ color: 'var(--accent-color)' }}>
            {formatInt(summary.totalPassengers)}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1px solid var(--card-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <Bus size={16} style={{ color: 'var(--accent-color)' }} />
            <span>KM/Bus:</span>
          </span>
          <b style={{ color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right' }}>
            {formatRaw(summary.kmPerBus)} KM
          </b>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <UserCheck size={16} style={{ color: 'var(--success-color)' }} />
            <span>Pnp/Km:</span>
          </span>
          <b style={{ color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right' }}>
            {formatRaw(summary.passengersPerKm)}
          </b>
        </div>
      </div>
    </div>
  );
}
