import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserPlus,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  Mail,
  FileText,
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { UserProfile } from '../types/supabase';
import {
  fetchAllUserProfiles,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  revokeUserProfile,
} from '../services/routeService';
import { RoleBadge } from './RoleBadge';
import { escapeHtml, showSuccessToast, showErrorAlert } from '../utils/alertUtils';

interface UserManagementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserRole: 'superadmin' | 'admin' | 'petugas';
  isDarkMode: boolean;
}

type FilterTab = 'all' | 'superadmin' | 'admin' | 'petugas' | 'inactive';

export const UserManagementSheet: React.FC<UserManagementSheetProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserRole,
  isDarkMode: _isDarkMode,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Swipe-to-dismiss states
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUserProfiles();
      setUsers(data);
    } catch (err) {
      console.error('[UserManagement] Gagal memuat user:', err);
      showErrorAlert('Gagal Memuat Data', 'Tidak dapat memuat daftar pengguna dari server.');
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
    loadUsers();
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

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab === 'superadmin' && u.role !== 'superadmin') return false;
      if (activeTab === 'admin' && u.role !== 'admin') return false;
      if (activeTab === 'petugas' && u.role !== 'petugas') return false;
      if (activeTab === 'inactive' && u.is_active !== false) return false;

      // Role isolation: Admin hanya bisa melihat petugas dan dirinya sendiri
      if (currentUserRole === 'admin') {
        const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
        const isPetugas = u.role === 'petugas';
        if (!isSelf && !isPetugas) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.full_name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchNotes = u.notes?.toLowerCase().includes(q);
        return matchName || matchEmail || matchNotes;
      }

      return true;
    });
  }, [users, activeTab, searchQuery, currentUserRole, currentUserEmail]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: users.length,
      superadmin: users.filter((u) => u.role === 'superadmin').length,
      admin: users.filter((u) => u.role === 'admin').length,
      petugas: users.filter((u) => u.role === 'petugas').length,
      inactive: users.filter((u) => u.is_active === false).length,
      active: users.filter((u) => u.is_active !== false).length,
    };
  }, [users]);

  // Handler: Tambah Pengguna Baru
  const handleOpenAddUser = async () => {
    const isSuper = currentUserRole === 'superadmin';

    const roleOptionsHtml = isSuper
      ? `
        <option value="petugas">Petugas (Operator)</option>
        <option value="admin">Admin (Pengawas)</option>
        <option value="superadmin">Superadmin</option>
      `
      : `<option value="petugas">Petugas (Operator)</option>`;

    const { value: formValues } = await Swal.fire({
      title: 'Tambah Pengguna Baru',
      html: `
        <div style="text-align: left; font-size: 13.5px; display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-primary, #1e293b);">Email Akun Google <span style="color: #ef4444;">*</span></label>
            <input id="swal-email" type="email" placeholder="contoh@gmail.com" class="swal2-input" style="width: 100%; margin: 0; font-size: 13.5px; box-sizing: border-box;" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-primary, #1e293b);">Nama Lengkap / Panggilan <span style="color: #ef4444;">*</span></label>
            <input id="swal-name" type="text" placeholder="Nama Petugas" class="swal2-input" style="width: 100%; margin: 0; font-size: 13.5px; box-sizing: border-box;" />
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-primary, #1e293b);">Peran (Role) <span style="color: #ef4444;">*</span></label>
            <select id="swal-role" class="swal2-input" style="width: 100%; margin: 0; font-size: 13.5px; height: 42px; box-sizing: border-box;">
              ${roleOptionsHtml}
            </select>
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 4px; color: var(--text-primary, #1e293b);">Catatan / Penugasan (Opsional)</label>
            <input id="swal-notes" type="text" placeholder="Misal: Koridor 12 / Shift Siang" class="swal2-input" style="width: 100%; margin: 0; font-size: 13.5px; box-sizing: border-box;" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Daftarkan Akun',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value?.trim();
        const fullName = (document.getElementById('swal-name') as HTMLInputElement)?.value?.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement)?.value as 'superadmin' | 'admin' | 'petugas';
        const notes = (document.getElementById('swal-notes') as HTMLInputElement)?.value?.trim();

        if (!email) {
          Swal.showValidationMessage('Email wajib diisi!');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage('Format email tidak valid!');
          return false;
        }
        if (!fullName) {
          Swal.showValidationMessage('Nama lengkap wajib diisi!');
          return false;
        }

        return { email, fullName, role, notes };
      },
    });

    if (formValues) {
      Swal.showLoading();
      const res = await addUserProfile({
        email: formValues.email,
        full_name: formValues.fullName,
        role: formValues.role,
        notes: formValues.notes,
        created_by: currentUserEmail,
      });

      if (res.success) {
        showSuccessToast(`Akun ${formValues.email} berhasil didaftarkan.`);
        loadUsers();
      } else {
        showErrorAlert('Gagal Mendaftarkan', res.message || 'Terjadi kesalahan saat menambahkan user.');
      }
    }
  };

  // Handler: Toggle Aktif / Nonaktif
  const handleToggleStatus = async (user: UserProfile) => {
    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
    if (isSelf) {
      showErrorAlert('Aksi Ditolak', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    if (currentUserRole === 'admin' && user.role !== 'petugas') {
      showErrorAlert('Akses Dibatasi', 'Admin hanya diizinkan mengubah status akun level Petugas.');
      return;
    }

    const nextStatus = !user.is_active;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';

    const { isConfirmed } = await Swal.fire({
      title: `${nextStatus ? 'Aktifkan' : 'Nonaktifkan'} Akun?`,
      html: `Apakah Anda yakin ingin <b>${actionLabel}</b> akses untuk akun <b>${escapeHtml(user.email)}</b> (${escapeHtml(user.full_name)})?`,
      icon: nextStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Ya, ${nextStatus ? 'Aktifkan' : 'Nonaktifkan'}`,
      cancelButtonText: 'Batal',
      confirmButtonColor: nextStatus ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (isConfirmed) {
      const res = await toggleUserProfileStatus(user.email, nextStatus, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Akun ${user.email} berhasil di${nextStatus ? 'aktifkan' : 'nonaktifkan'}.`);
        setUsers((prev) =>
          prev.map((u) => (u.email === user.email ? { ...u, is_active: nextStatus } : u))
        );
      } else {
        showErrorAlert('Gagal', res.message || 'Gagal mengubah status akun.');
      }
    }
  };

  // Handler: Ubah Role Pengguna
  const handleChangeRole = async (user: UserProfile) => {
    if (currentUserRole !== 'superadmin') {
      showErrorAlert('Akses Dibatasi', 'Hanya Superadmin yang memiliki wewenang mengubah peran pengguna.');
      return;
    }

    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
    const isOnlySuper = counts.superadmin <= 1 && user.role === 'superadmin';

    const { value: newRole } = await Swal.fire({
      title: 'Ubah Peran Pengguna',
      html: `
        <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 12px;">
          Pilih peran baru untuk <b>${escapeHtml(user.full_name)}</b> (${escapeHtml(user.email)}):
        </p>
        <select id="swal-change-role" class="swal2-input" style="width: 100%; margin: 0; font-size: 13.5px; height: 42px; box-sizing: border-box;">
          <option value="petugas" ${user.role === 'petugas' ? 'selected' : ''}>Petugas (Operator)</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin (Pengawas)</option>
          <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>Superadmin</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const val = (document.getElementById('swal-change-role') as HTMLSelectElement)?.value;
        if (isSelf && isOnlySuper && val !== 'superadmin') {
          Swal.showValidationMessage('Anda tidak dapat menurunkan peran Anda karena Anda adalah satu-satunya Superadmin!');
          return false;
        }
        return val as 'superadmin' | 'admin' | 'petugas';
      },
    });

    if (newRole && newRole !== user.role) {
      const res = await updateUserProfileRole(user.email, newRole, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Peran ${user.email} diubah menjadi ${newRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u.email === user.email ? { ...u, role: newRole } : u))
        );
      } else {
        showErrorAlert('Gagal', res.message || 'Gagal mengubah peran.');
      }
    }
  };

  // Handler: Cabut Akses (Revoke/Hapus)
  const handleRevokeUser = async (user: UserProfile) => {
    if (currentUserRole !== 'superadmin') {
      showErrorAlert('Akses Dibatasi', 'Hanya Superadmin yang dapat mencabut akses akun.');
      return;
    }

    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
    if (isSelf) {
      showErrorAlert('Aksi Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Cabut Akses Pengguna?',
      html: `
        <div style="font-size: 13.5px; text-align: left; line-height: 1.5;">
          <p>Apakah Anda yakin ingin <b>mencabut akses</b> untuk:</p>
          <div style="background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.2); margin: 8px 0;">
            <b>${escapeHtml(user.full_name)}</b><br/>
            <span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(user.email)}</span>
          </div>
          <p style="color: #ef4444; font-size: 12px; margin: 0;">⚠️ Akun ini akan dihapus dari whitelist sistem dan tidak bisa login.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Cabut Akses',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (isConfirmed) {
      const res = await revokeUserProfile(user.email, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Akses ${user.email} telah dicabut.`);
        setUsers((prev) => prev.filter((u) => u.email !== user.email));
      } else {
        showErrorAlert('Gagal', res.message || 'Gagal mencabut akses.');
      }
    }
  };

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
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
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
                Manajemen Pengguna
              </h2>
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                {counts.active} aktif dari {counts.all} terdaftar
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleOpenAddUser}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                background: 'var(--accent-color, #10b981)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
            >
              <UserPlus size={15} />
              <span>Tambah</span>
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

        {/* Search & Tabs Controls */}
        <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Search Box */}
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
              placeholder="Cari nama, email, atau catatan..."
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

          {/* Segmented Tabs */}
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
              { id: 'all', label: 'Semua', count: counts.all },
              ...(currentUserRole === 'superadmin'
                ? [
                    { id: 'superadmin', label: 'Superadmin', count: counts.superadmin },
                    { id: 'admin', label: 'Admin', count: counts.admin },
                  ]
                : []),
              { id: 'petugas', label: 'Petugas', count: counts.petugas },
              { id: 'inactive', label: 'Nonaktif', count: counts.inactive },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FilterTab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: activeTab === tab.id ? '1px solid var(--accent-color, #10b981)' : '1px solid var(--card-border, rgba(255,255,255,0.08))',
                  background:
                    activeTab === tab.id
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                  color: activeTab === tab.id ? 'var(--accent-color, #10b981)' : 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: activeTab === tab.id ? 'var(--accent-color, #10b981)' : 'rgba(255,255,255,0.08)',
                    color: activeTab === tab.id ? '#ffffff' : 'inherit',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Card List Area */}
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
              <span style={{ fontSize: '13px' }}>Memuat data pengguna...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                borderRadius: '16px',
                background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
                border: '1px dashed var(--card-border, rgba(255,255,255,0.1))',
              }}
            >
              <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3, color: 'var(--text-secondary)' }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                Tidak ada pengguna ditemukan
              </p>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada pengguna pada kategori ini.'}
              </span>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
              const isActive = user.is_active !== false;

              return (
                <div
                  key={user.email}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: isActive
                      ? 'var(--bg-secondary, rgba(255,255,255,0.03))'
                      : 'rgba(239, 68, 68, 0.04)',
                    border: `1px solid ${
                      isActive
                        ? isSelf
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'var(--card-border, rgba(255,255,255,0.08))'
                        : 'rgba(239, 68, 68, 0.25)'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Top: Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          referrerPolicy="no-referrer"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: `2px solid ${isActive ? '#10b981' : '#ef4444'}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background:
                              user.role === 'superadmin'
                                ? 'linear-gradient(135deg, #8b5cf6, #d97706)'
                                : user.role === 'admin'
                                ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                                : 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '14px',
                            flexShrink: 0,
                          }}
                        >
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--text-primary, #f8fafc)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.full_name}
                          </span>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '6px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#3b82f6',
                              }}
                            >
                              Anda
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary, #94a3b8)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px',
                          }}
                        >
                          <Mail size={11} />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Role & Status Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <RoleBadge role={user.role} size="xs" />
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isActive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle: Notes & Metadata */}
                  {(user.notes || user.created_by || user.last_login_at) && (
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.15)',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      {user.notes && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FileText size={11} style={{ opacity: 0.7 }} />
                          <span style={{ color: 'var(--text-primary, #e2e8f0)' }}>{user.notes}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '10.5px' }}>
                        {user.created_by && <span>Didaftarkan: {user.created_by}</span>}
                        {user.last_login_at && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
                            <Clock size={10} />
                            <span>Login: {new Date(user.last_login_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom: Action Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--card-border, rgba(255,255,255,0.06))',
                      paddingTop: '8px',
                    }}
                  >
                    {/* Toggle Button */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => handleToggleStatus(user)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.4 : 1,
                        background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: isActive ? '#ef4444' : '#10b981',
                      }}
                      title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : undefined}
                    >
                      {isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      <span>{isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>

                    {/* Secondary Actions (Superadmin Only) */}
                    {currentUserRole === 'superadmin' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleChangeRole(user)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Ubah Peran</span>
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRevokeUser(user)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Cabut Akses Akun"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
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
