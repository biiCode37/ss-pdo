import { useState, useMemo } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { BusCard } from './BusCard';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import '@aejkatappaja/phantom-ui';

import type { SyncItem } from '../hooks/useOfflineSync';

interface Props {
  data: BusData[];
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  syncQueue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, 'id' | 'status'>) => void;
  isLoading?: boolean;
  onUpdateBus?: (rowIndex: number, updates: Partial<BusData>) => void;
}

export function BusList({ data, sheetId, tabName, headerMap, syncQueue, addToQueue, isLoading = false, onUpdateBus }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'Semua Kolom' },
    { id: 'toaShift1', label: 'TOA S1' },
    { id: 'totalToa', label: 'Total TOA' },
    { id: 'kmAwal1', label: 'KM Awal S1' },
    { id: 'kmAkhir1', label: 'KM Akhir S1' },
    { id: 'kmAwal2', label: 'KM Awal S2' },
    { id: 'kmAkhir2', label: 'KM Akhir S2' },
  ];

  // Logic selesai bergantung pada kategori yang aktif
  const isBusFilled = (bus: BusData) => {
    const hasValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';
    if (activeCategory === 'ALL') {
      return !!(
        hasValue(bus.toaShift1) && 
        hasValue(bus.totalToa) && 
        hasValue(bus.kmAwal1) && 
        hasValue(bus.kmAkhir1) && 
        hasValue(bus.kmAwal2) && 
        hasValue(bus.kmAkhir2)
      );
    } else {
      return hasValue(bus[activeCategory as keyof BusData]);
    }
  };

  const filledCount = data.filter(isBusFilled).length;
  const totalCount = data.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100);

  const filteredData = useMemo(() => {
    let result = data;
    
    if (showOnlyUnfinished) {
      result = result.filter(bus => !isBusFilled(bus));
    }

    // Sort: Unfinished at the top
    result = [...result].sort((a, b) => {
      const aFilled = isBusFilled(a);
      const bFilled = isBusFilled(b);
      if (aFilled === bFilled) return 0;
      return aFilled ? 1 : -1; // false (0) comes before true (1)
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(bus => bus.unit.toLowerCase().includes(lowerQuery));
    }
    
    return result;
  }, [data, searchQuery, showOnlyUnfinished, activeCategory]);

  return (
    <div>
      <div className="progress-section glass" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>
            {activeCategory === 'ALL' 
              ? 'Progres Harian' 
              : `Progres Kolom: ${categories.find(c => c.id === activeCategory)?.label || activeCategory}`}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span style={{ color: filledCount === totalCount ? 'var(--success-color)' : 'var(--text-primary)', fontWeight: 'bold' }}>{filledCount}</span> / {totalCount} Bus
          </div>
        </div>
        <div className="progress-bar-bg" style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div className="progress-bar-fill" style={{ height: '100%', background: 'var(--accent-color)', width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      <div className="category-scroll-container" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="search-container" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Cari No Body Bus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className={`btn ${showOnlyUnfinished ? '' : 'btn-outline'}`} 
          style={{ width: 'auto', padding: '0 16px', display: 'flex', gap: '8px', alignItems: 'center' }}
          onClick={() => setShowOnlyUnfinished(!showOnlyUnfinished)}
        >
          {showOnlyUnfinished ? <CheckCircle2 size={18} /> : <Filter size={18} />}
          {showOnlyUnfinished ? 'Sisa Bus' : 'Filter'}
        </button>
      </div>

      <phantom-ui loading={isLoading}>
        <div className="bus-list">
          {filteredData.length > 0 ? (
            filteredData.map((bus) => (
              <BusCard 
                key={bus.rowIndex} 
                bus={bus} 
                sheetId={sheetId} 
                tabName={tabName} 
                headerMap={headerMap} 
                isQueued={syncQueue.some(q => q.rowIndex === bus.rowIndex && q.sheetId === sheetId && q.tabName === tabName)}
                addToQueue={addToQueue}
                activeCategory={activeCategory}
                onUpdateBus={onUpdateBus ? (updates) => onUpdateBus(bus.rowIndex, updates) : undefined}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>Tidak ada bus yang ditemukan dengan nomor "{searchQuery}"</p>
            </div>
          )}
        </div>
      </phantom-ui>
    </div>
  );
}
