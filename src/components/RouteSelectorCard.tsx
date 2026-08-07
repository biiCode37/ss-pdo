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

  const [newRouteCode, setNewRouteCode] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // 3-Level Selection State (BUG-41)
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const prevLoadingRef = useRef(isLoading);
  const [routes, setRoutes] = useState<Route[]>([]);
  const flatSheets = flattenRoutes(routes);

  // Dropdown lists
  const routeCodes = Array.from(new Set(flatSheets.map(f => f.routeCode))).sort();
  const availableMonths = Array.from(
    new Set(flatSheets.filter(f => f.routeCode === selectedRouteCode).map(f => f.sheet.month))
  ).sort((a, b) => a - b);
  const availableYears = Array.from(
    new Set(
      flatSheets
        .filter(f => f.routeCode === selectedRouteCode && f.sheet.month === selectedMonth)
        .map(f => f.sheet.year)
    )
  ).sort((a, b) => b - a);

  // Load routes dari Supabase / cache lokal
  const loadRoutes = async () => {
    const data = await fetchRoutesWithSheets();
    setRoutes(data);
    return data;
  };

  useEffect(() => {
    loadRoutes().then((data) => {
      const flat = flattenRoutes(data);
      if (flat.length > 0) {
        // Cek riwayat dari localStorage (BUG-42)
        try {
          const saved = localStorage.getItem('PDO_LAST_VISITED');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.sheetUrl && flat.some(f => f.sheet.sheet_url === parsed.sheetUrl)) {
              setSheetUrl(parsed.sheetUrl);
              if (parsed.routeCode) setSelectedRouteCode(parsed.routeCode);
              if (parsed.month) setSelectedMonth(parsed.month);
              if (parsed.year) setSelectedYear(parsed.year);
              if (parsed.selectedTab) setSelectedTab(parsed.selectedTab);
              return;
            }
          }
        } catch (_e) {}

        if (!sheetUrl) {
          setSheetUrl(flat[0].sheet.sheet_url);
          setSelectedRouteCode(flat[0].routeCode);
          setSelectedMonth(flat[0].sheet.month);
          setSelectedYear(flat[0].sheet.year);
        }
      }
    });
  }, []);

  // Sync 3-level dropdowns when active sheet changes
  useEffect(() => {
    if (flatSheets.length === 0) return;
    const active = flatSheets.find(f =>
      currentSheetId ? f.sheet.sheet_url.includes(currentSheetId) : f.sheet.sheet_url === sheetUrl
    );
    if (active) {
      setSelectedRouteCode(active.routeCode);
      setSelectedMonth(active.sheet.month);
      setSelectedYear(active.sheet.year);

      // Simpan ke localStorage (BUG-42)
      try {
        localStorage.setItem('PDO_LAST_VISITED', JSON.stringify({
          sheetUrl: active.sheet.sheet_url,
          selectedTab,
          routeCode: active.routeCode,
          month: active.sheet.month,
          year: active.sheet.year,
        }));
      } catch (_e) {}
    }
  }, [routes, sheetUrl, currentSheetId, selectedTab]);

  const handleRouteCodeChange = (code: string) => {
    setSelectedRouteCode(code);
    const months = Array.from(
      new Set(flatSheets.filter(f => f.routeCode === code).map(f => f.sheet.month))
    ).sort((a, b) => a - b);
    const nextMonth = months.includes(selectedMonth) ? selectedMonth : (months[0] || new Date().getMonth() + 1);
    setSelectedMonth(nextMonth);

    const years = Array.from(
      new Set(flatSheets.filter(f => f.routeCode === code && f.sheet.month === nextMonth).map(f => f.sheet.year))
    ).sort((a, b) => b - a);
    const nextYear = years.includes(selectedYear) ? selectedYear : (years[0] || new Date().getFullYear());
    setSelectedYear(nextYear);

    const match = flatSheets.find(f => f.routeCode === code && f.sheet.month === nextMonth && f.sheet.year === nextYear);
    if (match) {
      setSheetUrl(match.sheet.sheet_url);
    } else {
      setSheetUrl('');
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const years = Array.from(
      new Set(flatSheets.filter(f => f.routeCode === selectedRouteCode && f.sheet.month === month).map(f => f.sheet.year))
    ).sort((a, b) => b - a);
    const nextYear = years.includes(selectedYear) ? selectedYear : (years[0] || new Date().getFullYear());
    setSelectedYear(nextYear);

    const match = flatSheets.find(f => f.routeCode === selectedRouteCode && f.sheet.month === month && f.sheet.year === nextYear);
    if (match) {
      setSheetUrl(match.sheet.sheet_url);
    } else {
      setSheetUrl('');
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const match = flatSheets.find(f => f.routeCode === selectedRouteCode && f.sheet.month === selectedMonth && f.sheet.year === year);
    if (match) {
      setSheetUrl(match.sheet.sheet_url);
    } else {
      setSheetUrl('');
    }
  };

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
    : selectedRouteCode
      ? `${selectedRouteCode} (${MONTH_NAMES_ID[selectedMonth]} ${selectedYear})`
      : 'Pilih Rute & Periode';
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
      await loadRoutes();
      setSheetUrl(newRouteUrl.trim());
      setSelectedRouteCode(newRouteCode.trim().toUpperCase());
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      resetForm();
    } else {
      setFormError(result.message || 'Gagal menyimpan rute.');
    }
  };

  const handleDeleteRoute = async () => {
    if (!activeFlat) return;
    if (!confirm(`Hapus sheet rute ${activeFlat.routeCode} (${MONTH_NAMES_ID[activeFlat.sheet.month]} ${activeFlat.sheet.year}) dari daftar?`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteRouteSheet(activeFlat.sheet.id, activeFlat.routeId);
    setIsDeleting(false);

    if (result.success) {
      const updatedRoutes = await loadRoutes();
      const flat = flattenRoutes(updatedRoutes);
      if (flat.length > 0) {
        setSheetUrl(flat[0].sheet.sheet_url);
      } else {
        setSheetUrl('');
      }
    } else {
      alert(result.message || 'Gagal menghapus rute');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <MapPin size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayRouteTitle}
          </span>
        </div>
        <div className="morph-pill-badge" style={{ flexShrink: 0, marginLeft: '8px' }}>
          <Calendar size={13} style={{ flexShrink: 0 }} />
          <span>Tgl {displayTabName}</span>
        </div>
      </div>

      {/* Expanded Form View Layer */}
      <div className={`morph-form-content ${isMorphed ? 'hidden' : 'visible'}`}>
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
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--accent-color)' }} />
            Pilih Rute & Tanggal
          </span>
          {isDataLoaded && (
            <ChevronUp size={16} style={{ color: 'var(--text-secondary)', opacity: 0.8 }} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Pilih Rute & Periode</label>
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

            {/* 2-Row Grid Layout: Row 1 (Rute & Tanggal), Row 2 (Bulan & Tahun) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
              {/* Row 1, Col 1: Rute */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Rute</label>
                <select
                  className="input-field"
                  value={selectedRouteCode}
                  onChange={(e) => handleRouteCodeChange(e.target.value)}
                  disabled={routeCodes.length === 0}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">{routeCodes.length > 0 ? '-- Rute --' : '-- Kosong --'}</option>
                  {routeCodes.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              {/* Row 1, Col 2: Tanggal */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Tanggal</label>
                <select
                  className="input-field"
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                >
                  {days.map(day => (
                    <option key={day} value={day}>Tgl {day}</option>
                  ))}
                </select>
              </div>

              {/* Row 2, Col 1: Bulan */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Bulan</label>
                <select
                  className="input-field"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  disabled={!selectedRouteCode || availableMonths.length === 0}
                  style={{ width: '100%', padding: '8px' }}
                >
                  {availableMonths.length === 0 && <option value={selectedMonth}>{MONTH_NAMES_ID[selectedMonth] || 'Bulan'}</option>}
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{MONTH_NAMES_ID[m]}</option>
                  ))}
                </select>
              </div>

              {/* Row 2, Col 2: Tahun */}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Tahun</label>
                <select
                  className="input-field"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  disabled={!selectedRouteCode || availableYears.length === 0}
                  style={{ width: '100%', padding: '8px' }}
                >
                  {availableYears.length === 0 && <option value={selectedYear}>{selectedYear}</option>}
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFlat ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: 'auto', padding: '4px 10px', color: 'var(--danger-color)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleDeleteRoute}
                  disabled={isDeleting}
                  title="Hapus Sheet Ini"
                >
                  {isDeleting ? <Loader2 className="spinner" size={14} /> : <Trash2 size={14} />} Hapus Sheet Periode Ini
                </button>
              </div>
            ) : selectedRouteCode ? (
              <div style={{ fontSize: '12px', color: 'var(--warning-color)', marginBottom: '8px' }}>
                ⚠️ Belum ada sheet untuk rute {selectedRouteCode} periode {MONTH_NAMES_ID[selectedMonth]} {selectedYear}. Klik <b>+ Tambah Rute</b> untuk mendaftarkannya.
              </div>
            ) : null}

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
    </div>
  );
}
