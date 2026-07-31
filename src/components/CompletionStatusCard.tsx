import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
  onSelectUnit?: (unit: string) => void;
}

export function CompletionStatusCard({ summary, onSelectUnit }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-pink-400 uppercase tracking-wider">Status Kelengkapan Armada</span>
        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {summary.completionPercentage}% Selesai
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-sky-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-300 pt-1">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {summary.filledBuses} Bus Terisi
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          {summary.unfilledBuses} Belum Lengkap
        </span>
      </div>

      {summary.unfilledUnits.length > 0 && (
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Unit Belum Lengkap (Klik untuk lompat):</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {summary.unfilledUnits.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => onSelectUnit?.(unit)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded-md font-mono transition-colors"
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
