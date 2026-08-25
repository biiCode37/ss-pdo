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
} from 'lucide-react';
import type { ActivityLog } from '../types/supabase';
import { fetchActivityLogs } from '../services/routeService';
import { showErrorAlert } from '../utils/alertUtils';

interface AuditLogPageProps {
  onBack: () => void;
  currentUserRole?: 'superadmin' | 'admin' | 'petugas';
  isDarkMode?: boolean;
}

type LogCategory = 'all' | 'users' | 'bus_input' | 'system';

export const AuditLogPage: React.FC<AuditLogPageProps> = ({
  onBack,
  currentUserRole = 'petugas',
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LogCategory>('all');

  // BUG-56: Guard RBAC internal (defense-in-depth) — halaman audit hanya
  // untuk admin/superadmin; jangan bergantung pada gating parent saja.
  useEffect(() => {
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      showErrorAlert('Akses Terbatas', 'Halaman ini hanya dapat diakses oleh Admin atau Superadmin.').then(() => onBack());
    }
  }, [currentUserRole, onBack]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs({ limit: 150 });
      setLogs(data);
    } catch (err: any) {
      console.error('[AuditLog] Gagal memuat audit logs:', err);
      // BUG-64: Tampilkan error — sebelumnya hanya console.error sehingga
      // halaman terlihat "kosong" padahal sebenarnya gagal dimuat.
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
    loadLogs();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Helper: Format action to user-friendly representation
  const formatAction = (log: ActivityLog) => {
    const action = log.action || '';
    const details = (log.details as any) || {};

    if (action === 'USER_ADDED') {
      return {
        title: 'Pengguna Baru Ditambahkan',
        description: `Mendaftarkan ${details.target_email || 'pengguna'} sebagai peran ${details.assigned_role || 'petugas'}`,
        icon: UserPlus,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
      };
    }
    if (action === 'USER_ROLE_CHANGED') {
      return {
        title: 'Perubahan Peran Pengguna',
        description: `Mengubah peran ${details.target_email || 'pengguna'} menjadi ${details.new_role || ''}`,
        icon: ShieldCheck,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
      };
    }
    if (action === 'USER_STATUS_CHANGED') {
      const statusText = details.new_status ? 'Diaktifkan' : 'Dinonaktifkan';
      return {
        title: `Status Akun ${statusText}`,
        description: `Mengubah status akun ${details.target_email || 'pengguna'} menjadi ${statusText.toLowerCase()}`,
        icon: ToggleLeft,
        color: details.new_status ? '#10b981' : '#ef4444',
        bg: details.new_status ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      };
    }
    if (action === 'USER_REVOKED') {
      return {
        title: 'Akses Pengguna Dicabut',
        description: `Menghapus akses login untuk akun ${details.target_email || 'pengguna'}`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
      };
    }
    if (action.includes('BUS') || action.includes('INPUT') || action.includes('SAVE')) {
      return {
        title: 'Input / Simpan Data Bus',
        description: `${action} pada rute ${log.route_code || '-'}`,
        icon: Bus,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.15)',
      };
    }
    if (action.includes('FORMAT') || action.includes('SHEET')) {
      return {
        title: 'Perapian Format Spreadsheet',
        description: `Format spreadsheet diterapkan pada rute ${log.route_code || '-'}`,
        icon: FileSpreadsheet,
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.15)',
      };
    }

    return {
      title: action,
      description: JSON.stringify(details),
      icon: History,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.15)',
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {      const act = log.action || '';
      if (activeCategory === 'users' && !act.startsWith('USER_')) return false;
      if (activeCategory === 'bus_input' && !act.includes('BUS') && !act.includes('SAVE') && !act.includes('INPUT')) return false;
      if (activeCategory === 'system' && (act.startsWith('USER_') || act.includes('BUS'))) return false;

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
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onBack}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 600,
                border: '1px solid var(--card-border, rgba(255,255,255,0.15))',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary, #f8fafc)',
                cursor: 'pointer',
              }}
              title="Kembali ke Dashboard"
            >
              <ArrowLeft size={17} />
              <span>Kembali</span>
            </button>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <History size={19} className="text-amber-500" />
                Log Aktivitas & Audit
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                {filteredLogs.length} riwayat aktivitas tercatat
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Muat Ulang Riwayat Log"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Muat Ulang</span>
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
          gap: '16px',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Search & Tabs Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
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
              size={17}
              style={{
                position: 'absolute',
                left: '14px',
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
                padding: '10px 14px 10px 40px',
                borderRadius: '12px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'var(--card-bg, rgba(30, 41, 59, 0.6))',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '13.5px',
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
              { key: 'all', label: 'Semua Aktivitas' },
              { key: 'users', label: 'Manajemen Pengguna' },
              { key: 'bus_input', label: 'Input Operasional' },
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Log List */}
        {isLoading ? (
          <div
            style={{
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            <RefreshCw size={28} className="animate-spin text-amber-500" />
            <span style={{ fontSize: '13.5px' }}>Memuat catatan audit...</span>
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
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  {/* Action Icon */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={20} />
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: 'var(--text-primary, #f8fafc)',
                        }}
                      >
                        {meta.title}
                      </span>

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
                        margin: '4px 0 8px',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        lineHeight: 1.4,
                      }}
                    >
                      {meta.description}
                    </p>

                    {/* Footer / User tag */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #64748b)',
                        flexWrap: 'wrap',
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
