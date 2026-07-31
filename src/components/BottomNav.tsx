import { ClipboardList, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'input' | 'analytics';
  onSelectTab: (tab: 'input' | 'analytics') => void;
  pendingQueueCount?: number;
}

export function BottomNav({ activeTab, onSelectTab, pendingQueueCount = 0 }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        onClick={() => onSelectTab('input')}
        className={`bottom-nav-item ${activeTab === 'input' ? 'active' : ''}`}
      >
        <div style={{ position: 'relative' }}>
          <ClipboardList size={20} />
          {pendingQueueCount > 0 && (
            <span className="bottom-nav-badge">
              {pendingQueueCount}
            </span>
          )}
        </div>
        <span>Input Shift</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('analytics')}
        className={`bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
      >
        <BarChart3 size={20} />
        <span>Dashboard</span>
      </button>
    </nav>
  );
}
