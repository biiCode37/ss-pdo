import { useState, useEffect } from 'react';
import { MapPin, Calendar, Plus, X, Loader2, Trash2, ChevronUp } from 'lucide-react';

export interface SavedRoute {
  title: string;
  url: string;
}

interface Props {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  savedRoutes: SavedRoute[];
  days: string[];
  isLoading: boolean;
  isDataLoaded: boolean;
  onLoadData: () => void;
  onSaveNewRoute: (title: string, url: string) => void;
  onDeleteRoute: (index: number) => void;
}

export function RouteSelectorCard({
  sheetUrl,
  setSheetUrl,
  selectedTab,
  setSelectedTab,
  savedRoutes,
  days,
  isLoading,
  isDataLoaded,
  onLoadData,
  onSaveNewRoute,
  onDeleteRoute
}: Props) {
  const [isMorphed, setIsMorphed] = useState(false);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newRouteTitle, setNewRouteTitle] = useState('');

  // Auto morph into compact pill when data successfully loads
  useEffect(() => {
    if (isDataLoaded) {
      setIsMorphed(true);
    }
  }, [isDataLoaded]);

  // Find active route title and ensure month/year is shown
  const activeRouteObj = savedRoutes.find(r => r.url === sheetUrl);
  const rawTitle = activeRouteObj ? activeRouteObj.title : 'Rute Aktif';
  
  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long' }).toUpperCase();
  const currentYear = new Date().getFullYear();
  const hasYear = /\d{4}/.test(rawTitle);
  const displayRouteTitle = hasYear ? rawTitle : `${rawTitle} (${currentMonthName} ${currentYear})`;

  const handleSaveRoute = () => {
    if (!newRouteTitle.trim() || !sheetUrl.trim()) return;
    onSaveNewRoute(newRouteTitle.trim(), sheetUrl.trim());
    setNewRouteTitle('');
    setIsAddingRoute(false);
  };

  return (
    <div
      className={`morph-selector-card ${isMorphed ? 'morphed' : ''}`}
      onClick={isMorphed ? () => setIsMorphed(false) : undefined}
      title={isMorphed ? 'Klik untuk membuka Form Pemilihan' : undefined}
    >
      {/* Morphed Compact Pill View Layer */}
      <div className={`morph-pill-content ${isMorphed ? 'visible' : 'hidden'}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <MapPin size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <b style={{
            fontSize: '13px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {displayRouteTitle}
          </b>
        </div>

        <span className="morph-pill-badge" style={{ flexShrink: 0, marginLeft: '8px' }}>
          <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Tgl {selectedTab}
        </span>
      </div>

      {/* Expanded Form View Layer */}
      <div className={`morph-form-content ${isMorphed ? 'hidden' : 'visible'}`}>
        {/* Header Bar Area — Clickable Header Trigger to Collapse */}
        <div
          onClick={(e) => {
            if (isDataLoaded) {
              e.stopPropagation();
              setIsMorphed(true);
            }
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            marginBottom: '4px',
            borderBottom: '1px solid var(--card-border)',
            cursor: isDataLoaded ? 'pointer' : 'default',
            userSelect: 'none'
          }}
          title={isDataLoaded ? 'Klik header ini untuk menciutkan form' : undefined}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={15} style={{ color: 'var(--accent-color)' }} />
            Pilih Rute & Tanggal
          </span>
          {isDataLoaded && (
            <ChevronUp size={16} style={{ color: 'var(--text-secondary)', opacity: 0.8 }} />
          )}
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ margin: 0 }}>Pilih Rute</label>
            {!isAddingRoute && (
              <button
                type="button"
                onClick={() => setIsAddingRoute(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} /> Tambah Rute
              </button>
            )}
          </div>

          {savedRoutes.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select
                className="input-field"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="" disabled>-- Pilih Rute Tersimpan --</option>
                {savedRoutes.map((route, idx) => (
                  <option key={idx} value={route.url}>
                    {route.title}
                  </option>
                ))}
              </select>
              {activeRouteObj && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '0 12px', color: 'var(--danger-color)' }}
                  onClick={() => {
                    const idx = savedRoutes.findIndex(r => r.url === sheetUrl);
                    if (idx !== -1) onDeleteRoute(idx);
                  }}
                  title="Hapus Rute Ini"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {isAddingRoute && (
            <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Tambah Rute Baru</span>
                <button type="button" onClick={() => setIsAddingRoute(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Nama Rute (misal: JAK.76)..."
                value={newRouteTitle}
                onChange={(e) => setNewRouteTitle(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Link Google Sheets..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <button type="button" className="btn" onClick={handleSaveRoute}>
                Simpan Rute
              </button>
            </div>
          )}
        </div>

        <div className="input-group" style={{ marginBottom: 0 }}>
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

        <button
          type="button"
          className="btn"
          onClick={onLoadData}
          disabled={isLoading || isAddingRoute}
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Load Data Bus'}
        </button>
      </div>
    </div>
  );
}
