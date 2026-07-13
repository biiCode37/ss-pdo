import { useState, useEffect } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { extractSheetId, getBusData } from '../services/googleSheets';
import { BusList } from './BusList';
import { Loader2, LogOut, Settings, Plus, X, CloudOff, Sun, Moon, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface Props {
  onLogout: () => void;
  onOpenSettings: () => void;
}

interface SavedRoute {
  title: string;
  url: string;
}

export function Dashboard({ onLogout, onOpenSettings }: Props) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedTab, setSelectedTab] = useState(new Date().getDate().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Route Management State
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');
  
  const [busData, setBusData] = useState<BusData[] | null>(null);
  const [headerMap, setHeaderMap] = useState<HeaderMap | null>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string>('');
  const [currentTabName, setCurrentTabName] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
  });

  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { queue, addToQueue } = useOfflineSync();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('PDO_THEME', newTheme);
  };

  useEffect(() => {
    // Load saved routes on mount
    const saved = localStorage.getItem('PDO_SAVED_ROUTES');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedRoutes(parsed);
        // Automatically select the first route if available
        if (parsed.length > 0) {
          setSheetUrl(parsed[0].url);
        } else {
          setIsAddingRoute(true);
        }
      } catch (e) {
        console.error('Failed to parse saved routes');
        setIsAddingRoute(true);
      }
    } else {
      setIsAddingRoute(true);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveNewRoute = () => {
    if (!newRouteTitle.trim() || !sheetUrl.trim()) {
      setError('Judul Rute dan Link harus diisi');
      return;
    }
    
    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError('Link tidak valid. Pastikan link berisi /d/SPREADSHEET_ID');
      return;
    }

    const newRoute = { title: newRouteTitle.trim(), url: sheetUrl.trim() };
    const updatedRoutes = [...savedRoutes, newRoute];
    
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('PDO_SAVED_ROUTES', JSON.stringify(updatedRoutes));
    
    setIsAddingRoute(false);
    setNewRouteTitle('');
    setError(null);
  };

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'ADD_NEW') {
      setIsAddingRoute(true);
      setSheetUrl('');
    } else {
      setIsAddingRoute(false);
      setSheetUrl(value);
    }
  };

  const handleLoadData = async () => {
    if (!sheetUrl) {
      setError('Silakan pilih atau paste link Google Sheet terlebih dahulu');
      return;
    }

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      setError('Link tidak valid. Pastikan Anda meng-copy link dari Google Sheets.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBusData(null);

    try {
      const { data, headerMap } = await getBusData(sheetId, selectedTab);
      setBusData(data);
      setHeaderMap(headerMap);
      setCurrentSheetId(sheetId);
      setCurrentTabName(selectedTab);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data. Periksa kembali link dan tab Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setPullDistance(Math.min(diff, 100)); // cap at 100px
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      handleLoadData().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    setTouchStartY(0);
  };

  // Generate options for days 1-31
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  return (
    <div 
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{
        height: pullDistance > 0 ? `${pullDistance}px` : '0',
        overflow: 'hidden',
        transition: touchStartY === 0 ? 'height 0.3s ease' : 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          transform: `rotate(${pullDistance * 3}deg)`,
          color: 'var(--accent-color)'
        }}>
          <RefreshCw size={24} className={isRefreshing ? 'spinner' : ''} />
        </div>
      </div>
      
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ Koneksi Terputus - Mode Offline Aktif
        </div>
      )}
      <div className="app-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, textAlign: 'left', fontSize: '20px' }}>PDO Mobile</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {queue.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-color)', fontSize: '14px', fontWeight: 'bold', background: 'rgba(234, 179, 8, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
              <CloudOff size={16} />
              {queue.length} Tertunda
            </div>
          )}
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={onOpenSettings} title="Settings">
            <Settings size={20} />
          </button>
          <button className="btn btn-outline" style={{ padding: '8px', color: 'var(--danger-color)' }} onClick={onLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="dashboard-card glass">
        
        {!isAddingRoute && savedRoutes.length > 0 ? (
          <div className="input-group">
            <label>Pilih Rute</label>
            <select 
              className="input-field" 
              value={sheetUrl}
              onChange={handleRouteSelect}
            >
              {savedRoutes.map((route, i) => (
                <option key={i} value={route.url}>{route.title}</option>
              ))}
              <option value="ADD_NEW">+ Tambah Rute Baru</option>
            </select>
          </div>
        ) : (
          <div className="form-grid full" style={{ position: 'relative' }}>
            {savedRoutes.length > 0 && (
              <button 
                onClick={() => { setIsAddingRoute(false); setSheetUrl(savedRoutes[0]?.url || ''); setError(null); }}
                style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            )}
            <div className="input-group">
              <label>Nama Rute (Contoh: JAK.115)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Masukkan nama rute" 
                value={newRouteTitle}
                onChange={(e) => setNewRouteTitle(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Link Google Sheet</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Paste link dari bos di sini..." 
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" onClick={saveNewRoute} style={{ marginBottom: '8px' }}>
              <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Simpan Rute
            </button>
          </div>
        )}

        <div className="input-group" style={{ marginTop: '12px' }}>
          <label>Pilih Tanggal (Tab)</label>
          <select 
            className="input-field" 
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value)}
          >
            {days.map(day => (
              <option key={day} value={day}>Tanggal {day}</option>
            ))}
          </select>
        </div>

        <button className="btn" onClick={handleLoadData} disabled={isLoading || isAddingRoute}>
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Load Data Bus'}
        </button>

        {error && <div className="error-text" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      {isLoading && !busData && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 className="spinner" size={32} style={{ color: 'var(--accent-color)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Membaca file spreadsheet...</p>
        </div>
      )}

      {busData && headerMap && !isLoading && (
        <BusList 
          data={busData} 
          sheetId={currentSheetId} 
          tabName={currentTabName} 
          headerMap={headerMap} 
          syncQueue={queue}
          addToQueue={addToQueue}
        />
      )}
    </div>
  );
}
