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
  SUPERVISORS,
  type RegionalMonitoringResult,
  type RegionalRouteItem
} from '../services/allRouteMonitoringService';
import { verifyDailyRouteReport } from '../services/dailyRouteReportService';
import { WaReportModal } from './WaReportModal';
import { showSuccessToast, showErrorAlert } from '../utils/alertUtils';

interface Props {
  onBackToRouteView?: () => void;
  onSelectRoute?: (routeCode: string) => void;
  currentDate?: string;
  onDateChange?: (newDate: string) => void;
  currentUserEmail?: string;
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
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('ALL');

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
      setErrorMessage(
        'Gagal memuat data monitoring wilayah. Silakan periksa koneksi internet Anda dan coba lagi.'
      );
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
      showSuccessToast('Laporan rute berhasil diverifikasi!');
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
      showErrorAlert('Gagal', 'Terjadi kesalahan saat memverifikasi laporan.');
    }
  };

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    if (!data) return [];
    if (selectedSupervisor === 'ALL') return data.routes;
    return data.routes.filter(r => r.supervisorName === selectedSupervisor);
  }, [data, selectedSupervisor]);

  const overallArmadaPct = useMemo(() => {
    if (!data || data.totalRenops === 0) return 0;
    return (data.totalRealops / data.totalRenops) * 100;
  }, [data]);

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-2">
            {onBackToRouteView && (
              <button
                onClick={onBackToRouteView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Kembali ke Operasi Rute Tunggal"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Operasi Rute</span>
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Monitoring Wilayah Utara
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dashboard All Route & Rekapitulasi Harian Transjakarta
              </p>
            </div>
          </div>

          {/* Date Selector & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Date Navigator */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleStepDate(-1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <label className="relative flex items-center gap-1.5 px-2.5 py-1 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{formatIndonesianDateLabel(selectedDate)}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateInputChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>

              <button
                onClick={() => handleStepDate(1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Buat Laporan WA Button */}
            <button
              onClick={() => setIsWaModalOpen(true)}
              disabled={!data || loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Buat Laporan WA</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMessage && (
          <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
              Gagal Memuat Data
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {errorMessage}
            </p>
            <button
              onClick={() => loadData(false)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && !errorMessage && data && (
          <>
            {/* Readiness Progress Banner */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600 dark:text-slate-400">
                  Status Kelengkapan Laporan PDO Wilayah:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {data.submittedCount} / {data.totalRoutesCount} Rute Siap (
                  {Math.round((data.submittedCount / (data.totalRoutesCount || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (data.submittedCount / (data.totalRoutesCount || 1)) * 100
                    )}%`
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Terverifikasi: <strong>{data.verifiedCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Submitted: <strong>{data.submittedCount - data.verifiedCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Draft: <strong>{data.draftCount}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Belum Diisi: <strong>{data.emptyCount}</strong>
                </span>
              </div>
            </section>

            {/* Regional KPI Cards Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Armada Beroperasi */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Armada Wilayah
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {data.totalRealops} / {data.totalRenops}
                  <span className="text-xs font-normal text-slate-500 ml-1">bus</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatDecimal(overallArmadaPct, 1)}% Armada
                  </span>
                  <span className="text-[11px] text-slate-400">
                    S1: {data.totalRealops} | S2: {data.totalRealops}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Pelanggan */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Pelanggan
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(data.totalTodayPassengers)}
                  <span className="text-xs font-normal text-slate-500 ml-1">org</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
                  <span>S1: {formatNumber(data.totalShift1)}</span>
                  <span>S2: {formatNumber(data.totalShift2)}</span>
                </div>
              </div>

              {/* Card 3: Total KM Tempuh */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Jarak Tempuh
                </span>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDecimal(data.totalKm, 1)}
                  <span className="text-xs font-normal text-slate-500 ml-1">km</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
                  <span>Rerata / Bus:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatDecimal(data.averageKmPerBus, 1)} km
                  </span>
                </div>
              </div>

              {/* Card 4: Distribusi Shift */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Distribusi Shift
                </span>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Shift 1:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatNumber(data.totalShift1)} ({formatDecimal((data.totalShift1 / (data.totalTodayPassengers || 1)) * 100, 0)}%)
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between pt-0.5">
                  <span>Shift 2:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatNumber(data.totalShift2)} ({formatDecimal((data.totalShift2 / (data.totalTodayPassengers || 1)) * 100, 0)}%)
                  </span>
                </div>
              </div>
            </section>

            {/* Korlap Filter Tabs */}
            <section className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedSupervisor('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSupervisor === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                Semua Rute ({data.routes.length})
              </button>

              {SUPERVISORS.map((spv: string) => {
                const count = data.routes.filter(r => r.supervisorName === spv).length;
                return (
                  <button
                    key={spv}
                    onClick={() => setSelectedSupervisor(spv)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedSupervisor === spv
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {spv} ({count})
                  </button>
                );
              })}
            </section>

            {/* Route Cards Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3">
      {/* Top Header: Code, Name, Operator & Status Badge */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              onClick={() => onSelectRoute?.(route.routeCode)}
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold tracking-wide cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              {route.routeCode}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
              {route.operatorName || '-'}
            </span>
          </div>

          {/* Status Badge */}
          {isVerified && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
          {isSubmitted && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-md text-[11px] font-semibold">
              <Send className="w-3 h-3" />
              Submitted
            </span>
          )}
          {isDraft && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-md text-[11px] font-semibold">
              <Clock className="w-3 h-3" />
              Draft
            </span>
          )}
          {isEmpty && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md text-[11px] font-medium">
              <AlertTriangle className="w-3 h-3 text-slate-400" />
              Belum Diisi
            </span>
          )}
        </div>

        {/* Route Name */}
        <h3
          onClick={() => onSelectRoute?.(route.routeCode)}
          className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          title={route.routeName}
        >
          {route.routeName}
        </h3>

        {/* Korlap name */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Korlap: <span className="font-medium text-slate-600 dark:text-slate-300">{route.supervisorName}</span>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
        {/* Realops / Renops */}
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">Armada</span>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {route.totalRealops} / {route.totalRenops}
          </div>
          <span className="text-[10px] text-slate-500">
            S1:{route.realopsShift1} | S2:{route.realopsShift2}
          </span>
        </div>

        {/* Pelanggan */}
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">Pelanggan</span>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatNumber(route.todayPassengers)}
          </div>
          <span className="text-[10px] text-slate-500">
            S1:{route.totalShift1} S2:{route.totalShift2}
          </span>
        </div>

        {/* Total KM */}
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">KM Tempuh</span>
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {formatDecimal(route.totalKm, 1)}
          </div>
          <span className="text-[10px] text-slate-500">
            KM/B: {formatDecimal(route.achievementKm, 1)}
          </span>
        </div>
      </div>

      {/* Traffic Jam & Issues Highlights */}
      {(route.trafficJamSpots.length > 0 || route.operationalIssues) && (
        <div className="space-y-1 text-[11px]">
          {route.trafficJamSpots.length > 0 && (
            <div className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md line-clamp-1">
              <strong>Macet:</strong> {route.trafficJamSpots.join(', ')}
            </div>
          )}
          {route.operationalIssues && (
            <div className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md line-clamp-1">
              <strong>Kendala:</strong> {route.operationalIssues}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400">
          Headway: {route.headwayFastest} - {route.headwaySlowest} mnt
        </span>

        {isSubmitted && !isVerified && (
          <button
            onClick={onVerify}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verifikasi</span>
          </button>
        )}
      </div>
    </div>
  );
}
