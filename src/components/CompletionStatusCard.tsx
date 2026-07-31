import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
}

export function CompletionStatusCard({ summary, onSelectUnit }: Props) {
  return (
    <div className="analytics-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="analytics-card-title" style={{ color: '#ec4899' }}>
          <CheckCircle2 size={18} />
          <span>Status Kelengkapan Armada</span>
        </div>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: 'var(--success-color)', 
          background: 'rgba(16, 185, 129, 0.12)', 
          padding: '2px 8px', 
          borderRadius: '999px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          {summary.completionPercentage}% Selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontWeight: 600 }}>
          <CheckCircle2 size={16} />
          {summary.filledBuses} Bus Terisi
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color)', fontWeight: 600 }}>
          <AlertCircle size={16} />
          {summary.unfilledBuses} Belum Lengkap
        </span>
      </div>

      {summary.unfilledUnits.length > 0 && (
        <div className="analytics-stat-box" style={{ textAlign: 'left', marginTop: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>
            Unit Belum Lengkap (Klik untuk lompat):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
            {summary.unfilledUnits.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => onSelectUnit?.(unit)}
                className="unfilled-tag"
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
