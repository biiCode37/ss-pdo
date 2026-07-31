import { ClipboardList, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'input' | 'analytics';
  onSelectTab: (tab: 'input' | 'analytics') => void;
  pendingQueueCount?: number;
}

export function BottomNav({ activeTab, onSelectTab, pendingQueueCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex justify-around items-center max-w-md mx-auto sm:max-w-xl">
      <button
        type="button"
        onClick={() => onSelectTab('input')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'input'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <ClipboardList className="w-5 h-5" />
          {pendingQueueCount > 0 && (
            <span className="absolute -top-1 -right-2.5 bg-amber-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {pendingQueueCount}
            </span>
          )}
        </div>
        <span className="text-[11px]">Input Shift</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('analytics')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          activeTab === 'analytics'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[11px]">Dashboard</span>
      </button>
    </nav>
  );
}
