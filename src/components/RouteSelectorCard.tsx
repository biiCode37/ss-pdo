import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { fetchRoutesWithSheets, createRouteWithSheet } from '../services/routeService';
import { inspectSpreadsheetHeader } from '../services/googleSheets';
import { extractSpreadsheetId } from '../utils/sheetIdentity';
import {
  validateRouteCode,
  validateGoogleSheetsUrl,
} from '../utils/routeValidation';
import { getFormattedDateBadge } from '../utils/analytics';
import type { Route } from '../types/supabase';
import { TEXT_DASHBOARD, TEXT_COMMON } from '../constants/texts';
import { AddRouteModal } from './routeSelector/AddRouteModal';
import { RouteSelectorSheet } from './routeSelector/RouteSelectorSheet';

// ponytail: centralized month names dictionary from TEXT_COMMON
const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;

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
  onLoadData: (tab?: string, targetSheetUrl?: string) => void;
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
  onExitAccumulation?: (targetDay?: string) => void;
  reportRoute?: { id: number; route_code: string } | null;
  reportStatus?: 'draft' | 'submitted' | 'verified';
  onOpenReportModal?: () => void;
}

function RouteSelectorCardComponent({
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
  accRange,
  onExitAccumulation,
  reportRoute,
  reportStatus,
  onOpenReportModal,
}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(!isDataLoaded);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newRouteCodeSuffix, setNewRouteCodeSuffix] = useState('');
  const [newRouteUrl, setNewRouteUrl] = useState('');
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  // Live Spreadsheet Check State
  const [detectedRouteName, setDetectedRouteName] = useState<string | null>(null);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // 4-Level Sequential Selection State (Cascade: Year → Month → Route → Date)
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('');

  const prevLoadingRef = useRef(isLoading);
  const [routes, setRoutes] = useState<Route[]>([]);
  // ponytail: native flatMap replaces custom flattenRoutes utility file
  const flatSheets = useMemo(
    () =>
      routes.flatMap((r) =>
        (r.route_sheets || []).map((s) => ({
          routeId: r.id,
          routeCode: r.route_code,
          routeName: r.route_name,
          sheet: s,
        }))
      ),
    [routes]
  );

  // Derived cascade options (filter by parent selection) — DECLARED FIRST for proper ordering
  const availableYears = Array.from(new Set(flatSheets.map(f => f.sheet.year))).sort((a, b) => b - a);

  const availableMonths = selectedYear
    ? Array.from(
        new Set(flatSheets.filter(f => f.sheet.year === selectedYear).map(f => f.sheet.month))
      ).sort((a, b) => a - b)
    : [];

  const availableRouteCodes = (selectedYear && selectedMonth)
    ? Array.from(
        new Set(
          flatSheets
            .filter(f => f.sheet.year === selectedYear && f.sheet.month === selectedMonth)
            .map(f => f.routeCode)
        )
      ).sort((a, b) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' }))
    : [];

  // Derived cascade enabled flags
  const monthEnabled = selectedYear !== null && availableYears.length > 0;
  const routeEnabled = selectedMonth !== null;
  const dateEnabled = selectedRouteCode !== '';

  // Live check inspection saat user mengisi link Google Sheets
  useEffect(() => {
    if (!isAddingRoute || !newRouteUrl.trim()) {
      setCheckStatus('idle');
      setCheckMessage(null);
      setDetectedRouteName(null);
      return;
    }

    const validation = validateGoogleSheetsUrl(newRouteUrl);
    if (!validation.isValid || !validation.spreadsheetId) {
      setCheckStatus('invalid');
      setCheckMessage(validation.error || 'Link Google Sheets tidak valid.');
      setDetectedRouteName(null);
      return;
    }

    const timer = setTimeout(async () => {
      // BUG-48: Token pembatal — hasil inspeksi stale (user sudah mengganti
      // link) tidak boleh menimpa status/URL terkini.
      const checkedUrl = newRouteUrl;
      const checkedId = validation.spreadsheetId!;
      setIsCheckingLink(true);
      setCheckStatus('checking');
      setCheckMessage(TEXT_DASHBOARD.ROUTE_SELECTOR.CHECKING_ACCESS);

      try {
        const result = await inspectSpreadsheetHeader(checkedId);

        if (newRouteUrl !== checkedUrl) return; // Stale — abaikan

        setIsCheckingLink(false);
        if (result.success) {
          setCheckStatus('valid');
          setDetectedRouteName(result.routeName || null);
          setCheckMessage(
            result.routeName
              ? `Terhubung: ${result.routeName}`
              : TEXT_DASHBOARD.ROUTE_SELECTOR.CONNECTED_READY,
          );
        } else {
          setCheckStatus('invalid');
          setCheckMessage(
            result.message || TEXT_DASHBOARD.ROUTE_SELECTOR.CANNOT_ACCESS,
          );
          setDetectedRouteName(null);
        }
      } catch (_err) {
        if (newRouteUrl !== checkedUrl) return;
        setIsCheckingLink(false);
        setCheckStatus('invalid');
        setCheckMessage(TEXT_DASHBOARD.ROUTE_SELECTOR.CANNOT_ACCESS);
        setDetectedRouteName(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newRouteUrl, isAddingRoute]);

  // Proactive duplicate detection (real-time)
  const fullNewRouteCode = newRouteCodeSuffix.trim() ? `JAK.${newRouteCodeSuffix.trim()}` : '';
  const newSpreadsheetId = extractSpreadsheetId(newRouteUrl.trim());

  const duplicateRouteSheet = isAddingRoute && fullNewRouteCode
    ? flatSheets.find(
        f => f.routeCode === fullNewRouteCode && f.sheet.month === newMonth && f.sheet.year === newYear
      )
    : null;

  const duplicateSpreadsheetSheet = isAddingRoute && newSpreadsheetId
    ? flatSheets.find(
        f => {
          const fId = extractSpreadsheetId(f.sheet.sheet_url) || extractSpreadsheetId(f.sheet.spreadsheet_id);
          return fId === newSpreadsheetId && f.sheet.month === newMonth && f.sheet.year === newYear;
        }
      )
    : null;

  const duplicateWarningMessage = duplicateRouteSheet
    ? TEXT_DASHBOARD.ROUTE_SELECTOR.DUPLICATE_ROUTE_WARNING(fullNewRouteCode, MONTH_NAMES_ID[newMonth], newYear)
    : duplicateSpreadsheetSheet && duplicateSpreadsheetSheet.routeCode !== fullNewRouteCode
      ? TEXT_DASHBOARD.ROUTE_SELECTOR.DUPLICATE_SHEET_WARNING(duplicateSpreadsheetSheet.routeCode, MONTH_NAMES_ID[newMonth], newYear)
      : null;

  // Load routes dari Supabase / cache lokal
  const loadRoutes = async () => {
    const data = await fetchRoutesWithSheets();
    setRoutes(data);
    return data;
  };

  useEffect(() => {
    loadRoutes().then((data) => {
      const flat = data.flatMap((r) =>
        (r.route_sheets || []).map((s) => ({
          routeId: r.id,
          routeCode: r.route_code,
          routeName: r.route_name,
          sheet: s,
        }))
      );
      if (flat.length > 0) {
        // Cek riwayat dari localStorage (BUG-42)
        try {
          const saved = localStorage.getItem('PDO_LAST_VISITED');
          if (saved) {
            const parsed = JSON.parse(saved);
            const savedMatch = flat.find(f =>
              f.sheet.sheet_url === parsed.sheetUrl ||
              (extractSpreadsheetId(f.sheet.sheet_url) && extractSpreadsheetId(parsed.sheetUrl) &&
                extractSpreadsheetId(f.sheet.sheet_url) === extractSpreadsheetId(parsed.sheetUrl))
            );
            if (savedMatch && parsed.year && parsed.month && parsed.routeCode) {
              // Restore penuh → semua dropdown disabled cascade menjadi enabled
              setSelectedYear(parsed.year);
              setSelectedMonth(parsed.month);
              setSelectedRouteCode(parsed.routeCode);
              setSheetUrl(savedMatch.sheet.sheet_url);
              setSelectedTab(parsed.selectedTab || String(new Date().getDate()));
              return;
            }
          }
        } catch (_e) {}

        // Fallback: hanya Tahun default ke tahun sekarang, sisanya menunggu
        // input cascade dari user (Bulan/Rute/Tanggal disabled).
        const currentYear = new Date().getFullYear();
        if (flat.some(f => f.sheet.year === currentYear)) {
          setSelectedYear(currentYear);
        } else if (flat.length > 0) {
          setSelectedYear(flat[0].sheet.year);
        }
        // BUG-13: Jangan menampilkan tanggal "terisi" yang menyesatkan pada
        // dropdown Tanggal yang masih disabled (belum ada rute terpilih).
        if (!isAccumulation) setSelectedTab('');
        if (!sheetUrl) {
          setSheetUrl('');
        }
      }
    });
  }, []);

  // ROUTE-12-01: Sync dropdown cascade HANYA saat data sheet baru selesai dimuat (currentSheetId berganti)
  // Tidak memantau sheetUrl/selectedTab agar pilihan rute yang baru dipilih user tidak tertimpa balik
  const prevLoadedSheetIdRef = useRef<string | undefined>(currentSheetId);
  useEffect(() => {
    if (flatSheets.length === 0 || !currentSheetId) return;

    if (prevLoadedSheetIdRef.current === currentSheetId && selectedRouteCode) return;
    prevLoadedSheetIdRef.current = currentSheetId;

    const active = flatSheets.find(f => {
      const fId = extractSpreadsheetId(f.sheet.sheet_url) || extractSpreadsheetId(f.sheet.spreadsheet_id);
      return fId === currentSheetId;
    });

    if (active) {
      setSelectedYear(active.sheet.year);
      setSelectedMonth(active.sheet.month);
      setSelectedRouteCode(active.routeCode);

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
  }, [flatSheets, currentSheetId, selectedTab]);

  // CSS cascade handlers — perubahan pada level atas me-reset level bawah
  // BUG-12: Jika mode AKUMULASI aktif, JANGAN reset selectedTab (mode rekap
  // dipertahankan); hanya perbarui sheetUrl ke rute/bulan/tahun baru.
  const isAccumulation = selectedTab === 'AKUMULASI';

  const handleYearChange = (year: string) => {
    const y = year ? Number(year) : null;
    setSelectedYear(y as number | null);
    setSelectedMonth(null);
    setSelectedRouteCode('');
    setSheetUrl('');
    if (!isAccumulation) setSelectedTab('');
  };

  const handleMonthChange = (month: string) => {
    const m = month ? Number(month) : null;
    setSelectedMonth(m);
    setSelectedRouteCode('');
    setSheetUrl('');
    if (!isAccumulation) setSelectedTab('');
  };

  const handleRouteCodeChange = (code: string) => {
    setSelectedRouteCode(code);

    const sheetFn = getSheetForSelection(code);
    if (sheetFn) {
      setSheetUrl(sheetFn.sheet.sheet_url);
      // BUG-3/12: Hanya auto-set tanggal hari ini saat mode NORMAL.
      // Di mode AKUMULASI, selectedTab & Tanggal dropdown dibiarkan (rekap).
      if (!isAccumulation) {
        const today = String(new Date().getDate());
        const defaultDay = days.includes(today) ? today : days[0] || '';
        setSelectedTab(defaultDay);
      }
    } else {
      setSheetUrl('');
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    if (tab && tab !== 'AKUMULASI') {
      if (onExitAccumulation) {
        onExitAccumulation(tab);
      } else {
        onLoadData(tab, sheetUrl);
      }
    }
  };

  // Helper: cari sheet untuk kombinasi rute+bulan+tahun saat ini
  const getSheetForSelection = (code: string | null) => {
    if (!code || !selectedYear || !selectedMonth) return null;
    return flatSheets.find(
      f => f.routeCode === code && f.sheet.month === selectedMonth && f.sheet.year === selectedYear
    );
  };

  // Auto tutup sheet saat data berhasil selesai di-load (transisi dari loading -> selesai)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && isDataLoaded) {
      setIsSheetOpen(false);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, isDataLoaded]);

  // ROUTE-12-01: Cari info rute aktif untuk pill (prioritaskan data ter-load jika ada)
  const loadedFlat = isDataLoaded && currentSheetId
    ? flatSheets.find(f => {
        const fId = extractSpreadsheetId(f.sheet.sheet_url) || extractSpreadsheetId(f.sheet.spreadsheet_id);
        return fId === currentSheetId;
      })
    : null;

  const displayRouteCode = loadedFlat
    ? loadedFlat.routeCode
    : selectedRouteCode || TEXT_DASHBOARD.ROUTE_SELECTOR.DEFAULT_SELECT_PERIOD;

  const displayDateLabel = selectedTab === 'AKUMULASI'
    ? `Akumulasi (${getFormattedDateBadge('AKUMULASI', selectedMonth ?? new Date().getMonth() + 1, selectedYear ?? new Date().getFullYear(), accRange)})`
    : `Tgl ${currentTabName || selectedTab || '?'}`;

  const resetForm = () => {
    setNewRouteCodeSuffix('');
    setNewRouteUrl('');
    setNewMonth(new Date().getMonth() + 1);
    setNewYear(new Date().getFullYear());
    setFormError(null);
    setCheckStatus('idle');
    setCheckMessage(null);
    setDetectedRouteName(null);
    setIsAddingRoute(false);
  };

  const handleRouteCodeSuffixInput = (val: string) => {
    let cleaned = val.toUpperCase().replace(/\s+/g, '');
    if (cleaned.startsWith('JAK.')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('JAK')) {
      cleaned = cleaned.substring(3).replace(/^[^A-Z0-9]+/, '');
    }
    const sanitized = cleaned.replace(/[^A-Z0-9]/g, '');
    setNewRouteCodeSuffix(sanitized);
    if (formError) setFormError(null);
  };

  const handleSaveRoute = async () => {
    if (duplicateWarningMessage) {
      setFormError(duplicateWarningMessage);
      return;
    }

    if (!newRouteCodeSuffix.trim()) {
      setFormError(TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_CODE_REQUIRED);
      return;
    }

    const fullRouteCode = `JAK.${newRouteCodeSuffix.trim()}`;
    const codeValidation = validateRouteCode(fullRouteCode);
    if (!codeValidation.isValid) {
      setFormError(codeValidation.error || 'Kode Rute tidak valid.');
      return;
    }

    const urlValidation = validateGoogleSheetsUrl(newRouteUrl);
    if (!urlValidation.isValid || !urlValidation.spreadsheetId) {
      setFormError(urlValidation.error || 'Link Google Sheets tidak valid.');
      return;
    }

    // BUG-49: Validasi tahun — input number bisa kosong (Number('') = 0)
    // atau di luar rentang wajar; min/max HTML hanya membatasi spinner.
    if (!Number.isInteger(newYear) || newYear < 2020 || newYear > 2099) {
      setFormError(TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_INVALID);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const result = await createRouteWithSheet({
      routeCode: fullRouteCode,
      routeName: detectedRouteName || fullRouteCode,
      year: newYear,
      month: newMonth,
      sheetUrl: newRouteUrl.trim(),
      spreadsheetId: urlValidation.spreadsheetId,
    });

    setIsSaving(false);

    if (result.success) {
      await loadRoutes();
      setSheetUrl(newRouteUrl.trim());
      setSelectedRouteCode(fullRouteCode);
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
      // BUG-2: setelah tambah rute sukses, reset dropdown tanggal ke hari ini
      // (mode normal) agar konsisten dengan rute baru yang disimpan.
      const today = String(new Date().getDate());
      const defaultDay = days.includes(today) ? today : days[0] || '';
      if (!isAccumulation) {
        setSelectedTab(defaultDay);
      }
      resetForm();
      // BUG-67: teruskan tab eksplisit agar Dashboard load data rute baru;
      // isRefresh=true memaksa reload walaupun busData sudah ada (auto-load
      // effect terblokir oleh guard busData).
      onLoadData(isAccumulation ? undefined : defaultDay);
    } else {
      setFormError(result.message || TEXT_DASHBOARD.ROUTE_SELECTOR.SAVE_ROUTE_FAILED);
    }
  };

  const warningMessage =
    !getSheetForSelection(selectedRouteCode) && selectedRouteCode && selectedMonth && selectedYear
      ? TEXT_DASHBOARD.ROUTE_SELECTOR.NO_ROUTE_SHEET_WARNING(selectedRouteCode, MONTH_NAMES_ID[selectedMonth], selectedYear)
      : null;

  return (
    <>
      {/* Unified Route Control Bar (Single Smart Pill) */}
      <div
        className="glass unified-route-control-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: '14px',
          marginBottom: '14px',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          background: 'var(--card-bg, rgba(23, 23, 23, 0.75))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Left Segment: Clean Unified Route & Date Trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsSheetOpen(true);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0,
            padding: '6px 8px',
            borderRadius: '10px',
            cursor: 'pointer',
            background: 'transparent',
            transition: 'background 0.2s ease',
            userSelect: 'none',
          }}
          title="Klik untuk memilih rute atau tanggal"
        >
          <MapPin size={16} style={{ color: 'var(--accent-color, #3ECF8E)', flexShrink: 0 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 0,
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '13.5px',
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
              }}
            >
              {displayRouteCode}
            </span>
            <span style={{ color: 'var(--text-secondary)', opacity: 0.45, fontSize: '12px' }}>•</span>
            <span
              style={{
                fontWeight: 500,
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'var(--text-secondary)',
              }}
            >
              {displayDateLabel}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-secondary)', opacity: 0.7, flexShrink: 0 }} />
        </div>

        {/* Right Segment: Exit Accumulation OR Unified Operational Report Pill */}
        {isAccumulation ? (
          <button
            type="button"
            data-testid="exit-accumulation-btn"
            onClick={() => {
              if (onExitAccumulation) {
                onExitAccumulation();
              } else {
                const today = String(new Date().getDate());
                const defaultDay = days.includes(today) ? today : (days[0] || '1');
                setSelectedTab(defaultDay);
                onLoadData(defaultDay, sheetUrl);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '9px',
              color: 'var(--warning-color, #eab308)',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            title="Keluar dari mode akumulasi kembali ke harian"
          >
            <span>✕</span>
            <span>Keluar Akumulasi</span>
          </button>
        ) : reportRoute && onOpenReportModal ? (
          <button
            type="button"
            data-testid="open-operational-report-btn"
            onClick={onOpenReportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background:
                reportStatus === 'verified'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : reportStatus === 'submitted'
                  ? 'rgba(14, 165, 233, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${
                reportStatus === 'verified'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : reportStatus === 'submitted'
                  ? 'rgba(14, 165, 233, 0.25)'
                  : 'rgba(245, 158, 11, 0.25)'
              }`,
              borderRadius: '9px',
              color:
                reportStatus === 'verified'
                  ? 'var(--success-color, #10b981)'
                  : reportStatus === 'submitted'
                  ? 'var(--info-color, #38bdf8)'
                  : 'var(--warning-color, #f59e0b)',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
            title="Buka laporan kondisi dan armada rute"
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background:
                  reportStatus === 'verified'
                    ? 'var(--success-color, #10b981)'
                    : reportStatus === 'submitted'
                    ? 'var(--info-color, #38bdf8)'
                    : 'var(--warning-color, #f59e0b)',
                flexShrink: 0,
              }}
            />
            <span>
              {reportStatus === 'verified'
                ? 'Terverifikasi'
                : reportStatus === 'submitted'
                ? 'Terkirim'
                : 'Laporan'}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>
        ) : null}
      </div>

      {/* Contextual Bottom Sheet Drawer */}
      <RouteSelectorSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        availableYears={availableYears}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        availableMonths={availableMonths}
        monthEnabled={monthEnabled}
        selectedRouteCode={selectedRouteCode}
        onRouteCodeChange={handleRouteCodeChange}
        availableRouteCodes={availableRouteCodes}
        routeEnabled={routeEnabled}
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        days={days}
        dateEnabled={dateEnabled}
        isAccumulation={isAccumulation}
        isLoading={isLoading}
        sheetUrl={sheetUrl}
        onLoadData={(tab, targetUrl) => {
          onLoadData(tab, targetUrl);
          setIsSheetOpen(false);
        }}
        onOpenAddRoute={() => setIsAddingRoute(true)}
        warningMessage={warningMessage}
        onExitAccumulation={onExitAccumulation}
      />

      {/* Modal Tambah Rute Baru */}
      <AddRouteModal
        isOpen={isAddingRoute}
        onClose={resetForm}
        newRouteCodeSuffix={newRouteCodeSuffix}
        onRouteCodeSuffixChange={handleRouteCodeSuffixInput}
        newMonth={newMonth}
        onMonthChange={setNewMonth}
        newYear={newYear}
        onYearChange={setNewYear}
        newRouteUrl={newRouteUrl}
        onRouteUrlChange={setNewRouteUrl}
        checkStatus={checkStatus}
        checkMessage={checkMessage}
        duplicateWarningMessage={duplicateWarningMessage}
        formError={formError}
        isSaving={isSaving}
        isCheckingLink={isCheckingLink}
        onSaveRoute={handleSaveRoute}
      />
    </>
  );
}

export const RouteSelectorCard = memo(RouteSelectorCardComponent);
