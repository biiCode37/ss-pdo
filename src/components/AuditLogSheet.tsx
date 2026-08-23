import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
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

interface AuditLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'superadmin' | 'admin' | 'petugas';
  isDarkMode: boolean;
}

type LogCategory = 'all' | 'users' | 'bus_input' | 'system';

export const AuditLogSheet: React.FC<AuditLogSheetProps> = ({
  isOpen,
  onClose,
  currentUserRole: _currentUserRole,
  isDarkMode: _isDarkMode,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<LogCategory>('all');
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Swipe-to-dismiss states
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs({ limit: 120 });
      setLogs(data);
    } catch (err) {
      console.error('[AuditLog] Gagal memuat audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      setDragY(0);
      return;
    }
    loadLogs();
    const frameId = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  // Touch Handlers for Drag Down to Close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop > 0) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 120) {
      handleDismiss();
    } else {
      setDragY(0);
    }
  };

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
        description: `Mengubah peran ${details.target_email} menjadi ${details.new_role}`,
        icon: ShieldCheck,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.15)',
      };
    }
    if (action === 'USER_STATUS_CHANGED') {
      const isAct = details.new_status === 'active';
      return {
        title: isAct ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
        description: `${isAct ? 'Mengaktifkan' : 'Menonaktifkan'} akses akun ${details.target_email}`,
        icon: ToggleLeft,
        color: isAct ? '#10b981' : '#ef4444',
        bg: isAct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      };
    }
    if (action === 'USER_REVOKED') {
      return {
        title: 'Akses Pengguna Dicabut',
        description: `Mencabut akses akun ${details.target_email} dari sistem`,
        icon: Trash2,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
      };
    }
    if (action.includes('BUS_INPUT') || action.includes('SAVE_')) {
      return {
        title: 'Pembaruan Data Operasional',
        description: log.route_code ? `Input data pada rute ${log.route_code}` : 'Pembaruan baris data bus',
        icon: Bus,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
      };
    }
    if (action.includes('SHEET') || action.includes('FORMAT')) {
      return {
        title: 'Tindakan Spreadsheet',
        description: 'Penyelarasan rumus atau format spreadsheet',
        icon: FileSpreadsheet,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.15)',
      };
    }

    return {
      title: action,
      description: typeof details === 'string' ? details : JSON.stringify(details),
      icon: History,
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.15)',
    };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const act = log.action || '';
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

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: isMounted && !isClosing ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: isMounted && !isClosing ? 'blur(6px)' : 'none',
        WebkitBackdropFilter: isMounted && !isClosing ? 'blur(6px)' : 'none',
        transition: 'background 0.3s cubic-bezier(0.32, 0.72, 0, 1), backdrop-filter 0.3s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          margin: '0 auto',
          background: 'var(--bg-primary, #0f172a)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderTop: '1px solid var(--card-border, rgba(255,255,255,0.12))',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform:
            isMounted && !isClosing
              ? `translateY(${dragY}px)`
              : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag Handle */}
        <div
          style={{
            padding: '12px 0 6px',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--text-secondary, #94a3b8)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '8px 20px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #f8fafc)',
                  letterSpacing: '-0.3px',
                }}
              >
                Log Aktivitas & Audit
              </h2>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                {logs.length} catatan tindakan terekam
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={loadLogs}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
              }}
              title="Segarkan Log"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
              border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
            }}
          >
            <Search size={16} style={{ color: 'var(--text-secondary, #94a3b8)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari email pelaku, tindakan, atau rute..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '13px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {[
              { id: 'all', label: 'Semua' },
              { id: 'users', label: 'Manajemen User' },
              { id: 'bus_input', label: 'Input Operasional' },
              { id: 'system', label: 'Sistem' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as LogCategory)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: activeCategory === tab.id ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: activeCategory === tab.id ? '1px solid var(--accent-color, #10b981)' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
                  background:
                    activeCategory === tab.id
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                  color: activeCategory === tab.id ? 'var(--accent-color, #10b981)' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Log List */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 20px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
              <span style={{ fontSize: '13px' }}>Memuat catatan audit...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
                border: '1px dashed var(--card-border, rgba(255,255,255,0.1))',
              }}
            >
              <History size={32} style={{ margin: '0 auto 10px', opacity: 0.3, color: 'var(--text-secondary)' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                Belum ada aktivitas terekam
              </p>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Catatan aktivitas akan muncul otomatis seiring tindakan pengguna di sistem.
              </span>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const formatted = formatAction(log);
              const IconComp = formatted.icon;
              const timeStr = log.created_at
                ? new Date(log.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-';

              return (
                <div
                  key={log.id || `${log.created_at}-${log.user_email}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {/* Action Icon */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: formatted.bg,
                      color: formatted.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <IconComp size={18} />
                  </div>

                  {/* Log Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: 'var(--text-primary, #f8fafc)',
                        }}
                      >
                        {formatted.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary, #94a3b8)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          flexShrink: 0,
                        }}
                      >
                        <Clock size={11} />
                        <span>{timeStr}</span>
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '12px',
                        color: 'var(--text-primary, #e2e8f0)',
                        lineHeight: 1.4,
                      }}
                    >
                      {formatted.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-secondary, #94a3b8)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <User size={11} />
                        <span>{log.user_email}</span>
                      </span>
                      {log.route_code && (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            fontWeight: 600,
                          }}
                        >
                          {log.route_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
