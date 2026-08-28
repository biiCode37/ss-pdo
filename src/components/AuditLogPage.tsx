import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  History,
  Search,
  RefreshCw,
  Clock,
  User,
  UserPlus,
  ShieldCheck,
  ToggleLeft,
  Trash2,
  Bus,
  FileSpreadsheet,
  LogIn,
  LogOut,
  CloudUpload,
  ChevronDown,
  ChevronUp,
  Info,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { ActivityLog, Route } from '../types/supabase';
import { fetchActivityLogs, fetchRoutesWithSheets } from '../services/routeService';
import { showErrorAlert } from '../utils/alertUtils';
import { SkeletonBox } from './Skeletons';

interface AuditLogPageProps {
  onBack: () => void;
  currentUserRole?: 'superadmin' | 'admin' | 'petugas';
  isDarkMode?: boolean;
}

type LogCategory = 'all' | 'bus_input' | 'users' | 'routes' | 'system' | 'sync';

interface FormattedActionMeta {
  title: string;
  description: string;
  chips?: string[];
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  categoryTag?: string;
  detail?: ActivityDetail;
}

interface ActivityDetail {
  before?: Record<string, string>;
  after?: Record<string, string>;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  ritase1: 'Ritase 1',
  ritase2: 'Ritase 2',
  penumpang: 'Penumpang',
  pendapatan: 'Pendapatan',
  keterangan: 'Keterangan',
  manual1: 'Manual S1',
  manual2: 'Manual S2',
  manualShift1: 'Manual S1',
  manualShift2: 'Manual S2',
  jam1: 'Jam S1',
  jam2: 'Jam S2',
  kmAwal: 'KM Awal',
  kmAkhir: 'KM Akhir',
  kmAwal1: 'KM Awal S1',
  kmAkhir1: 'KM Akhir S1',
  kmAwal2: 'KM Awal S2',
  kmAkhir2: 'KM Akhir S2',
  totalKmShift1: 'Total KM S1',
  totalKmShift2: 'Total KM S2',
  toaShift1: 'TOA S1',
  toaShift2: 'TOA S2',
  totalToa: 'Total TOA',
  tripPergi: 'Trip Pergi',
  tripPulang: 'Trip Pulang',
};

const ROLE_LABEL_MAP: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  petugas: 'Petugas Operasional',
};

function formatRoleName(role?: string): string {
  if (!role) return 'Petugas Operasional';
  return ROLE_LABEL_MAP[role] || role;
}

function extractChangedValues(details: any): {
  before: Record<string, string>;
  after: Record<string, string>;
} {
  if (!details || typeof details !== 'object') return { before: {}, after: {} };

  if (details.changedValues && typeof details.changedValues === 'object') {
    const { before = {}, after = {} } = details.changedValues;
    return {
      before: typeof before === 'object' ? (before as Record<string, string>) : {},
      after: typeof after === 'object' ? (after as Record<string, string>) : {},
    };
  }

  if (details.previousValues && details.newValues) {
    return {
      before: typeof details.previousValues === 'object' ? details.previousValues : {},
      after: typeof details.newValues === 'object' ? details.newValues : {},
    };
  }

  return { before: {}, after: {} };
}

function actorName(log: ActivityLog): string {
  const email = log.user_email || '';
  if (!email) return 'Sistem';
  const localPart = email.split('@')[0];
  if (!localPart) return email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function actorNameWithEmail(log: ActivityLog): string {
  const baseName = actorName(log);
  const email = log.user_email || '';
  if (!email || baseName === 'Sistem') return baseName;
  return `${baseName} (${email})`;
}

function unitLabel(details: any): string {
  if (typeof details.unit === 'string' && details.unit.trim()) return details.unit;
  if (typeof details.unitName === 'string' && details.unitName.trim()) return details.unitName;
  if (typeof details.target_email === 'string' && details.target_email.trim()) return details.target_email;
  return 'unit';
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({
  onBack,
  currentUserRole = 'petugas',
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LogCategory>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // Filter state for advanced filtering
  const [filterRoute, setFilterRoute] = useState<string>('');
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // BUG-56: Guard RBAC internal (defense-in-depth)
  useEffect(() => {
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      showErrorAlert('Akses Terbatas', 'Halaman ini hanya dapat diakses oleh Admin atau Superadmin.').then(() => onBack());
    }
  }, [currentUserRole, onBack]);

  const loadLogs = async (
    forceRefresh = false,
    filters?: {
      route?: string;
      year?: number | null;
      month?: number | null;
      day?: number | null;
      from?: string;
      to?: string;
    },
  ) => {
    const activeFilters = filters || {
      route: filterRoute,
      year: filterYear,
      month: filterMonth,
      day: filterDay,
      from: dateFrom,
      to: dateTo,
    };
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs({
        limit: 150,
        forceRefresh,
        routeCode: activeFilters.route || undefined,
        periodYear: activeFilters.year ?? undefined,
        periodMonth: activeFilters.month ?? undefined,
        periodDay: activeFilters.day ?? undefined,
        dateFrom: activeFilters.from ? `${activeFilters.from}T00:00:00` : undefined,
        dateTo: activeFilters.to ? `${activeFilters.to}T23:59:59.999` : undefined,
      });
      setLogs(data);
    } catch (err: any) {
      console.error('[AuditLog] Gagal memuat audit logs:', err);
      showErrorAlert(
        'Gagal Memuat Log',
        err?.message ||
          'Tidak dapat memuat riwayat aktivitas dari server. Periksa koneksi internet Anda.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(false);
    fetchRoutesWithSheets().then(setAvailableRoutes).catch(() => setAvailableRoutes([]));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleApplyFilters = () => {
    loadLogs(true);
  };

  const handleResetFilters = () => {
    setFilterRoute('');
    setFilterYear(null);
    setFilterMonth(null);
    setFilterDay(null);
    setDateFrom('');
    setDateTo('');
    loadLogs(true, {});
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    availableRoutes.forEach((route) => {
      route.route_sheets?.forEach((sheet) => years.add(sheet.year));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [availableRoutes]);

  // Helper: Format action to user-friendly human representation
  // Memoized to prevent unnecessary re-renders when dependency array updates
  const formatAction = (log: ActivityLog): FormattedActionMeta => {
    const action = log.action || '';
    const details = (log.details as any) || {};
    const name = actorName(log);
    const { before, after } = extractChangedValues(details);

    if (action === 'LOGIN') {
      const via = details.loginMethod === 'google_gis' ? 'Google' : 'Google';
      return {
        title: `${name} masuk ke aplikasi`,
        description: `Login berhasil melalui akun ${via}.`,
        icon: LogIn,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        categoryTag: 'Login',
      };
    }

    if (action === 'LOGOUT') {
      return {
        title: `${name} keluar dari aplikasi`,
        description: 'Sesi berakhir dan token akses dicabut.',
        icon: LogOut,
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.12)',
        categoryTag: 'Login',
      };
    }

    if (action === 'USER_ADDED') {
      const targetEmail = details.target_email || 'pengguna baru';
      const targetName = details.target_name ? ` (${details.target_name})` : '';
      const role = formatRoleName(details.assigned_role);
      return {
        title: `${name} mendaftarkan pengguna baru`,
        description: `${targetEmail}${targetName} ditambahkan sebagai ${role}.`,
        chips: details.notes ? [`Catatan: ${details.notes}`] : undefined,
        icon: UserPlus,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        categoryTag: 'Pengguna',
      };
    }

    if (action === 'USER_ROLE_CHANGED') {
      const targetEmail = details.target_email || 'pengguna';
      const oldRole = formatRoleName(details.old_role);
      const newRole = formatRoleName(details.new_role);
      return {
        title: `${name} mengubah peran pengguna`,
        description: `${targetEmail}: ${oldRole} → ${newRole}.`,
        icon: ShieldCheck,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        categoryTag: 'Pengguna',
        detail: { before: { 'Peran': oldRole }, after: { 'Peran': newRole } },
      };
    }

    if (action === 'USER_STATUS_CHANGED') {
      const isActive = details.new_status === 'active' || details.new_status === true;
      const targetEmail = details.target_email || 'pengguna';
      const statusWord = isActive ? 'diaktifkan' : 'dinonaktifkan';
      return {
        title: `${name} ${statusWord} akun pengguna`,
        description: `Akun ${targetEmail} kini ${isActive ? 'dapat' : 'tidak dapat'} login ke aplikasi.`,
        icon: ToggleLeft,
        color: isActive ? '#10b981' : '#ef4444',
        bg: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Pengguna',
        detail: {
          before: { 'Status Akun': isActive ? 'Nonaktif' : 'Aktif' },
          after: { 'Status Akun': isActive ? 'Aktif' : 'Nonaktif' },
        },
      };
    }

    if (action === 'USER_REVOKED') {
      const targetEmail = details.target_email || 'pengguna';
      return {
        title: `${name} mencabut akses pengguna`,
        description: `Akun ${targetEmail} dihapus dari daftar pengguna yang diizinkan.`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Pengguna',
        detail: {
          before: { 'Status Akun': 'Aktif' },
          after: { 'Status Akun': 'Dicabut (Nonaktif)' },
        },
      };
    }

    if (action === 'CREATE_ROUTE') {
      const routeCode = details.route_code || log.route_code || 'rute baru';
      const monthName = MONTH_NAMES_ID[Number(details.month)] || '';
      const period = monthName ? `${monthName} ${details.year}` : `${details.year}`;
      return {
        title: `${name} menambahkan rute baru`,
        description: `Rute ${routeCode} didaftarkan untuk periode ${period}.`,
        icon: FileSpreadsheet,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        categoryTag: 'Rute',
      };
    }

    if (action === 'DELETE_ROUTE') {
      const routeCode = log.route_code || 'rute';
      return {
        title: `${name} menghapus rute`,
        description: `Rute ${routeCode} beserta sheet operasionalnya dihapus dari sistem.`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Rute',
      };
    }

    if (action === 'UPDATE_BUS_DATA' || action === 'UPDATE_BULK_BUS_DATA') {
      const isBulk = action === 'UPDATE_BULK_BUS_DATA';
      const unitCount = isBulk && typeof details.unitCount === 'number' ? details.unitCount : null;
      const updatedFields: string[] = Array.isArray(details.updatedFields) ? details.updatedFields : [];
      const fieldLabels = updatedFields
        .map((f) => FIELD_LABEL_MAP[f] || f)
        .filter(Boolean);
      const uniqueLabels = Array.from(new Set(fieldLabels));

      const baseTitle = isBulk
        ? `${name} memperbarui ${unitCount ?? 'beberapa'} unit bus sekaligus`
        : `${name} memperbarui data bus`;
      const baseDesc = isBulk
        ? `Pembaruan massal untuk ${unitCount ?? 'beberapa'} unit bus.`
        : 'Data operasional satu unit bus diperbarui.';

      return {
        title: baseTitle,
        description: baseDesc,
        chips: uniqueLabels.length > 0 ? uniqueLabels : undefined,
        icon: Bus,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        categoryTag: 'Data Bus',
        detail: Object.keys(before).length > 0 || Object.keys(after).length > 0
          ? { before, after }
          : undefined,
      };
    }

    if (action === 'SYNC_OFFLINE_QUEUE') {
      const target = unitLabel(details);
      const unitInfo = details.rowIndex ? ` pada ${target}` : '';
      return {
        title: `${name} menyinkronkan perubahan ke spreadsheet`,
        description: `Perubahan data${unitInfo} yang sebelumnya tertunda berhasil dikirim ke Google Sheets.`,
        icon: CloudUpload,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        categoryTag: 'Sinkronisasi',
      };
    }

    if (action === 'FORMAT_WHOLE_SHEET' || action.includes('FORMAT')) {
      const routeCode = log.route_code || 'rute';
      const busCount = details.busCount;
      const busInfo = typeof busCount === 'number' ? ` untuk ${busCount} unit bus` : '';
      return {
        title: `${name} merapikan tampilan spreadsheet`,
        description: `Format rute ${routeCode}${busInfo} diperbarui agar lebih mudah dibaca.`,
        icon: FileSpreadsheet,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
        categoryTag: 'Rute',
      };
    }

    return {
      title: `${name} melakukan aktivitas`,
      description: `Aktivitas ${action.replace(/_/g, ' ')} tercatat di sistem.`,
      icon: History,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      categoryTag: 'Sistem',
    };
  };

  const MONTH_NAMES_ID = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = log.action || '';
      const routeMatch = !!log.route_code || act === 'CREATE_ROUTE' || act === 'DELETE_ROUTE' || act === 'FORMAT_WHOLE_SHEET' || act.includes('FORMAT');
      const isUserAct = act.startsWith('USER_');
      const isBusAct = act === 'UPDATE_BUS_DATA' || act === 'UPDATE_BULK_BUS_DATA';
      const isSyncAct = act === 'SYNC_OFFLINE_QUEUE' || act.includes('SYNC');
      const isLoginAct = act === 'LOGIN' || act === 'LOGOUT';

      if (activeCategory === 'users' && !isUserAct) return false;
      if (activeCategory === 'bus_input' && !isBusAct) return false;
      if (activeCategory === 'routes' && !(act === 'CREATE_ROUTE' || act === 'DELETE_ROUTE' || act.includes('FORMAT'))) return false;
      if (activeCategory === 'sync' && !isSyncAct) return false;
      if (activeCategory === 'system' && (isUserAct || isBusAct || isSyncAct || isLoginAct || routeMatch)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const meta = formatAction(log);
        const name = actorNameWithEmail(log).toLowerCase();
        const matchUser = log.user_email?.toLowerCase().includes(q);
        const matchName = name.includes(q);
        const matchTitle = meta.title.toLowerCase().includes(q);
        const matchDesc = meta.description.toLowerCase().includes(q);
        const matchRoute = log.route_code?.toLowerCase().includes(q);
        return matchUser || matchName || matchTitle || matchDesc || matchRoute;
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery]);

  // Cegah render konten sensitif untuk role tanpa akses (pending redirect)
  const formatActionMemo = useMemo(() => formatAction, []);
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAuthorized = currentUserRole === 'superadmin' || currentUserRole === 'admin';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!isAuthorized ? null : (
      <>
      {/* Sticky Top Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--card-bg, rgba(15, 23, 42, 0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={onBack}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 11px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: '1px solid var(--card-border, rgba(255,255,255,0.15))',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary, #f8fafc)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Kembali</span>
            </button>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <History size={18} className="text-amber-500" style={{ flexShrink: 0 }} />
                <span>Log Aktivitas & Audit</span>
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--text-secondary, #94a3b8)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {filteredLogs.length} riwayat tercatat
              </p>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              onClick={() => loadLogs(true)}
              disabled={isLoading}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Muat Ulang Riwayat Log"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Search & Tabs Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary, #94a3b8)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas, user, atau rute..."
              style={{
                width: '100%',
                padding: '9px 13px 9px 38px',
                borderRadius: '12px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'var(--card-bg, rgba(30, 41, 59, 0.6))',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{
              border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
              borderRadius: '12px',
              background: 'var(--card-bg, rgba(30, 41, 59, 0.6))',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setIsFilterOpen((open) => !open)}
              aria-expanded={isFilterOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary, #f8fafc)',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={15} />
                Filter rute dan waktu
              </span>
              {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isFilterOpen && (
              <div
                style={{
                  padding: '0 12px 12px',
                  display: 'grid',
                  gap: '10px',
                  borderTop: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                }}
              >
                <label style={{ display: 'grid', gap: '5px', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                  Rute
                  <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="input-field">
                    <option value="">Semua rute</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.route_code}>{route.route_code} — {route.route_name}</option>
                    ))}
                  </select>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Tahun operasional
                    <select value={filterYear ?? ''} onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : null)} className="input-field">
                      <option value="">Semua</option>
                      {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Bulan
                    <select value={filterMonth ?? ''} onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : null)} className="input-field">
                      <option value="">Semua</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Tanggal
                    <select value={filterDay ?? ''} onChange={(e) => setFilterDay(e.target.value ? Number(e.target.value) : null)} className="input-field">
                      <option value="">Semua</option>
                      {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Aksi dari tanggal
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
                  </label>
                  <label style={{ display: 'grid', gap: '5px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                    Aksi sampai tanggal
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleResetFilters} disabled={isLoading} className="btn btn-outline" style={{ padding: '7px 10px', fontSize: '12px' }}>
                    <X size={14} /> Reset
                  </button>
                  <button type="button" onClick={handleApplyFilters} disabled={isLoading} className="btn" style={{ padding: '7px 10px', fontSize: '12px' }}>
                    <SlidersHorizontal size={14} /> Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Segmented Category Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { key: 'all', label: 'Semua' },
              { key: 'bus_input', label: 'Data Bus' },
              { key: 'users', label: 'Pengguna' },
              { key: 'routes', label: 'Rute' },
              { key: 'sync', label: 'Sinkronisasi' },
              { key: 'system', label: 'Sistem' },
            ].map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key as LogCategory)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 600 : 500,
                    border: '1px solid',
                    borderColor: isActive
                      ? '#f59e0b'
                      : 'var(--card-border, rgba(255,255,255,0.08))',
                    background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#fbbf24' : 'var(--text-secondary, #94a3b8)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Log List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="glass"
                style={{
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                }}
              >
                <SkeletonBox width="40px" height="40px" borderRadius="12px" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <SkeletonBox width="180px" height="16px" borderRadius="6px" />
                    <SkeletonBox width="90px" height="12px" borderRadius="4px" />
                  </div>
                  <SkeletonBox width="90%" height="13px" borderRadius="4px" />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <SkeletonBox width="130px" height="12px" borderRadius="4px" />
                    <SkeletonBox width="60px" height="16px" borderRadius="6px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--card-bg, rgba(30, 41, 59, 0.4))',
              borderRadius: '16px',
              border: '1px dashed var(--card-border, rgba(255,255,255,0.12))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <History size={36} style={{ color: 'var(--text-secondary, #64748b)', opacity: 0.5 }} />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary, #f8fafc)' }}>
              Tidak ada catatan aktivitas
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary, #94a3b8)', maxWidth: '300px' }}>
              {searchQuery
                ? 'Tidak ada log yang cocok dengan kata kunci pencarian.'
                : 'Belum ada aktivitas tercatat pada kategori ini.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLogs.map((log) => {
        const meta = formatActionMemo(log);
              const IconComp = meta.icon;
              const createdAt = log.created_at ? new Date(log.created_at) : null;
              const isExpanded = expandedIds.has(log.id ?? 0);
              const beforeEntries = Object.entries(meta.detail?.before || {});
              const afterEntries = Object.entries(meta.detail?.after || {});
              const hasDetail = beforeEntries.length > 0 || afterEntries.length > 0;

              return (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--card-bg, rgba(30, 41, 59, 0.7))',
                    border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                    borderRadius: '14px',
                    padding: '13px 15px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Action Icon */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={18} />
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: 'var(--text-primary, #f8fafc)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {meta.title}
                        </span>
                        {meta.categoryTag && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '5px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary, #94a3b8)',
                              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                            }}
                          >
                            {meta.categoryTag}
                          </span>
                        )}
                      </div>

                      {createdAt && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: 'var(--text-secondary, #64748b)',
                          }}
                        >
                          <Clock size={11} />
                          <span>
                            {createdAt.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <p
                      style={{
                        margin: '4px 0 6px',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        lineHeight: 1.4,
                      }}
                    >
                      {meta.description}
                    </p>

                    {/* Field Chips (if updatedFields present) */}
                    {meta.chips && meta.chips.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          margin: '4px 0 8px',
                        }}
                      >
                        {meta.chips.map((chip, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 500,
                              padding: '1px 7px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#93c5fd',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpand(log.id ?? 0)}
                      aria-expanded={isExpanded}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        margin: meta.chips && meta.chips.length > 0 ? '0 0 8px' : '2px 0 8px',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-color, #38bdf8)',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: 600,
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Tutup detail' : 'Lihat detail'}
                    </button>

                    {isExpanded && (
                      <div
                        style={{
                          marginBottom: '10px',
                          padding: '10px',
                          borderRadius: '10px',
                          background: 'rgba(148, 163, 184, 0.08)',
                          border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                        }}
                      >
                        {hasDetail ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: '5px' }}>SEBELUM</div>
                              {beforeEntries.map(([field, value]) => (
                                <div key={field} style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                                  <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{FIELD_LABEL_MAP[field] || field}: </span>
                                  <span>{value === '' ? 'Kosong' : String(value)}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--success-color, #22c55e)', marginBottom: '5px' }}>SESUDAH</div>
                              {afterEntries.map(([field, value]) => (
                                <div key={field} style={{ fontSize: '11.5px', lineHeight: 1.5 }}>
                                  <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{FIELD_LABEL_MAP[field] || field}: </span>
                                  <span>{value === '' ? 'Kosong' : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary, #94a3b8)' }}>
                            <Info size={14} />
                            Nilai sebelum dan sesudah belum tersedia untuk riwayat lama.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / User tag */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #64748b)',
                        flexWrap: 'wrap',
                        marginTop: meta.chips && meta.chips.length > 0 ? '0' : '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        <span style={{ color: 'var(--text-primary, #cbd5e1)' }}>
                          {log.user_email || 'Sistem / Anonim'}
                        </span>
                      </div>

                      {log.route_code && (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            fontWeight: 600,
                            fontSize: '11px',
                          }}
                        >
                          {log.route_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      </>
      )}
    </div>
  );
};
