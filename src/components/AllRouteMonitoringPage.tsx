import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bus,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  fetchRegionalMonitoringData,
  type RegionalMonitoringResult,
  type RegionalRouteItem
} from '../services/allRouteMonitoringService';
import { verifyDailyRouteReport } from '../services/dailyRouteReportService';
import { WaReportModal } from './WaReportModal';
import { showSuccessToast, showErrorAlert } from '../utils/alertUtils';
import {
  TEXT_MONITORING,
  TEXT_COMMON,
  TEXT_ERRORS,
  TEXT_ALERTS,
} from '../constants/texts';

interface Props {
  onBackToRouteView?: () => void;
  onSelectRoute?: (routeCode: string) => void;
  currentDate?: string;
  onDateChange?: (newDate: string) => void;
  currentUserEmail?: string;
}

export const SUPERVISOR_TABS = [
  { id: 'ALL', label: TEXT_MONITORING.TABS.ALL_LABEL, keyword: '' },
  { id: 'RANTO', label: 'Ranto Lumban Toruan', keyword: 'RANTO' },
  { id: 'ABDUL', label: 'Abdul Manan', keyword: 'ABDUL' },
  { id: 'MOAMAR', label: 'Moamar Z.A. Mahu', keyword: 'MOAMAR' },
] as const;

export function matchesSupervisorTab(supervisorName: string, tabId: string): boolean {
  if (tabId === 'ALL') return true;
  const upper = (supervisorName || '').toUpperCase();
  if (tabId === 'RANTO') return upper.includes('RANTO');
  if (tabId === 'ABDUL') return upper.includes('ABDUL');
  if (tabId === 'MOAMAR') return upper.includes('MOAMAR');
  return true;
}

function formatIndonesianDateLabel(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${d} ${months[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('id-ID');
}

function formatDecimal(num: number, digits: number = 1): string {
  return Number(num.toFixed(digits)).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const AllRouteMonitoringPage = memo(function AllRouteMonitoringPage({
  onBackToRouteView,
  onSelectRoute,
  currentDate,
  onDateChange,
  currentUserEmail
}: Props) {
  // Date state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || todayStr);

  useEffect(() => {
    if (currentDate && currentDate !== selectedDate) {
      setSelectedDate(currentDate);
    }
  }, [currentDate, selectedDate]);

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<RegionalMonitoringResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter state
  const [selectedSupervisorTab, setSelectedSupervisorTab] = useState<string>('ALL');

  // Modal state
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  // Load regional data
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchRegionalMonitoringData(selectedDate);
      setData(res);
    } catch (err: unknown) {
      console.warn('[AllRouteMonitoringPage] Gagal memuat data:', err);
      setErrorMessage(TEXT_ERRORS.LOAD_REGIONAL_FAILED);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date step handlers
  const handleStepDate = (days: number) => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + days);
      const nextDateStr = date.toISOString().split('T')[0];
      setSelectedDate(nextDateStr);
      onDateChange?.(nextDateStr);
    } catch (err) {
      console.warn('[AllRouteMonitoringPage] Gagal navigasi tanggal:', err);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(val);
      onDateChange?.(val);
    }
  };

  // Verification handler
  const handleVerifyRoute = async (routeId: number, currentStatus: string) => {
    if (currentStatus === 'verified') return;
    try {
      await verifyDailyRouteReport(routeId, selectedDate, currentUserEmail);
      showSuccessToast(TEXT_ALERTS.TOAST.SUCCESS_VERIFIED);
      // Refresh data locally
      setData(prev => {
        if (!prev) return prev;
        const updatedRoutes = prev.routes.map(r => {
          if (r.id === routeId) {
            return { ...r, status: 'verified' as const };
          }
          return r;
        });
        const verifiedCount = updatedRoutes.filter(r => r.status === 'verified').length;
        return {
          ...prev,
          routes: updatedRoutes,
          verifiedCount
        };
      });
    } catch (err: unknown) {
      console.warn('[AllRouteMonitoringPage] Gagal verifikasi laporan:', err);
      showErrorAlert('Gagal', TEXT_ERRORS.VERIFY_FAILED);
    }
  };

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    if (!data) return [];
    if (selectedSupervisorTab === 'ALL') return data.routes;
    return data.routes.filter(r => matchesSupervisorTab(r.supervisorName, selectedSupervisorTab));
  }, [data, selectedSupervisorTab]);

  const overallArmadaPct = useMemo(() => {
    if (!data || data.totalRenops === 0) return 0;
    return (data.totalRealops / data.totalRenops) * 100;
  }, [data]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-color, #0c0c0c)',
        color: 'var(--text-primary, #ededed)',
        paddingBottom: '96px',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      {/* Sticky Top Header Block */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--card-bg, rgba(23, 23, 23, 0.95))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Pojok Kiri: Tombol Kembali & Judul */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToRouteView && (
              <button
                type="button"
                onClick={onBackToRouteView}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-primary, #ededed)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={TEXT_MONITORING.HEADER.BTN_BACK_TITLE}
              >
                <ArrowLeft size={16} />
                <span>{TEXT_MONITORING.HEADER.BTN_BACK}</span>
              </button>
            )}

            <div>
              <h1
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-primary, #ededed)',
                  letterSpacing: '-0.3px',
                }}
              >
                <Bus size={20} style={{ color: 'var(--accent-color, #3ECF8E)', flexShrink: 0 }} />
                <span>{TEXT_MONITORING.HEADER.TITLE}</span>
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary, #8b8b8b)',
                  fontWeight: 500,
                  display: 'block',
                  marginTop: '1px',
                }}
              >
                {TEXT_MONITORING.HEADER.SUBTITLE}
              </span>
            </div>
          </div>

          {/* Pojok Kanan: Date Navigator, Refresh, & Tombol WA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Date Navigator Box */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                borderRadius: '12px',
                padding: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => handleStepDate(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary, #ededed)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={TEXT_COMMON.NAV.PREV_DAY}
              >
                <ChevronLeft size={16} />
              </button>

              <label
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #ededed)',
                  userSelect: 'none',
                }}
              >
                <Calendar size={14} style={{ color: 'var(--accent-color, #3ECF8E)' }} />
                <span>{formatIndonesianDateLabel(selectedDate)}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateInputChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => handleStepDate(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary, #ededed)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={TEXT_COMMON.NAV.NEXT_DAY}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-primary, #ededed)',
                cursor: refreshing || loading ? 'wait' : 'pointer',
                opacity: refreshing || loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              title={TEXT_MONITORING.HEADER.REFRESH_TITLE}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>

            {/* Buat Laporan WA Button */}
            <button
              type="button"
              onClick={() => setIsWaModalOpen(true)}
              disabled={!data || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: !data || loading ? 'not-allowed' : 'pointer',
                opacity: !data || loading ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>{TEXT_MONITORING.HEADER.BTN_WA_REPORT}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                height: '70px',
                borderRadius: '16px',
                background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  style={{
                    height: '90px',
                    borderRadius: '14px',
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '12px',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  style={{
                    height: '160px',
                    borderRadius: '16px',
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMessage && (
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertCircle size={36} style={{ color: 'var(--danger-color, #ef4444)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--danger-color, #ef4444)' }}>
              {TEXT_MONITORING.ERROR_STATE.TITLE}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #8b8b8b)', margin: 0, maxWidth: '400px' }}>
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => loadData(false)}
              style={{
                marginTop: '6px',
                padding: '8px 18px',
                borderRadius: '10px',
                background: 'var(--danger-color, #ef4444)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {TEXT_MONITORING.ERROR_STATE.RETRY_BTN}
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !errorMessage && data && (
          <>
            {/* 1. Readiness Progress Banner */}
            <section
              style={{
                background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary, #8b8b8b)', fontWeight: 500 }}>
                  {TEXT_MONITORING.READINESS.LABEL}
                </span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary, #ededed)' }}>
                  {TEXT_MONITORING.READINESS.SUMMARY(
                    data.submittedCount,
                    data.totalRoutesCount,
                    Math.round((data.submittedCount / (data.totalRoutesCount || 1)) * 100)
                  )}
                </span>
              </div>

              {/* Progress Track */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '9999px',
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.06))',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round((data.submittedCount / (data.totalRoutesCount || 1)) * 100)}%`,
                    background: 'linear-gradient(90deg, #3ECF8E 0%, #00C573 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Status Breakdown Legend */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #8b8b8b)',
                  paddingTop: '2px',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  {TEXT_MONITORING.READINESS.LEGEND_VERIFIED}{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{data.verifiedCount}</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                  {TEXT_MONITORING.READINESS.LEGEND_SUBMITTED}{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{data.submittedCount - data.verifiedCount}</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  {TEXT_MONITORING.READINESS.LEGEND_DRAFT}{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{data.draftCount}</strong>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b' }} />
                  {TEXT_MONITORING.READINESS.LEGEND_EMPTY}{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{data.emptyCount}</strong>
                </span>
              </div>
            </section>

            {/* 2. Regional KPI Cards Grid */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Card 1: Armada Wilayah */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary, #8b8b8b)',
                    letterSpacing: '0.4px',
                  }}
                >
                  {TEXT_MONITORING.KPI.FLEET_LABEL}
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #ededed)' }}>
                  {data.totalRealops} / {data.totalRenops}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    {TEXT_MONITORING.KPI.FLEET_UNIT}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', paddingTop: '4px' }}>
                  <span style={{ color: 'var(--accent-color, #3ECF8E)', fontWeight: 700 }}>
                    {TEXT_MONITORING.KPI.FLEET_PCT(formatDecimal(overallArmadaPct, 1))}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {TEXT_MONITORING.KPI.FLEET_BREAKDOWN(data.totalRealops, data.totalRealops)}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Pelanggan */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary, #8b8b8b)',
                    letterSpacing: '0.4px',
                  }}
                >
                  {TEXT_MONITORING.KPI.PASSENGER_LABEL}
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-color, #3ECF8E)' }}>
                  {formatNumber(data.totalTodayPassengers)}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    {TEXT_MONITORING.KPI.PASSENGER_UNIT}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', paddingTop: '4px', color: 'var(--text-secondary)' }}>
                  <span>S1: <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(data.totalShift1)}</strong></span>
                  <span>S2: <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(data.totalShift2)}</strong></span>
                </div>
              </div>

              {/* Card 3: Total KM Tempuh */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary, #8b8b8b)',
                    letterSpacing: '0.4px',
                  }}
                >
                  {TEXT_MONITORING.KPI.KM_LABEL}
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>
                  {formatDecimal(data.totalKm, 1)}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '4px' }}>
                    {TEXT_MONITORING.KPI.KM_UNIT}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', paddingTop: '4px', color: 'var(--text-secondary)' }}>
                  <span>{TEXT_MONITORING.KPI.KM_AVG_LABEL}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatDecimal(data.averageKmPerBus, 1)} km
                  </span>
                </div>
              </div>

              {/* Card 4: Distribusi Shift */}
              <div
                style={{
                  background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                  border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary, #8b8b8b)',
                    letterSpacing: '0.4px',
                  }}
                >
                  {TEXT_MONITORING.KPI.SHIFT_DISTRIBUTION}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{TEXT_MONITORING.KPI.SHIFT_1_ROW}</span>
                  <span style={{ color: '#38bdf8' }}>
                    {formatNumber(data.totalShift1)} ({formatDecimal((data.totalShift1 / (data.totalTodayPassengers || 1)) * 100, 0)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{TEXT_MONITORING.KPI.SHIFT_2_ROW}</span>
                  <span style={{ color: '#c084fc' }}>
                    {formatNumber(data.totalShift2)} ({formatDecimal((data.totalShift2 / (data.totalTodayPassengers || 1)) * 100, 0)}%)
                  </span>
                </div>
              </div>
            </section>

            {/* 3. Korlap Filter Tabs */}
            <section
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
              className="no-scrollbar"
            >
              {SUPERVISOR_TABS.map(tab => {
                const isSelected = selectedSupervisorTab === tab.id;
                const count = data.routes.filter(r => matchesSupervisorTab(r.supervisorName, tab.id)).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedSupervisorTab(tab.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: isSelected
                        ? '1px solid var(--accent-color, #3ECF8E)'
                        : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                      background: isSelected
                        ? 'var(--accent-color, #3ECF8E)'
                        : 'var(--card-bg, rgba(23, 23, 23, 0.85))',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary, #8b8b8b)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                      boxShadow: isSelected ? '0 4px 12px rgba(62, 207, 142, 0.25)' : 'none',
                    }}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </section>

            {/* 4. Route Cards Grid */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '12px',
              }}
            >
              {filteredRoutes.map(route => (
                <RouteCardItem
                  key={route.id}
                  route={route}
                  onVerify={() => handleVerifyRoute(route.id, route.status)}
                  onSelectRoute={onSelectRoute}
                />
              ))}
            </section>
          </>
        )}
      </main>

      {/* WaReportModal */}
      {data && (
        <WaReportModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          regionalData={data}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
});

// Single Route Card Subcomponent
interface RouteCardItemProps {
  route: RegionalRouteItem;
  onVerify: () => void;
  onSelectRoute?: (routeCode: string) => void;
}

function RouteCardItem({ route, onVerify, onSelectRoute }: RouteCardItemProps) {
  const isVerified = route.status === 'verified';
  const isSubmitted = route.status === 'submitted';
  const isDraft = route.status === 'draft';
  const isEmpty = route.status === 'empty';

  return (
    <div
      style={{
        background: 'var(--card-bg, rgba(23, 23, 23, 0.85))',
        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
        borderRadius: '16px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Top Section: Code Badge, Name, Operator & Status Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Route Code Badge */}
            <span
              onClick={() => onSelectRoute?.(route.routeCode)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.4px',
                background: 'rgba(62, 207, 142, 0.12)',
                color: 'var(--accent-color, #3ECF8E)',
                border: '1px solid rgba(62, 207, 142, 0.25)',
                cursor: 'pointer',
              }}
              title={TEXT_MONITORING.ROUTE_CARD.OPEN_ROUTE_TITLE}
            >
              {route.routeCode}
            </span>

            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary, #8b8b8b)',
                fontWeight: 600,
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {route.operatorName || '-'}
            </span>
          </div>

          {/* Status Badge */}
          {isVerified && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <CheckCircle2 size={13} />
              {TEXT_MONITORING.ROUTE_CARD.BADGE_VERIFIED}
            </span>
          )}
          {isSubmitted && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <Send size={13} />
              {TEXT_MONITORING.ROUTE_CARD.BADGE_SUBMITTED}
            </span>
          )}
          {isDraft && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <Clock size={13} />
              {TEXT_MONITORING.ROUTE_CARD.BADGE_DRAFT}
            </span>
          )}
          {isEmpty && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary, #8b8b8b)',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <AlertTriangle size={13} />
              {TEXT_MONITORING.ROUTE_CARD.BADGE_EMPTY}
            </span>
          )}
        </div>

        {/* Route Name */}
        <h3
          onClick={() => onSelectRoute?.(route.routeCode)}
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: 'var(--text-primary, #ededed)',
            margin: 0,
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={route.routeName}
        >
          {route.routeName}
        </h3>

        {/* Korlap Info */}
        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #8b8b8b)' }}>
          {TEXT_MONITORING.ROUTE_CARD.KORLAP_PREFIX}{' '}
          <strong style={{ color: 'var(--text-primary, #ededed)', fontWeight: 600 }}>
            {route.supervisorName}
          </strong>
        </div>
      </div>

      {/* Metrics Section: 3-column Box */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          padding: '10px',
          borderRadius: '12px',
          background: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.06))',
          textAlign: 'center',
        }}
      >
        {/* Armada */}
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary, #8b8b8b)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
            {TEXT_MONITORING.ROUTE_CARD.METRIC_ARMADA}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #ededed)', marginTop: '2px' }}>
            {route.totalRealops} / {route.totalRenops}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
            S1:{route.realopsShift1} | S2:{route.realopsShift2}
          </span>
        </div>

        {/* Pelanggan */}
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary, #8b8b8b)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
            {TEXT_MONITORING.ROUTE_CARD.METRIC_PASSENGERS}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-color, #3ECF8E)', marginTop: '2px' }}>
            {formatNumber(route.todayPassengers)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
            S1:{formatNumber(route.totalShift1)} S2:{formatNumber(route.totalShift2)}
          </span>
        </div>

        {/* Total KM */}
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary, #8b8b8b)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
            {TEXT_MONITORING.ROUTE_CARD.METRIC_KM}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {formatDecimal(route.totalKm, 1)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
            {TEXT_MONITORING.ROUTE_CARD.KM_PER_BUS_PREFIX} {formatDecimal(route.achievementKm, 1)}
          </span>
        </div>
      </div>

      {/* Macet & Kendala tags (jika ada) */}
      {(route.trafficJamSpots.length > 0 || route.operationalIssues) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          {route.trafficJamSpots.length > 0 && (
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <strong>{TEXT_MONITORING.ROUTE_CARD.JAM_PREFIX}</strong> {route.trafficJamSpots.join(', ')}
            </div>
          )}
          {route.operationalIssues && (
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                color: 'var(--text-secondary, #8b8b8b)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <strong>{TEXT_MONITORING.ROUTE_CARD.ISSUE_PREFIX}</strong> {route.operationalIssues}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
          borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.06))',
          fontSize: '11px',
        }}
      >
        <span style={{ color: 'var(--text-secondary, #8b8b8b)' }}>
          {TEXT_MONITORING.ROUTE_CARD.HEADWAY_LABEL(route.headwayFastest, route.headwaySlowest)}
        </span>

        {isSubmitted && !isVerified && (
          <button
            type="button"
            onClick={onVerify}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'var(--accent-color, #3ECF8E)',
              color: '#ffffff',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={13} />
            <span>{TEXT_MONITORING.ROUTE_CARD.BTN_VERIFY}</span>
          </button>
        )}
      </div>
    </div>
  );
}
