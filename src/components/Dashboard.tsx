import { useState, useEffect } from 'react';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { extractSheetId, getBusData } from '../services/googleSheets';
import { BusList } from './BusList';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BottomNav } from './BottomNav';
import { Loader2, LogOut, Plus, X, CloudOff, Sun, Moon, RefreshCw, AlertTriangle, RotateCw, Trash2 } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface Props {
  onLogout: () => void;
}

interface SavedRoute {
  title: string;
  url: string;
}

export function Dashboard({ onLogout }: Props) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedTab, setSelectedTab] = useState(new Date().getDate().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'input' | 'analytics'>('input');
  
  // Route Management State
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');
  
  const [busData, setBusData] = useState<BusData[] | null>(null);
  const [headerMap, setHeaderMap] = useState<HeaderMap | null>(null);
  const [currentSheetId, setCurrentSheetId] = useState<string>('');
  const [currentTabName, setCurrentTabName] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
  });

  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const { queue, addToQueue, processQueue, retryItem, removeItem, resolveConflict, forceConflictItem } = useOfflineSync({
    onSyncSuccess: (rowIndex, _sheetId, _tabName, updates) => {
      // BUG-06: Update busData saat sinkronisasi antrean berhasil
      // Ini mencegah false positive "Tabrakan Data" pada edit berikutnya
      handleUpdateBus(rowIndex, updates);
    },
  });

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
    // BUG-13: Cek rute duplikat berdasarkan Sheet ID
    if (savedRoutes.some(r => extractSheetId(r.url) === sheetId)) {
      setError('Rute dengan Sheet ID yang sama sudah tersimpan.');
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

  const handleLoadData = async (isRefresh = false) => {
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
    if (!isRefresh) {
      setBusData(null);
    }

    try {
      const { data, headerMap, missingColumns: missing } = await getBusData(sheetId, selectedTab);
      setBusData(data);
      setHeaderMap(headerMap);
      setCurrentSheetId(sheetId);
      setCurrentTabName(selectedTab);
      setMissingColumns(missing);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data. Periksa kembali link dan tab Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBus = (rowIndex: number, updates: Partial<BusData>) => {
    setBusData(prevData => {
      if (!prevData) return prevData;
      return prevData.map(bus => 
        bus.rowIndex === rowIndex ? { ...bus, ...updates } : bus
      );
    });
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
      // BUG-14: Cek status online sebelum refresh
      if (!isOnline) {
        setError('Tidak bisa refresh saat offline');
        setPullDistance(0);
        setTouchStartY(0);
        return;
      }
      setIsRefreshing(true);
      handleLoadData(true).finally(() => {
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
            <div 
              onClick={() => setIsQueueModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: queue.some(q => q.status === 'failed' || q.status === 'conflict') ? 'var(--danger-color)' : 'var(--warning-color)', fontSize: '14px', fontWeight: 'bold', background: queue.some(q => q.status === 'failed' || q.status === 'conflict') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', padding: '4px 8px', borderRadius: '12px', cursor: 'pointer' }}
            >
              {queue.some(q => q.status === 'failed' || q.status === 'conflict') ? <AlertTriangle size={16} /> : <CloudOff size={16} />}
              {queue.length} Tertunda
            </div>
          )}
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
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

        <button className="btn" onClick={() => handleLoadData(false)} disabled={isLoading || isAddingRoute}>
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Load Data Bus'}
        </button>

        {error && <div className="error-text" style={{ marginTop: 16 }}>{error}</div>}

        {missingColumns.length > 0 && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--warning-color)',
          }}>
            ⚠️ Kolom berikut <strong>tidak terdeteksi</strong> di header sheet dan <strong>TIDAK akan tersimpan</strong>: {missingColumns.join(', ')}. Hubungi admin untuk memperbaiki header.
          </div>
        )}
      </div>

      {isLoading && !busData && (
        <div className="bus-list" style={{ marginTop: '16px' }}>
          <phantom-ui loading={true}>
            <div className="dashboard-card glass" style={{ height: '120px', marginBottom: '16px' }}></div>
            <div className="dashboard-card glass" style={{ height: '120px', marginBottom: '16px' }}></div>
            <div className="dashboard-card glass" style={{ height: '120px', marginBottom: '16px' }}></div>
          </phantom-ui>
        </div>
      )}

      {busData && headerMap && (
        mainTab === 'input' ? (
          <BusList 
            isLoading={isLoading}
            data={busData} 
            sheetId={currentSheetId} 
            tabName={currentTabName} 
            headerMap={headerMap} 
            syncQueue={queue}
            addToQueue={addToQueue}
            onUpdateBus={handleUpdateBus}
          />
        ) : (
          <AnalyticsDashboard
            busData={busData}
            onSelectUnit={(unit) => {
              setMainTab('input');
              setTimeout(() => {
                const el = document.getElementById(`bus-card-${unit}`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
          />
        )
      )}

      <BottomNav
        activeTab={mainTab}
        onSelectTab={setMainTab}
        pendingQueueCount={queue.filter(q => q.status === 'pending' || q.status === 'failed').length}
      />

      {isQueueModalOpen && (
        <div 
          onClick={() => setIsQueueModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px', backdropFilter: 'blur(4px)' }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '420px', maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}
          >
            <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '16px' }}>Antrean Sinkronisasi</h2>
            {queue.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Tidak ada antrean.</p>
            ) : (
              queue.map(item => (
                <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                    <strong>Tab {item.tabName}</strong> — Baris {item.rowIndex}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: item.status === 'pending' ? 'var(--warning-color)' : item.status === 'conflict' ? 'var(--accent-color)' : 'var(--danger-color)' }}>
                    {item.status === 'pending' && `⏳ Menunggu (percobaan ke-${(item.retryCount || 0) + 1})`}
                    {item.status === 'failed' && `❌ Gagal setelah ${item.retryCount} percobaan`}
                    {item.status === 'conflict' && '⚠️ Tabrakan data — data server telah berubah'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status === 'failed' && (
                      <>
                        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => { retryItem(item.id); }}>
                          <RotateCw size={14} /> Coba Lagi
                        </button>
                        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => removeItem(item.id)}>
                          <Trash2 size={14} /> Hapus
                        </button>
                      </>
                    )}
                    {item.status === 'conflict' && (
                      <>
                        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => resolveConflict(item.id)}>
                          Gunakan Data Server
                        </button>
                        <button className="btn" style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => forceConflictItem(item.id)}>
                          Force Save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {queue.some(q => q.status === 'pending') && (
                <button className="btn" style={{ flex: 1 }} onClick={() => { processQueue(); setIsQueueModalOpen(false); }}>
                  Sinkronkan Sekarang
                </button>
              )}
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsQueueModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
