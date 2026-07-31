import { Sun, Moon } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function ShiftComparisonCard({ summary }: Props) {
  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title" style={{ color: 'var(--warning-color)' }}>
        <Sun size={18} />
        <span>Rekapitulasi Shift 1 vs Shift 2</span>
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
            <b>{summary.totalToaShift1.toLocaleString('id-ID')}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b>{summary.totalManualShift1.toLocaleString('id-ID')}</b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{summary.totalShift1.toLocaleString('id-ID')}</span>
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
            <b>{summary.totalToaShift2.toLocaleString('id-ID')}</b>
          </div>
          <div className="shift-row">
            <span>Manual:</span>
            <b>{summary.totalManualShift2.toLocaleString('id-ID')}</b>
          </div>
          <div className="shift-total">
            <span>Total:</span>
            <span>{summary.totalShift2.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
