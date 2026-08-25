import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Search,
  Users,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { UserProfile } from '../types/supabase';
import {
  fetchAllUserProfiles,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  upsertUserProfile,
} from '../services/routeService';
import { fetchGoogleUserProfile } from '../services/googleSheets/auth';
import { RoleBadge } from './RoleBadge';
import { escapeHtml, showSuccessToast, showErrorAlert, pdoSwal } from '../utils/alertUtils';

interface UserManagementPageProps {
  onBack: () => void;
  currentUserEmail: string;
  currentUserRole: 'superadmin' | 'admin' | 'petugas';
  isDarkMode?: boolean;
}

type FilterTab = 'all' | 'superadmin' | 'admin' | 'petugas' | 'inactive';

const UserCardAvatar: React.FC<{
  user: UserProfile;
  isSelf: boolean;
}> = ({ user, isSelf }) => {
  const [imgError, setImgError] = useState(false);
  const effectiveAvatar =
    user.avatar_url ||
    (isSelf ? localStorage.getItem('PDO_USER_AVATAR') || undefined : undefined);

  if (effectiveAvatar && !imgError) {
    return (
      <img
        src={effectiveAvatar}
        alt={user.full_name || user.email}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          objectFit: 'cover',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.15))',
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = (user.full_name || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        color: '#60a5fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '15px',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onBack,
  currentUserEmail,
  currentUserRole,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUserProfiles();
      const cachedAvatar = localStorage.getItem('PDO_USER_AVATAR');
      const enrichedData = data.map((u) => {
        if (
          u.email.toLowerCase() === currentUserEmail.toLowerCase() &&
          !u.avatar_url &&
          cachedAvatar
        ) {
          return { ...u, avatar_url: cachedAvatar };
        }
        return u;
      });
      setUsers(enrichedData);
    } catch (err) {
      console.error('[UserManagement] Gagal memuat user:', err);
      showErrorAlert('Gagal Memuat Data', 'Tidak dapat memuat daftar pengguna dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Sync avatar from Google if missing
    if (!localStorage.getItem('PDO_USER_AVATAR')) {
      fetchGoogleUserProfile().then((info) => {
        if (info && info.picture) {
          localStorage.setItem('PDO_USER_AVATAR', info.picture);
          upsertUserProfile({
            email: currentUserEmail,
            full_name: info.name || currentUserEmail,
            avatar_url: info.picture,
          }).catch(() => {});
          setUsers((prev) =>
            prev.map((u) =>
              u.email.toLowerCase() === currentUserEmail.toLowerCase()
                ? { ...u, avatar_url: info.picture }
                : u
            )
          );
        }
      }).catch(() => {});
    }
  }, []);

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

  // Tab count metrics
  const counts = useMemo(() => {
    let base = users;
    if (currentUserRole === 'admin') {
      base = users.filter(
        (u) => u.email.toLowerCase() === currentUserEmail.toLowerCase() || u.role === 'petugas'
      );
    }
    return {
      all: base.length,
      superadmin: base.filter((u) => u.role === 'superadmin').length,
      admin: base.filter((u) => u.role === 'admin').length,
      petugas: base.filter((u) => u.role === 'petugas').length,
      inactive: base.filter((u) => u.is_active === false).length,
      active: base.filter((u) => u.is_active !== false).length,
    };
  }, [users, currentUserRole, currentUserEmail]);

  // Handle Add User Modal
  const handleOpenAddUserModal = async () => {
    // BUG-55: Guard RBAC internal — sebelumnya hanya mengandalkan gating di
    // parent; role localStorage rusak/stale bisa membuka UI tambah user.
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      showErrorAlert('Akses Terbatas', 'Hanya Admin atau Superadmin yang berwenang menambahkan pengguna.');
      return;
    }

    const isSuper = currentUserRole === 'superadmin';
    const roleOptionsHtml = isSuper
      ? `
        <option value="petugas">Petugas Operasional (Input Data Saja)</option>
        <option value="admin">Admin (Kelola Petugas & Rute)</option>
        <option value="superadmin">Superadmin (Kuasa Penuh)</option>
      `
      : `
        <option value="petugas">Petugas Operasional (Input Data Saja)</option>
      `;

    const { value: formValues } = await pdoSwal.fire({
      title: 'Tambah Pengguna Baru',
      html: `
        <div style="text-align:left;font-size:13px;display:flex;flex-direction:column;gap:14px;margin-top:6px;">
          <div>
            <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">Email Akun Google <span style="color:#ef4444">*</span></label>
            <input id="swal-email" type="email" placeholder="contoh@gmail.com" class="pdo-swal-input" />
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">Nama Lengkap</label>
            <input id="swal-name" type="text" placeholder="Nama Petugas / Pengawas" class="pdo-swal-input" />
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">Peran / Hak Akses</label>
            <select id="swal-role" class="pdo-swal-select">
              ${roleOptionsHtml}
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:6px;font-weight:600;font-size:12.5px;color:var(--text-secondary)">Catatan Tugas (Opsional)</label>
            <input id="swal-notes" type="text" placeholder="Misal: Koridor 1 Shift Pagi" class="pdo-swal-input" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan & Beri Akses',
      cancelButtonText: 'Batal',
      customClass: {
        container: 'pdo-swal-container',
        popup: 'pdo-swal-popup',
        confirmButton: 'pdo-swal-confirm-btn',
        cancelButton: 'pdo-swal-cancel-btn',
      },
      buttonsStyling: false,
      focusConfirm: false,
      preConfirm: () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value?.trim();
        const full_name = (document.getElementById('swal-name') as HTMLInputElement)?.value?.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement)?.value as any;
        const notes = (document.getElementById('swal-notes') as HTMLInputElement)?.value?.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          pdoSwal.showValidationMessage('Masukkan format email yang valid!');
          return false;
        }

        return { email, full_name, role, notes };
      },
    });

    if (formValues) {
      const res = await addUserProfile({
        email: formValues.email,
        full_name: formValues.full_name || undefined,
        role: formValues.role || 'petugas',
        notes: formValues.notes || undefined,
        created_by: currentUserEmail,
      });

      if (res.success) {
        showSuccessToast(`Pengguna ${escapeHtml(formValues.email)} berhasil ditambahkan!`);
        loadUsers();
      } else {
        showErrorAlert('Gagal Menambah Pengguna', res.message || 'Terjadi kesalahan sistem.');
      }
    }
  };

  // Handle Edit Role Modal
  const handleEditRole = async (user: UserProfile) => {
    if (currentUserRole !== 'superadmin') {
      showErrorAlert('Akses Terbatas', 'Hanya Superadmin yang berwenang mengubah peran akun.');
      return;
    }

    const { value: newRole } = await pdoSwal.fire({
      title: 'Ubah Peran Pengguna',
      html: `
        <div style="text-align:left;font-size:13px;margin-top:6px;">
          <p style="margin:0 0 10px;color:var(--text-secondary);font-size:12.5px;">Pilih peran baru untuk <strong style="color:var(--text-primary)">${escapeHtml(user.email)}</strong>:</p>
          <select id="swal-new-role" class="pdo-swal-select">
            <option value="petugas" ${user.role === 'petugas' ? 'selected' : ''}>Petugas Operasional (Input Data Saja)</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin (Kelola Petugas & Rute)</option>
            <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>Superadmin (Kuasa Penuh)</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      cancelButtonText: 'Batal',
      customClass: {
        container: 'pdo-swal-container',
        popup: 'pdo-swal-popup',
        confirmButton: 'pdo-swal-confirm-btn',
        cancelButton: 'pdo-swal-cancel-btn',
      },
      buttonsStyling: false,
      preConfirm: () => {
        return (document.getElementById('swal-new-role') as HTMLSelectElement)?.value;
      },
    });

    if (newRole && newRole !== user.role) {
      const res = await updateUserProfileRole(user.email, newRole as any, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Peran ${escapeHtml(user.email)} diubah menjadi ${escapeHtml(newRole)}.`);
        setUsers((prev) =>
          prev.map((u) => (u.email === user.email ? { ...u, role: newRole as any } : u))
        );
      } else {
        showErrorAlert('Gagal Mengubah Peran', res.message || 'Gagal memperbarui peran.');
      }
    }
  };

  // Handle Toggle Active Status
  const handleToggleStatus = async (user: UserProfile) => {
    // BUG-55: Guard RBAC internal untuk toggle status
    if (currentUserRole !== 'superadmin' && currentUserRole !== 'admin') {
      showErrorAlert('Akses Terbatas', 'Hanya Admin atau Superadmin yang berwenang mengubah status akun.');
      return;
    }

    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
    if (isSelf) {
      showErrorAlert('Aksi Ditolak', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }

    if (currentUserRole === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) {
      showErrorAlert('Akses Terbatas', 'Admin tidak dapat mengubah status akun Admin atau Superadmin.');
      return;
    }

    const nextStatus = user.is_active === false ? true : false;
    const actionText = nextStatus ? 'mengaktifkan' : 'menonaktifkan';

    const { isConfirmed } = await pdoSwal.fire({
      title: 'Konfirmasi Status Akun',
      html: `<p style="margin:0;font-size:13.5px;color:var(--text-secondary);line-height:1.5;">Apakah Anda yakin ingin <strong>${actionText}</strong> akses login untuk <strong style="color:var(--text-primary)">${escapeHtml(user.email)}</strong>?</p>`,
      icon: nextStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: nextStatus ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal',
      customClass: {
        container: 'pdo-swal-container',
        popup: 'pdo-swal-popup',
        confirmButton: nextStatus
          ? 'pdo-swal-confirm-btn'
          : 'pdo-swal-confirm-btn pdo-swal-confirm-danger-btn',
        cancelButton: 'pdo-swal-cancel-btn',
      },
      buttonsStyling: false,
    });

    if (isConfirmed) {
      const res = await toggleUserProfileStatus(user.email, nextStatus, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Akun ${escapeHtml(user.email)} berhasil di${nextStatus ? 'aktifkan' : 'nonaktifkan'}.`);
        setUsers((prev) =>
          prev.map((u) => (u.email === user.email ? { ...u, is_active: nextStatus } : u))
        );
      } else {
        showErrorAlert('Gagal', res.message || 'Gagal mengubah status akun.');
      }
    }
  };

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
                <Users size={18} className="text-blue-500" style={{ flexShrink: 0 }} />
                <span>Manajemen Pengguna</span>
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
                {counts.active} aktif dari total {counts.all} terdaftar
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="btn btn-outline"
              style={{
                padding: '7px 9px',
                borderRadius: '10px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Muat Ulang Daftar User"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenAddUserModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 13px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <UserPlus size={15} />
              <span>Tambah</span>
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
              placeholder="Cari berdasarkan nama, email, atau catatan..."
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

          {/* Segmented Filter Tabs */}
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
              { key: 'all', label: 'Semua', count: counts.all },
              ...(currentUserRole === 'superadmin'
                ? [
                    { key: 'superadmin', label: 'Superadmin', count: counts.superadmin },
                    { key: 'admin', label: 'Admin', count: counts.admin },
                  ]
                : []),
              { key: 'petugas', label: 'Petugas', count: counts.petugas },
              { key: 'inactive', label: 'Nonaktif', count: counts.inactive },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as FilterTab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 600 : 500,
                    border: '1px solid',
                    borderColor: isActive
                      ? '#3b82f6'
                      : 'var(--card-border, rgba(255,255,255,0.08))',
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#60a5fa' : 'var(--text-secondary, #94a3b8)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card List */}
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
            <RefreshCw size={28} className="animate-spin text-blue-500" />
            <span style={{ fontSize: '13.5px' }}>Memuat daftar pengguna...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
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
            <Users size={36} style={{ color: 'var(--text-secondary, #64748b)', opacity: 0.5 }} />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary, #f8fafc)' }}>
              Tidak ada pengguna ditemukan
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary, #94a3b8)', maxWidth: '300px' }}>
              {searchQuery
                ? 'Tidak ada akun yang cocok dengan kata kunci pencarian.'
                : 'Belum ada pengguna pada kategori ini.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredUsers.map((user) => {
              const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
              const isActive = user.is_active !== false;

              return (
                <div
                  key={user.email}
                  style={{
                    background: 'var(--card-bg, rgba(30, 41, 59, 0.7))',
                    border: '1px solid',
                    borderColor: isSelf
                      ? 'rgba(59, 130, 246, 0.4)'
                      : 'var(--card-border, rgba(255,255,255,0.08))',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    boxShadow: isSelf ? '0 0 20px rgba(59, 130, 246, 0.1)' : 'none',
                  }}
                >
                  {/* Top Section: Avatar & Info (Left) | Role & Status Badge (Top-Right) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    {/* Left: Avatar + Full Name + Email */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <UserCardAvatar user={user} isSelf={isSelf} />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: 'var(--text-primary, #f8fafc)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {user.full_name || 'Tanpa Nama'}
                          </span>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '5px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
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
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={user.email}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Top-Right: Role Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <RoleBadge role={user.role || 'petugas'} />
                    </div>
                  </div>

                  {/* Notes / Sub-info without decorative icon */}
                  {user.notes && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.05))',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        lineHeight: 1.4,
                      }}
                    >
                      <span>{user.notes}</span>
                    </div>
                  )}

                  {/* Metadata Row: Last login & Creator (Clock icon preserved) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--text-secondary, #64748b)',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.05))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      <span>
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah login'}
                      </span>
                    </div>

                    {user.created_by && (
                      <span title={`Didaftarkan oleh: ${user.created_by}`}>
                        Oleh: {user.created_by.split('@')[0]}
                      </span>
                    )}
                  </div>

                  {/* Actions Section (Only for non-superadmin users) */}
                  {user.role !== 'superadmin' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.05))',
                      }}
                    >
                      {/* Interactive iOS-style Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        onClick={() => handleToggleStatus(user)}
                        disabled={isSelf}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'transparent',
                          border: 'none',
                          padding: '2px 0',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          opacity: isSelf ? 0.45 : 1,
                          outline: 'none',
                        }}
                        title={
                          isSelf
                            ? 'Tidak bisa menonaktifkan akun sendiri'
                            : isActive
                            ? 'Klik untuk menonaktifkan status akun'
                            : 'Klik untuk mengaktifkan status akun'
                        }
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '20px',
                            borderRadius: '9999px',
                            background: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.16)',
                            border: isActive
                              ? '1px solid rgba(16, 185, 129, 0.4)'
                              : '1px solid var(--card-border, rgba(255, 255, 255, 0.15))',
                            position: 'relative',
                            transition: 'background-color 0.25s cubic-bezier(0.32, 0.72, 0, 1), border-color 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                            padding: '2px',
                          }}
                        >
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                              transform: isActive ? 'translateX(16px)' : 'translateX(0px)',
                              transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isActive ? '#34d399' : 'var(--text-secondary, #94a3b8)',
                            userSelect: 'none',
                          }}
                        >
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </button>

                      {/* Role Actions (Clean text button) */}
                      <div>
                        {currentUserRole === 'superadmin' && (
                          <button
                            onClick={() => handleEditRole(user)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-primary, #f8fafc)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Ubah Peran / Role"
                          >
                            Ubah Peran
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
