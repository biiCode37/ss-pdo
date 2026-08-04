import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Plus, X, Loader2, Trash2, ChevronUp } from 'lucide-react';
import { fetchRoutesWithSheets, createRouteWithSheet, deleteRouteSheet } from '../services/routeService';
import { extractSheetId } from '../services/googleSheets';
import type { Route, RouteSheet } from '../types/supabase';

const MONTH_NAMES_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface Props {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  days: string[];
  isLoading: boolean;
  isDataLoaded: boolean;
  currentSheetId?: string;
  currentTabName?: string;
  onLoadData: () => void;
}

/** Flatten supabase routes ke daftar sheet dengan route info */
interface FlatRouteSheet {
  routeId: number;
  routeCode: string;
  routeName: string;
  sheet: RouteSheet;
}

function flattenRoutes(routes: Route[]): FlatRouteSheet[] {
  const result: FlatRouteSheet[] = [];
  for (const r of routes) {
    for (const s of r.route_sheets || []) {
      result.push({
        routeId: r.id,
        routeCode: r.route_code,
        routeName: r.route_name,
        sheet: s,
      });
    }
  }
  return result;
}

export function RouteSelectorCard({
  sheetUrl,
  setSheetUrl,
  selectedTab,
  setSelectedTab,
  days,
  isLoading,
  isDataLoaded,
  currentSheetId,
  currentTabName,
  onLoadData,
}: Props) {
  const [isMorphed, setIsMorphed] = useState(false);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [newRouteCode, setNewRouteCode] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  const prevLoadingRef = useRef(isLoading);
  const [routes, setRoutes] = useState<Route[]>([]);
  const flatSheets = flattenRoutes(routes);

  // Load routes dari Supabase / cache lokal
  const loadRoutes = async () => {
    const data = await fetchRoutesWithSheets();
    setRoutes(data);
    return data;
  };

  useEffect(() => {
    loadRoutes().then((data) => {
      // Auto-select sheet pertama jika belum ada sheetUrl terpilih
      const flat = flattenRoutes(data);
      if (flat.length > 0 && !sheetUrl) {
        setSheetUrl(flat[0].sheet.sheet_url);
      }
    });
  }, []);

  // Auto morph saat data berhasil di-load
  useEffect(() => {
    if ((prevLoadingRef.current && !isLoading && isDataLoaded) || (isDataLoaded && !isMorphed && !isLoading && !prevLoadingRef.current)) {
      setIsMorphed(true);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, isDataLoaded]);

  // Cari info rute aktif berdasarkan sheetUrl/currentSheetId
  const activeFlat = flatSheets.find(f =>
    currentSheetId ? f.sheet.sheet_url.includes(currentSheetId) : f.sheet.sheet_url === sheetUrl
  );
  const displayRouteTitle = activeFlat
    ? `${activeFlat.routeCode} (${MONTH_NAMES_ID[activeFlat.sheet.month]} ${activeFlat.sheet.year})`
    : 'Pilih Rute';
  const displayTabName = currentTabName || selectedTab;

  const resetForm = () => {
    setNewRouteCode('');
    setNewRouteUrl('');
    setNewMonth(new Date().getMonth() + 1);
    setNewYear(new Date().getFullYear());
    setFormError(null);
    setIsAddingRoute(false);
  };

  const handleSaveRoute = async () => {
    // Validasi
    if (!newRouteCode.trim()) {
      setFormError('Kode Rute wajib diisi (misal: JAK.76)');
      return;
    }
    if (!newRouteUrl.trim()) {
      setFormError('Link Google Sheets wajib diisi');
      return;
    }

    const spreadsheetId = extractSheetId(newRouteUrl.trim());
    if (!spreadsheetId) {
      setFormError('Link Google Sheets tidak valid. Pastikan Anda copy link dari Google Sheets.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const result = await createRouteWithSheet({
      routeCode: newRouteCode.trim().toUpperCase(),
      routeName: newRouteCode.trim().toUpperCase(),
      year: newYear,
      month: newMonth,
      sheetUrl: newRouteUrl.trim(),
      spreadsheetId,
    });

    setIsSaving(false);

    if (result.success) {
      // Reload routes dari Supabase & auto-select rute baru
      const updated = await loadRoutes();
      const flat = flattenRoutes(updated);
      const newSheet = flat.find(f => f.sheet.sheet_url === newRouteUrl.trim());
      if (newSheet) {
        setSheetUrl(newSheet.sheet.sheet_url);
      }
      resetForm();
    } else {
      setFormError(result.message || 'Gagal menyimpan rute.');
    }
  };

  const handleDeleteRoute = async () => {
    if (!activeFlat) return;

    const confirmMsg = `Hapus rute "${activeFlat.routeCode} (${MONTH_NAMES_ID[activeFlat.sheet.month]} ${activeFlat.sheet.year})"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    const result = await deleteRouteSheet(activeFlat.sheet.id, activeFlat.routeId);
    setIsDeleting(false);

    if (result.success) {
      const updated = await loadRoutes();
      const flat = flattenRoutes(updated);
      if (flat.length > 0) {
        setSheetUrl(flat[0].sheet.sheet_url);
      } else {
        setSheetUrl('');
      }
    } else {
      setFormError(result.message || 'Gagal menghapus rute.');
    }
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
          <Calendar size={13} style={{ flexShrink: 0 }} />
          <span>Tgl {displayTabName}</span>
        </span>
      </div>

      {/* Expanded Form View Layer */}
      <div className={`morph-form-content ${isMorphed ? 'hidden' : 'visible'}`}>
        {/* Header Bar — tap untuk collapse */}
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

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              className="input-field"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              style={{ flex: 1 }}
              disabled={flatSheets.length === 0}
            >
              <option value="">
                {flatSheets.length > 0 ? '-- Pilih Rute --' : '-- Belum ada rute (Klik + Tambah Rute) --'}
              </option>
              {flatSheets.map((f) => (
                <option key={`sp-${f.sheet.id}`} value={f.sheet.sheet_url}>
                  {f.routeCode} ({MONTH_NAMES_ID[f.sheet.month]} {f.sheet.year})
                </option>
              ))}
            </select>
            {activeFlat && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', padding: '0 12px', color: 'var(--danger-color)' }}
                onClick={handleDeleteRoute}
                disabled={isDeleting}
                title="Hapus Rute Ini"
              >
                {isDeleting ? <Loader2 className="spinner" size={16} /> : <Trash2 size={16} />}
              </button>
            )}
          </div>

          {/* Form Tambah Rute Baru — simpan ke Supabase */}
          {isAddingRoute && (
            <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Tambah Rute Baru</span>
                <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Kode Rute (misal: JAK.76)"
                value={newRouteCode}
                onChange={(e) => setNewRouteCode(e.target.value)}
                style={{ marginBottom: '8px' }}
              />

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <select
                  className="input-field"
                  value={newMonth}
                  onChange={(e) => setNewMonth(Number(e.target.value))}
                  style={{ flex: 1 }}
                >
                  {MONTH_NAMES_ID.slice(1).map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>{name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Tahun"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  style={{ width: '90px' }}
                  min={2020}
                  max={2099}
                />
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Link Google Sheets..."
                value={newRouteUrl}
                onChange={(e) => setNewRouteUrl(e.target.value)}
                style={{ marginBottom: '8px' }}
              />

              {formError && (
                <div className="error-text" style={{ marginBottom: '8px', fontSize: '12px' }}>
                  {formError}
                </div>
              )}

              <button
                type="button"
                className="btn"
                onClick={handleSaveRoute}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="spinner" size={18} /> : null}
                {isSaving ? 'Menyimpan...' : 'Simpan Rute'}
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
          disabled={isLoading || isAddingRoute || !sheetUrl}
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Load Data Unit'}
        </button>
      </div>
    </div>
  );
}
