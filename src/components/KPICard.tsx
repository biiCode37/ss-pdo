import { Gauge, Users, TrendingUp, Bus } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function KPICard({ summary }: Props) {
  // Format numbers using Indonesian locale
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const formatDec = (val: number, decimals: number) =>
    val.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title" style={{ color: 'var(--accent-color)' }}>
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
            {formatDec(summary.totalKm, 1)} <span style={{ fontSize: '12px', fontWeight: 400 }}>KM</span>
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

      <div className="analytics-sub-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bus size={16} />
          <span>KM/Bus: <b>{formatDec(summary.kmPerBus, 1)} KM</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} />
          <span>Kepadatan: <b>{formatDec(summary.passengersPerKm, 2)} Pnp/KM</b></span>
        </div>
      </div>
    </div>
  );
}
