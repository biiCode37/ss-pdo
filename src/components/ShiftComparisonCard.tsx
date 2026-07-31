import { Sun, Moon, AlertTriangle } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function ShiftComparisonCard({ summary }: Props) {
  const formatInt = (val: number) => val.toLocaleString('id-ID');
  const hasManualTickets = summary.grandTotalManual > 0;

  return (
    <div className="analytics-card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="analytics-card-title" style={{ color: 'var(--warning-color)' }}>
          <Sun size={18} />
          <span>Rekapitulasi Shift 1 vs Shift 2</span>
        </div>
        {hasManualTickets && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--warning-color)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '2px 8px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={12} /> {formatInt(summary.grandTotalManual)} Tiket Manual
          </span>
        )}
      </div>

      <div className="analytics-grid-2">
        {/* Shift 1 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: 'var(--warning-color)' }}>
            <Sun size={16} />
            <span>SHIFT 1</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift1)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b style={{ color: summary.totalManualShift1 > 0 ? 'var(--warning-color)' : 'inherit' }}>
              {formatInt(summary.totalManualShift1)}
            </b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{formatInt(summary.totalShift1)}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="shift-box">
          <div className="shift-header" style={{ color: '#a78bfa' }}>
            <Moon size={16} />
            <span>SHIFT 2</span>
          </div>
          <div className="shift-row">
            <span>TOA:</span>
            <b>{formatInt(summary.totalToaShift2)}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b style={{ color: summary.totalManualShift2 > 0 ? 'var(--warning-color)' : 'inherit' }}>
              {formatInt(summary.totalManualShift2)}
            </b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{formatInt(summary.totalShift2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
