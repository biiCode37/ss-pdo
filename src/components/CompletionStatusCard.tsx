import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';
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
          {summary.unfilledBuses} Belum Terisi
        </span>
      </div>

      {summary.busesWithNotes.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} style={{ color: 'var(--accent-color)' }} />
            <span>Keterangan Bus ({summary.busesWithNotes.length}):</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
            {summary.busesWithNotes.map((note, idx) => (
              <div
                key={idx}
                onClick={() => onSelectUnit?.(note.unit)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Klik untuk lompat ke unit bus ini"
              >
                <b style={{ color: 'var(--accent-color)' }}>{note.unit}</b>
                <span style={{ color: 'var(--warning-color)', fontWeight: 600, marginLeft: '8px', textAlign: 'right' }}>
                  {note.keterangan}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
