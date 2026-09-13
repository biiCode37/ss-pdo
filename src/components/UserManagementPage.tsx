import React, { useState, useEffect, useMemo } from "react";
import type { UserProfile, UserRole } from "@/types/supabase";
import {
  fetchAllUserProfiles,
  addUserProfile,
  updateUserProfileRole,
  toggleUserProfileStatus,
  upsertUserProfile,
} from "@/services/routeService";
import { fetchGoogleUserProfile } from "@/services/googleSheets/auth";
import { escapeHtml, showSuccessToast, showErrorAlert } from "@/utils/alertUtils";
import { TEXT_USER_MANAGEMENT } from "@/constants/texts";
import {
  UserManagementHeader,
  UserManagementFilters,
  type FilterTab,
  type UserCounts,
  UserCardItem,
  UserManagementSkeleton,
  UserManagementEmptyState,
  promptAddUserModal,
  promptEditRoleModal,
  promptToggleStatusModal,
} from "./userManagement";

interface UserManagementPageProps {
  onBack: () => void;
  currentUserEmail: string;
  currentUserRole: UserRole | "petugas";
  isDarkMode?: boolean;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onBack,
  currentUserEmail,
  currentUserRole,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllUserProfiles();
      const cachedAvatar = localStorage.getItem("PDO_USER_AVATAR");
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
      console.error("[UserManagement] Gagal memuat user:", err);
      showErrorAlert(
        TEXT_USER_MANAGEMENT.ALERTS.LOAD_FAILED_TITLE,
        TEXT_USER_MANAGEMENT.ALERTS.LOAD_FAILED_TEXT,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    window.scrollTo({ top: 0, behavior: "instant" });

    // Sync avatar from Google if missing
    if (!localStorage.getItem("PDO_USER_AVATAR")) {
      fetchGoogleUserProfile()
        .then((info) => {
          if (info && info.picture) {
            localStorage.setItem("PDO_USER_AVATAR", info.picture);
            upsertUserProfile({
              email: currentUserEmail,
              full_name: info.name || currentUserEmail,
              avatar_url: info.picture,
            }).catch((err) => {
              console.warn("[UserManagement] Gagal upsert avatar profil Google:", err);
            });
            setUsers((prev) =>
              prev.map((u) =>
                u.email.toLowerCase() === currentUserEmail.toLowerCase()
                  ? { ...u, avatar_url: info.picture }
                  : u,
              ),
            );
          }
        })
        .catch((err) => {
          console.warn("[UserManagement] Gagal fetch profil Google:", err);
        });
    }
  }, []);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab === "superadmin" && u.role !== "superadmin") return false;
      if (activeTab === "admin" && u.role !== "admin") return false;
      if (activeTab === "korwil" && u.role !== "korwil") return false;
      if (activeTab === "korlap" && u.role !== "korlap") return false;
      if ((activeTab === "pdo" || activeTab === "petugas") && u.role !== "pdo")
        return false;
      if (activeTab === "inactive" && u.is_active !== false) return false;

      // Role isolation: Admin hanya bisa melihat petugas/lapangan dan dirinya sendiri
      if (currentUserRole === "admin") {
        const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
        const isOperational =
          u.role === "pdo" || u.role === "korlap" || u.role === "korwil";
        if (!isSelf && !isOperational) return false;
      }

      // Search Query Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        u.email.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.notes && u.notes.toLowerCase().includes(q))
      );
    });
  }, [users, activeTab, searchQuery, currentUserRole, currentUserEmail]);

  // Counts per Category Tab
  const counts: UserCounts = useMemo(() => {
    const isPdoOrPetugas =
      currentUserRole === "pdo" || currentUserRole === "petugas";
    const base = isPdoOrPetugas
      ? users.filter(
          (u) =>
            u.email.toLowerCase() === currentUserEmail.toLowerCase() ||
            u.role === "pdo",
        )
      : users;

    return {
      all: base.length,
      superadmin: base.filter((u) => u.role === "superadmin").length,
      admin: base.filter((u) => u.role === "admin").length,
      korwil: base.filter((u) => u.role === "korwil").length,
      korlap: base.filter((u) => u.role === "korlap").length,
      pdo: base.filter((u) => u.role === "pdo").length,
      petugas: base.filter((u) => u.role === "pdo").length,
      inactive: base.filter((u) => u.is_active === false).length,
      active: base.filter((u) => u.is_active !== false).length,
    };
  }, [users, currentUserRole, currentUserEmail]);

  // Handle Add User Modal
  const handleOpenAddUserModal = async () => {
    const formValues = await promptAddUserModal(currentUserRole);
    if (!formValues) return;

    const res = await addUserProfile({
      email: formValues.email,
      full_name: formValues.full_name || undefined,
      role: formValues.role || "pdo",
      notes: formValues.notes || undefined,
      created_by: currentUserEmail,
    });

    if (res.success) {
      showSuccessToast(
        TEXT_USER_MANAGEMENT.TOAST.ADD_SUCCESS(escapeHtml(formValues.email)),
      );
      loadUsers();
    } else {
      showErrorAlert(
        TEXT_USER_MANAGEMENT.ALERTS.ADD_FAILED_TITLE,
        res.message || TEXT_USER_MANAGEMENT.ALERTS.GENERIC_ERROR,
      );
    }
  };

  // Handle Edit Role Modal
  const handleEditRole = async (user: UserProfile) => {
    const newRole = await promptEditRoleModal(user, currentUserRole);
    if (!newRole || newRole === user.role) return;

    const res = await updateUserProfileRole(
      user.email,
      newRole,
      currentUserEmail,
    );
    if (res.success) {
      showSuccessToast(
        TEXT_USER_MANAGEMENT.TOAST.EDIT_ROLE_SUCCESS(
          escapeHtml(user.email),
          escapeHtml(newRole),
        ),
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.email === user.email ? { ...u, role: newRole } : u,
        ),
      );
    } else {
      showErrorAlert(
        TEXT_USER_MANAGEMENT.ALERTS.EDIT_ROLE_FAILED_TITLE,
        res.message || TEXT_USER_MANAGEMENT.ALERTS.GENERIC_ERROR,
      );
    }
  };

  // Handle Toggle Active Status
  const handleToggleStatus = async (user: UserProfile) => {
    const modalRes = await promptToggleStatusModal(
      user,
      currentUserRole,
      currentUserEmail,
    );
    if (!modalRes || !modalRes.confirmed) return;

    const { nextStatus, actionText } = modalRes;
    const res = await toggleUserProfileStatus(
      user.email,
      nextStatus,
      currentUserEmail,
    );
    if (res.success) {
      showSuccessToast(
        TEXT_USER_MANAGEMENT.TOAST.STATUS_SUCCESS(
          escapeHtml(user.email),
          actionText,
        ),
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.email === user.email ? { ...u, is_active: nextStatus } : u,
        ),
      );
    } else {
      showErrorAlert(
        TEXT_USER_MANAGEMENT.ALERTS.GENERIC_FAILED_TITLE,
        res.message || TEXT_USER_MANAGEMENT.ALERTS.GENERIC_ERROR,
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "var(--bg-primary, #0f172a)",
        color: "var(--text-primary, #f8fafc)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sticky Top Navigation Bar */}
      <UserManagementHeader
        onBack={onBack}
        activeCount={counts.active}
        totalCount={counts.all}
        isLoading={isLoading}
        onRefresh={loadUsers}
        onOpenAddUserModal={handleOpenAddUserModal}
      />

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Search & Tabs Controls */}
        <UserManagementFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          currentUserRole={currentUserRole}
        />

        {/* User Card List */}
        {isLoading ? (
          <UserManagementSkeleton />
        ) : filteredUsers.length === 0 ? (
          <UserManagementEmptyState isSearchActive={Boolean(searchQuery)} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "12px",
            }}
          >
            {filteredUsers.map((user) => (
              <UserCardItem
                key={user.email}
                user={user}
                currentUserEmail={currentUserEmail}
                currentUserRole={currentUserRole}
                onToggleStatus={handleToggleStatus}
                onEditRole={handleEditRole}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagementPage;
