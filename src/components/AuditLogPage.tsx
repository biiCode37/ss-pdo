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
} from 'lucide-react';
import type { ActivityLog } from '../types/supabase';
import { fetchActivityLogs } from '../services/routeService';
import { showErrorAlert } from '../utils/alertUtils';
import { SkeletonBox } from './Skeletons';

interface AuditLogPageProps {
  onBack: () => void;
  currentUserRole?: 'superadmin' | 'admin' | 'petugas';
  isDarkMode?: boolean;
}

type LogCategory = 'all' | 'users' | 'bus_input' | 'system';

interface FormattedActionMeta {
  title: string;
  description: string;
  chips?: string[];
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  categoryTag?: string;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  ritase1: 'Ritase 1',
  ritase2: 'Ritase 2',
  penumpang: 'Penumpang',
  pendapatan: 'Pendapatan',
  keterangan: 'Keterangan',
  manual1: 'Manual S1',
  manual2: 'Manual S2',
  jam1: 'Jam S1',
  jam2: 'Jam S2',
  kmAwal: 'KM Awal',
  kmAkhir: 'KM Akhir',
};

export const AuditLogPage: React.FC<AuditLogPageProps> = ({
  onBack,
  currentUserRole = 'petugas',
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LogCategory>('all');

  // BUG-56: Guard RBAC internal (defense-in-depth)
  useEffect(() => {
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      showErrorAlert('Akses Terbatas', 'Halaman ini hanya dapat diakses oleh Admin atau Superadmin.').then(() => onBack());
    }
  }, [currentUserRole, onBack]);

  const loadLogs = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs({ limit: 150, forceRefresh });
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Helper: Format action to user-friendly human representation
  const formatAction = (log: ActivityLog): FormattedActionMeta => {
    const action = log.action || '';
    const details = (log.details as any) || {};

    if (action === 'LOGIN') {
      const method = details.loginMethod === 'google_gis' ? 'Google OAuth (GIS)' : 'Google Account';
      return {
        title: 'Login Berhasil',
        description: `Autentikasi sesi via ${method}`,
        icon: LogIn,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        categoryTag: 'Sistem',
      };
    }

    if (action === 'LOGOUT') {
      return {
        title: 'Sesi Logout',
        description: 'Pengguna keluar dari aplikasi',
        icon: LogOut,
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.12)',
        categoryTag: 'Sistem',
      };
    }

    if (action === 'USER_ADDED') {
      const roleName = details.assigned_role === 'superadmin' ? 'Superadmin' : details.assigned_role === 'admin' ? 'Admin' : 'Petugas Operasional';
      return {
        title: 'Pengguna Baru Didaftarkan',
        description: `Mendaftarkan ${details.target_email || 'pengguna'} sebagai ${roleName}`,
        chips: details.notes ? [`Catatan: ${details.notes}`] : undefined,
        icon: UserPlus,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        categoryTag: 'Pengguna',
      };
    }

    if (action === 'USER_ROLE_CHANGED') {
      const newRole = details.new_role === 'superadmin' ? 'Superadmin' : details.new_role === 'admin' ? 'Admin' : 'Petugas Operasional';
      return {
        title: 'Perubahan Peran Pengguna',
        description: `Mengubah peran ${details.target_email || 'pengguna'} menjadi ${newRole}`,
        icon: ShieldCheck,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        categoryTag: 'Pengguna',
      };
    }

    if (action === 'USER_STATUS_CHANGED') {
      const isActive = details.new_status === 'active' || details.new_status === true;
      const statusText = isActive ? 'Diaktifkan' : 'Dinonaktifkan';
      return {
        title: `Status Akun ${statusText}`,
        description: `Akun ${details.target_email || 'pengguna'} telah ${statusText.toLowerCase()}`,
        icon: ToggleLeft,
        color: isActive ? '#10b981' : '#ef4444',
        bg: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Pengguna',
      };
    }

    if (action === 'USER_REVOKED') {
      return {
        title: 'Akses Pengguna Dicabut',
        description: `Mencabut akses whitelist dan menonaktifkan akun ${details.target_email || 'pengguna'}`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Pengguna',
      };
    }

    if (action === 'UPDATE_BUS_DATA' || action.includes('BUS') || action.includes('INPUT') || action.includes('SAVE')) {
      const tabDesc = details.tabName ? `Tab: ${details.tabName}` : 'Spreadsheet Operasional';
      const rowDesc = details.rowIndex ? ` · Baris ${details.rowIndex}` : '';
      const chips: string[] = [];

      if (Array.isArray(details.updatedFields) && details.updatedFields.length > 0) {
        details.updatedFields.forEach((f: string) => {
          chips.push(FIELD_LABEL_MAP[f] || f);
        });
      }

      return {
        title: 'Input / Simpan Data Bus',
        description: `${tabDesc}${rowDesc}`,
        chips: chips.length > 0 ? chips : undefined,
        icon: Bus,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        categoryTag: 'Operasional',
      };
    }

    if (action === 'QUEUE_SYNCED' || action.includes('SYNC')) {
      return {
        title: 'Sinkronisasi Antrean Offline',
        description: details.count ? `Menyinkronkan ${details.count} perubahan data lokal ke spreadsheet` : 'Data offline berhasil disinkronkan ke server',
        icon: CloudUpload,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        categoryTag: 'Sinkronisasi',
      };
    }

    if (action === 'DELETE_ROUTE') {
      return {
        title: 'Hapus Rute / Spreadsheet',
        description: `Menghapus konfigurasi rute ${log.route_code || ''} dari sistem`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        categoryTag: 'Konfigurasi',
      };
    }

    if (action.includes('FORMAT') || action.includes('SHEET')) {
      return {
        title: 'Perapian Format Spreadsheet',
        description: `Format spreadsheet diperbarui pada rute ${log.route_code || '-'}`,
        icon: FileSpreadsheet,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.12)',
        categoryTag: 'Format',
      };
    }

    // Generic fallback: format details cleanly without raw JSON braces
    let fallbackDesc = 'Aktivitas sistem tercatat';
    if (typeof details === 'object' && details !== null) {
      const entries = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && typeof v !== 'object')
        .map(([k, v]) => `${k}: ${v}`);
      if (entries.length > 0) {
        fallbackDesc = entries.join(' · ');
      }
    }

    return {
      title: action.replace(/_/g, ' '),
      description: fallbackDesc,
      icon: History,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      categoryTag: 'Sistem',
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = log.action || '';
      if (activeCategory === 'users' && !act.startsWith('USER_')) return false;
      if (activeCategory === 'bus_input' && !act.includes('BUS') && !act.includes('SAVE') && !act.includes('INPUT')) return false;
      if (activeCategory === 'system' && (act.startsWith('USER_') || act.includes('BUS') || act.includes('SAVE') || act.includes('INPUT'))) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUser = log.user_email?.toLowerCase().includes(q);
        const matchAction = log.action?.toLowerCase().includes(q);
        const matchRoute = log.route_code?.toLowerCase().includes(q);
        const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
        return matchUser || matchAction || matchRoute || matchDetails;
      }

      return true;
    });
  }, [logs, activeCategory, searchQuery]);

  // Cegah render konten sensitif untuk role tanpa akses (pending redirect)
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
              { key: 'bus_input', label: 'Input Operasional' },
              { key: 'users', label: 'Pengguna' },
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
              const meta = formatAction(log);
              const IconComp = meta.icon;
              const createdAt = log.created_at ? new Date(log.created_at) : null;

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
