import { ClipboardList, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'input' | 'analytics';
  onSelectTab: (tab: 'input' | 'analytics') => void;
  pendingQueueCount?: number;
}

export function BottomNav({ activeTab, onSelectTab, pendingQueueCount = 0 }: BottomNavProps) {
  const handleTabClick = (tab: 'input' | 'analytics') => {
    if (activeTab !== tab) {
      onSelectTab(tab);
    }
  };

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav" aria-label="Navigasi Utama">
        {/* Apple iOS Style Sliding Active Indicator Pill */}
        <div 
          className={`bottom-nav-indicator ${activeTab === 'input' ? 'pos-input' : 'pos-analytics'}`} 
          aria-hidden="true"
        />

        <button
          type="button"
          onPointerDown={() => handleTabClick('input')}
          onClick={() => handleTabClick('input')}
          className={`bottom-nav-item ${activeTab === 'input' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <ClipboardList size={18} />
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
          onPointerDown={() => handleTabClick('analytics')}
          onClick={() => handleTabClick('analytics')}
          className={`bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <BarChart3 size={18} />
          </div>
          <span>Dashboard</span>
        </button>
      </nav>
    </div>
  );
}
