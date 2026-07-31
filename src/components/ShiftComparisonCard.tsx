import { Sun, Moon } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function ShiftComparisonCard({ summary }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <span>Rekapitulasi Shift 1 vs Shift 2</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Shift 1 */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-slate-800 pb-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>SHIFT 1</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>TOA:</span>
            <span className="font-semibold">{summary.totalToaShift1.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Manual:</span>
            <span className="font-semibold">{summary.totalManualShift1.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800/60">
            <span>Total:</span>
            <span>{summary.totalShift1.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold border-b border-slate-800 pb-1.5">
            <Moon className="w-3.5 h-3.5" />
            <span>SHIFT 2</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>TOA:</span>
            <span className="font-semibold">{summary.totalToaShift2.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Manual:</span>
            <span className="font-semibold">{summary.totalManualShift2.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800/60">
            <span>Total:</span>
            <span>{summary.totalShift2.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
