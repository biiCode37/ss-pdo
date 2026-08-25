import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
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

interface UserManagementPageProps {
  onBack: () => void;
  currentUserEmail: string;
  currentUserRole: 'superadmin' | 'admin' | 'petugas';
  isDarkMode?: boolean;
}

type FilterTab = 'all' | 'superadmin' | 'admin' | 'petugas' | 'inactive';

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
      setUsers(data);
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

    const { value: formValues } = await Swal.fire({
      title: '<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary)">Tambah Pengguna Baru</h3>',
      html: `
        <div style="text-align:left;font-size:13px;display:flex;flex-direction:column;gap:12px;margin-top:10px;">
          <div>
            <label style="display:block;margin-bottom:4px;font-weight:600;color:var(--text-secondary)">Email Akun Google <span style="color:#ef4444">*</span></label>
            <input id="swal-email" type="email" placeholder="contoh@gmail.com" class="swal2-input" style="margin:0;width:100%;font-size:13.5px;padding:8px 12px;border-radius:10px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="display:block;margin-bottom:4px;font-weight:600;color:var(--text-secondary)">Nama Lengkap</label>
            <input id="swal-name" type="text" placeholder="Nama Petugas / Pengawas" class="swal2-input" style="margin:0;width:100%;font-size:13.5px;padding:8px 12px;border-radius:10px;box-sizing:border-box;" />
          </div>
          <div>
            <label style="display:block;margin-bottom:4px;font-weight:600;color:var(--text-secondary)">Peran / Hak Akses</label>
            <select id="swal-role" class="swal2-select" style="margin:0;width:100%;font-size:13.5px;padding:8px 12px;border-radius:10px;box-sizing:border-box;">
              ${roleOptionsHtml}
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:4px;font-weight:600;color:var(--text-secondary)">Catatan Tugas (Opsional)</label>
            <input id="swal-notes" type="text" placeholder="Misal: Petugas Koridor 1, Shift Pagi" class="swal2-input" style="margin:0;width:100%;font-size:13.5px;padding:8px 12px;border-radius:10px;box-sizing:border-box;" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan & Beri Akses',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      preConfirm: () => {
        const email = (document.getElementById('swal-email') as HTMLInputElement)?.value?.trim();
        const full_name = (document.getElementById('swal-name') as HTMLInputElement)?.value?.trim();
        const role = (document.getElementById('swal-role') as HTMLSelectElement)?.value as any;
        const notes = (document.getElementById('swal-notes') as HTMLInputElement)?.value?.trim();

        if (!email || !email.includes('@')) {
          Swal.showValidationMessage('Masukkan format email yang valid!');
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
        showSuccessToast(`Pengguna ${formValues.email} berhasil ditambahkan!`);
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

    const { value: newRole } = await Swal.fire({
      title: `<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary)">Ubah Peran Pengguna</h3>`,
      html: `
        <div style="text-align:left;font-size:13px;margin-top:10px;">
          <p style="margin:0 0 10px;color:var(--text-secondary)">Pilih peran baru untuk <strong>${escapeHtml(user.email)}</strong>:</p>
          <select id="swal-new-role" class="swal2-select" style="margin:0;width:100%;font-size:14px;padding:8px 12px;border-radius:10px;">
            <option value="petugas" ${user.role === 'petugas' ? 'selected' : ''}>Petugas Operasional (Input Data Saja)</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin (Kelola Petugas & Rute)</option>
            <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>Superadmin (Kuasa Penuh)</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        return (document.getElementById('swal-new-role') as HTMLSelectElement)?.value;
      },
    });

    if (newRole && newRole !== user.role) {
      const res = await updateUserProfileRole(user.email, newRole as any, currentUserEmail);
      if (res.success) {
        showSuccessToast(`Peran ${user.email} diubah menjadi ${newRole}.`);
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

    const { isConfirmed } = await Swal.fire({
      title: `<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary)">Konfirmasi Status Akun</h3>`,
      html: `<p style="margin:0;font-size:13.5px;color:var(--text-secondary)">Apakah Anda yakin ingin <strong>${actionText}</strong> akses login untuk <strong>${escapeHtml(user.email)}</strong>?</p>`,
      icon: nextStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: nextStatus ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
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

  // Handle Revoke User Access
  const handleRevoke = async (user: UserProfile) => {
    if (currentUserRole !== 'superadmin') {
      showErrorAlert('Akses Terbatas', 'Hanya Superadmin yang berwenang mencabut akses pengguna.');
      return;
    }

    const isSelf = user.email.toLowerCase() === currentUserEmail.toLowerCase();
    if (isSelf) {
      showErrorAlert('Aksi Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: `<h3 style="margin:0;font-size:18px;font-weight:700;color:#ef4444">Cabut Akses Pengguna?</h3>`,
      html: `
        <div style="font-size:13px;color:var(--text-secondary);text-align:left;line-height:1.5;">
          <p style="margin:0 0 8px;">Anda akan mencabut akses whitelist untuk <strong>${escapeHtml(user.email)}</strong> (${escapeHtml(user.full_name || 'Tanpa Nama')}).</p>
          <p style="margin:0;color:#ef4444;font-size:12px;">Akun ini tidak akan dapat login lagi ke aplikasi sampai didaftarkan kembali.</p>
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
                <Users size={19} className="text-blue-500" />
                Manajemen Pengguna
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                {counts.active} akun aktif dari total {counts.all} terdaftar
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="btn btn-outline"
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-secondary, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Muat Ulang Daftar User"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenAddUserModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Tambah Akun</span>
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
                  {/* Top Section: Avatar, Name, Email, Role */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                      >
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '6px',
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: 'var(--text-secondary, #94a3b8)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Mail size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </span>
                      </div>

                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RoleBadge role={user.role || 'petugas'} />
                        {!isActive && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                            }}
                          >
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes / Sub-info */}
                  {user.notes && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.05))',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <FileText size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{user.notes}</span>
                    </div>
                  )}

                  {/* Metadata Row: Last login & Creator */}
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

                  {/* Actions Section */}
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
                    {/* Toggle Active Status Button */}
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isSelf}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                        background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isActive ? '#34d399' : '#f87171',
                        cursor: isSelf ? 'not-allowed' : 'pointer',
                        opacity: isSelf ? 0.5 : 1,
                      }}
                      title={isSelf ? 'Tidak bisa menonaktifkan akun sendiri' : 'Ubah status aktif/nonaktif'}
                    >
                      {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                    </button>

                    {/* Role & Delete Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {currentUserRole === 'superadmin' && (
                        <button
                          onClick={() => handleEditRole(user)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-primary, #f8fafc)',
                            cursor: 'pointer',
                          }}
                          title="Ubah Peran / Role"
                        >
                          <Edit2 size={12} />
                          <span>Ubah Peran</span>
                        </button>
                      )}

                      {currentUserRole === 'superadmin' && !isSelf && (
                        <button
                          onClick={() => handleRevoke(user)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#f87171',
                            cursor: 'pointer',
                          }}
                          title="Cabut Akses Pengguna"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
