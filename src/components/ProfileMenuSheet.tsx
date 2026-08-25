import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  Layers,
  Sun,
  Moon,
  LogOut,
  CloudOff,
  ChevronRight,
  Sparkles,
  Users,
  History,
} from "lucide-react";
import { verifyUserProfile, upsertUserProfile } from "../services/routeService";
import { fetchGoogleUserProfile } from "../services/googleSheets/auth";
import {
  showLogoutConfirm,
  showFormatSheetConfirm,
  showToast,
  showSuccessToast,
  showWarningToast,
  showErrorAlert,
} from "../utils/alertUtils";
import { formatUserError } from "../utils/errorFormatter";
import { RoleBadge } from "./RoleBadge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccumulation?: () => void;
  onOpenUserManagement?: () => void;
  onOpenAuditLogs?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  offlineQueueCount: number;
  isOnline: boolean;
  onLogout: () => void;
  onFormatWholeSheet?: () => Promise<void>;
  currentTabName?: string;
  hasActiveData?: boolean;
}

export function ProfileMenuSheet({
  isOpen,
  onClose,
  onOpenAccumulation: _onOpenAccumulation,
  onOpenUserManagement,
  onOpenAuditLogs,
  isDarkMode,
  onToggleTheme,
  offlineQueueCount,
  isOnline,
  onLogout,
  onFormatWholeSheet,
  currentTabName,
  hasActiveData,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    avatar_url?: string;
    role?: 'superadmin' | 'admin' | 'petugas';
  }>({
    full_name: localStorage.getItem("PDO_USER_NAME") || "Petugas Operasional",
    email: localStorage.getItem("PDO_USER_EMAIL") || "pdo.utara@transjakarta.co.id",
    avatar_url: localStorage.getItem("PDO_USER_AVATAR") || undefined,
    role: (localStorage.getItem("PDO_USER_ROLE") as any) || "petugas",
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      return;
    }

    mountTimeRef.current = Date.now();

    // Ambil data profil dari localStorage & sync dari Supabase DB
    const cachedEmail = localStorage.getItem("PDO_USER_EMAIL") || "";
    const cachedName = localStorage.getItem("PDO_USER_NAME") || "";
    const cachedAvatar = localStorage.getItem("PDO_USER_AVATAR") || "";

    if (cachedEmail || cachedName) {
      setUserProfile({
        full_name: cachedName || "Petugas Operasional",
        email: cachedEmail || "pdo.utara@transjakarta.co.id",
        avatar_url: cachedAvatar || undefined,
        role: (localStorage.getItem("PDO_USER_ROLE") as any) || "petugas",
      });
    }

    // Jika avatar belum ada di localStorage, ambil langsung dari Google UserInfo API
    if (!cachedAvatar) {
      fetchGoogleUserProfile().then((info) => {
        if (info && info.picture) {
          setUserProfile((prev) => ({
            ...prev,
            avatar_url: info.picture,
            full_name: info.name || prev.full_name,
          }));
          if (cachedEmail) {
            upsertUserProfile({
              email: cachedEmail,
              full_name: info.name || cachedName || cachedEmail,
              avatar_url: info.picture,
            }).catch(() => {});
          }
        }
      });
    }

    if (cachedEmail) {
      verifyUserProfile(cachedEmail).then((res) => {
        if (res.profile) {
          const profile = res.profile;
          const effectiveAvatar =
            profile.avatar_url ||
            cachedAvatar ||
            localStorage.getItem("PDO_USER_AVATAR") ||
            undefined;

          setUserProfile((prev) => ({
            full_name: profile.full_name || prev.full_name || cachedEmail,
            email: profile.email || prev.email,
            avatar_url: effectiveAvatar || prev.avatar_url,
            role: profile.role || prev.role || "petugas",
          }));

          if (profile.full_name)
            localStorage.setItem("PDO_USER_NAME", profile.full_name);
          if (profile.email)
            localStorage.setItem("PDO_USER_EMAIL", profile.email);
          if (profile.role)
            localStorage.setItem("PDO_USER_ROLE", profile.role);
          if (effectiveAvatar)
            localStorage.setItem("PDO_USER_AVATAR", effectiveAvatar);
        }
      });
    }

    const frameId = requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isDraggingRef.current = true;
      currentDragYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current || touchStartYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && contentRef.current) {
      currentDragYRef.current = diff;
      contentRef.current.style.transition = 'none';
      contentRef.current.style.transform = `translateY(${diff}px) scale(${Math.max(0.95, 1 - diff / 2000)})`;
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'none';
        const opacity = Math.max(0.2, 0.65 - diff / 500);
        overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = currentDragYRef.current;
    const duration = Date.now() - touchStartTimeRef.current;
    const velocity = duration > 0 ? diff / duration : 0;
    touchStartYRef.current = 0;

    if (diff > 60 || (diff > 25 && velocity > 0.35)) {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(100%) scale(0.95)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.opacity = '0';
      }
      handleDismiss();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        contentRef.current.style.transform = 'translateY(0px) scale(1)';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)';
        overlayRef.current.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
      }
    }
  };

  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormatSpreadsheetClick = async () => {
    if (!onFormatWholeSheet) return;
    if (!hasActiveData) {
      showWarningToast("Pilih rute dan tanggal terlebih dahulu.");
      return;
    }

    handleDismiss();
    const confirmed = await showFormatSheetConfirm(currentTabName || "aktif");
    if (!confirmed) return;

    try {
      setIsFormatting(true);
      showToast({
        title: "Sedang merapikan spreadsheet...",
        icon: "info",
        timer: 2500,
      });
      await onFormatWholeSheet();
      showSuccessToast("Spreadsheet berhasil dirapikan & diformat!");
    } catch (err: any) {
      showErrorAlert(
        formatUserError(err, "Gagal menerapkan format spreadsheet.") ||
          "Gagal menerapkan format spreadsheet.",
      );
    } finally {
      setIsFormatting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay profile-menu-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (Date.now() - mountTimeRef.current < 250) return;
        handleDismiss();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="glass profile-menu-content"
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "88vh",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding:
            "20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderBottom: "none",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
          transform: isClosing || !isMounted ? "translateY(100%) scale(0.95)" : "translateY(0px) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top Handle Bar for Touch Drag */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--text-secondary)",
              opacity: 0.3,
            }}
          />
        </div>

        {/* User Card Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: "rgba(62, 207, 142, 0.06)",
            borderRadius: "16px",
            border: "1px solid rgba(62, 207, 142, 0.18)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(62, 207, 142, 0.3)",
                }}
              />
            ) : null}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #3ECF8E, #24B47E)",
                display: userProfile.avatar_url ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#061a10",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(62, 207, 142, 0.3)",
              }}
            >
              <User size={22} />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14.5px",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userProfile.full_name}
                </span>
                <RoleBadge role={userProfile.role} size="xs" />
              </div>
              <span
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: "2px",
                }}
              >
                {userProfile.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "6px",
            }}
            title="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* SECTION: Administrasi Sistem (Khusus Superadmin & Admin) */}
        {(userProfile.role === "superadmin" || userProfile.role === "admin") && (
          <div style={{ marginBottom: "20px" }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "8px",
                paddingLeft: "4px",
              }}
            >
              ADMINISTRASI SISTEM
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Kelola Pengguna */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUserManagement?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.03))",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Users size={18} style={{ color: "#3b82f6" }} />
                  <div style={{ textAlign: "left" }}>
                    <div>Kelola Pengguna</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginTop: "1px",
                      }}
                    >
                      Atur akun, peran (role), & status aktif
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
              </button>

              {/* Log Aktivitas & Audit */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuditLogs?.();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "var(--bg-secondary, rgba(255,255,255,0.03))",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <History size={18} style={{ color: "#10b981" }} />
                  <div style={{ textAlign: "left" }}>
                    <div>Log Aktivitas & Audit</div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        marginTop: "1px",
                      }}
                    >
                      Riwayat tindakan dan input operasional
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
              </button>
            </div>
          </div>
        )}

        {/* SECTION: Fitur & Utilitas */}
        <div style={{ marginBottom: "20px" }}>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
              paddingLeft: "4px",
            }}
          >
            FITUR & UTILITAS
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Rekap Akumulasi (Disabled - Coming Soon) */}
            <button
              type="button"
              disabled={true}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--bg-secondary, rgba(255,255,255,0.03))",
                border: "1px solid var(--card-border)",
                color: "var(--text-secondary)",
                fontWeight: 500,
                fontSize: "13.5px",
                cursor: "not-allowed",
                opacity: 0.65,
              }}
              title="Fitur sedang dalam penyesuaian (Coming Soon)"
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Layers size={18} style={{ color: "var(--text-secondary)" }} />
                <span>Rekap Akumulasi Lintas Periode</span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "var(--warning-color, #f59e0b)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                }}
              >
                Coming Soon
              </span>
            </button>

            {/* Rapikan & Format Spreadsheet */}
            <button
              type="button"
              onClick={handleFormatSpreadsheetClick}
              disabled={isFormatting}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--bg-secondary, rgba(255,255,255,0.03))",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                fontWeight: 500,
                fontSize: "13.5px",
                cursor: isFormatting ? "wait" : "pointer",
                opacity: isFormatting ? 0.7 : 1,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Sparkles size={18} style={{ color: "var(--accent-color)" }} />
                <div style={{ textAlign: "left" }}>
                  <div>Rapikan & Format Spreadsheet</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      marginTop: "1px",
                    }}
                  >
                    Terapkan perataan & warna baris ke Google Sheets
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
            </button>

            {/* Toggle Theme */}
            <button
              type="button"
              onClick={onToggleTheme}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--bg-secondary, rgba(255,255,255,0.03))",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                fontWeight: 500,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {isDarkMode ? (
                  <Sun size={18} style={{ color: "#f59e0b" }} />
                ) : (
                  <Moon size={18} style={{ color: "var(--accent-color)" }} />
                )}
                <span>Mode Tampilan</span>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--surface-color)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--card-border)",
                }}
              >
                {isDarkMode ? "Dark Mode" : "Light Mode"}
              </span>
            </button>

            {/* Status Antrean Sync Offline (jika ada) */}
            {(!isOnline || offlineQueueCount > 0) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  color: "var(--warning-color, #f59e0b)",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <CloudOff size={18} />
                  <span>{!isOnline ? "Mode Offline" : "Antrean Sync"}</span>
                </div>
                {offlineQueueCount > 0 && (
                  <span
                    style={{
                      background: "#f59e0b",
                      color: "#000",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {offlineQueueCount} terpending
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catatan Transparansi Aktivitas */}
        <div style={{ textAlign: "center", padding: "0 8px 2px 8px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, opacity: 0.8 }}>
            ⏱️ Waktu aktif sesi tercatat otomatis untuk pemantauan operasional.
          </p>
        </div>

        {/* SECTION: Manajemen Akun (Logout) */}
        <div>
          <button
            type="button"
            onClick={async () => {
              const confirmed = await showLogoutConfirm();
              if (confirmed) {
                onLogout();
                handleDismiss();
              }
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "12px",
              background: "rgba(247, 85, 85, 0.08)",
              border: "1px solid rgba(247, 85, 85, 0.2)",
              color: "var(--danger-color, #f75555)",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <LogOut size={18} />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
