import { Gauge, Users, TrendingUp, Bus } from 'lucide-react';
import type { AnalyticsSummary } from '../utils/analytics';

interface Props {
  summary: AnalyticsSummary;
}

export function KPICard({ summary }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
        <Gauge className="w-4 h-4" />
        <span>Produktivitas & KM Armada</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            TOTAL KM
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {summary.totalKm.toLocaleString('id-ID')} <span className="text-xs font-normal">KM</span>
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
          <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-sky-400" />
            PELANGGAN (TOA)
          </div>
          <div className="text-xl font-black text-sky-400 mt-1">
            {summary.totalPassengers.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50 flex justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1">
          <Bus className="w-3.5 h-3.5 text-slate-400" />
          <span>KM/Bus: <b>{summary.kmPerBus} KM</b></span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span>Pelanggan/KM: <b>{summary.passengersPerKm}</b></span>
        </div>
      </div>
    </div>
  );
}
