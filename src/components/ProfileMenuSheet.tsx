import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  BarChart3,
  Edit3,
  Bus,
  Layers,
  Sun,
  Moon,
  LogOut,
  CloudOff,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { verifyUserProfile } from "../services/routeService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "analytics" | "input" | "units";
  onSelectTab: (tab: "analytics" | "input" | "units") => void;
  onOpenAccumulation: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  offlineQueueCount: number;
  isOnline: boolean;
  onLogout: () => void;
}

export function ProfileMenuSheet({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenAccumulation,
  isDarkMode,
  onToggleTheme,
  offlineQueueCount,
  isOnline,
  onLogout,
}: Props) {
  const [touchStartY, setTouchStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    avatar_url?: string;
  }>({
    full_name: localStorage.getItem("PDO_USER_NAME") || "Petugas Operasional",
    email: localStorage.getItem("PDO_USER_EMAIL") || "pdo.utara@transjakarta.co.id",
    avatar_url: localStorage.getItem("PDO_USER_AVATAR") || undefined,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      setShowLogoutConfirm(false);
      setDragY(0);
      return;
    }

    // Ambil data profil dari localStorage & sync dari Supabase DB
    const cachedEmail = localStorage.getItem("PDO_USER_EMAIL") || "";
    const cachedName = localStorage.getItem("PDO_USER_NAME") || "";
    const cachedAvatar = localStorage.getItem("PDO_USER_AVATAR") || "";

    if (cachedEmail || cachedName) {
      setUserProfile({
        full_name: cachedName || "Petugas Operasional",
        email: cachedEmail || "pdo.utara@transjakarta.co.id",
        avatar_url: cachedAvatar || undefined,
      });
    }

    if (cachedEmail) {
      verifyUserProfile(cachedEmail).then((res) => {
        if (res.profile) {
          setUserProfile({
            full_name: res.profile.full_name || cachedEmail,
            email: res.profile.email,
            avatar_url: res.profile.avatar_url || undefined,
          });
          if (res.profile.full_name) localStorage.setItem("PDO_USER_NAME", res.profile.full_name);
          if (res.profile.email) localStorage.setItem("PDO_USER_EMAIL", res.profile.email);
          if (res.profile.avatar_url) localStorage.setItem("PDO_USER_AVATAR", res.profile.avatar_url);
        }
      });
    }

    requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
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
      setTouchStartY(e.touches[0].clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging || touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dragY > 90) {
      handleDismiss();
    } else {
      setDragY(0);
    }
    setTouchStartY(0);
    setIsDragging(false);
  };

  const handleTabClick = (tab: "analytics" | "input" | "units") => {
    onSelectTab(tab);
    handleDismiss();
  };

  const handleAccumulationClick = () => {
    onOpenAccumulation();
    handleDismiss();
  };

  if (!isOpen) return null;

  const opacityValue = isClosing
    ? 0
    : isMounted
      ? Math.max(0.15, 0.65 - dragY / 400)
      : 0;

  const modalTransform = isClosing
    ? "translateY(100%) scale(0.95)"
    : !isMounted
      ? "translateY(100%) scale(0.95)"
      : `translateY(${dragY}px) scale(${Math.max(0.92, 1 - dragY / 1500)})`;

  return createPortal(
    <div
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
        backgroundColor: `rgba(0, 0, 0, ${opacityValue})`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      onClick={handleDismiss}
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
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)",
          transform: modalTransform,
          transition: isDragging
            ? "none"
            : "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
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
            background: "rgba(59, 130, 246, 0.06)",
            borderRadius: "16px",
            border: "1px solid rgba(59, 130, 246, 0.15)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--accent-color), #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              >
                <User size={22} />
              </div>
            )}
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
                <ShieldCheck
                  size={14}
                  style={{ color: "var(--accent-color)", flexShrink: 0 }}
                />
              </div>
              <span
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-secondary)",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
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
          >
            <X size={20} />
          </button>
        </div>

        {/* SECTION 1: Navigasi Utama */}
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
            NAVIGASI HALAMAN
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Dashboard Tab */}
            <button
              type="button"
              onClick={() => handleTabClick("analytics")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  activeTab === "analytics"
                    ? "rgba(59, 130, 246, 0.12)"
                    : "var(--bg-secondary, rgba(0,0,0,0.03))",
                border:
                  activeTab === "analytics"
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid transparent",
                color:
                  activeTab === "analytics"
                    ? "var(--accent-color)"
                    : "var(--text-primary)",
                fontWeight: activeTab === "analytics" ? 700 : 500,
                fontSize: "13.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <BarChart3 size={18} />
                <span>Dashboard Analytics</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </button>

            {/* Input SS Tab */}
            <button
              type="button"
              onClick={() => handleTabClick("input")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  activeTab === "input"
                    ? "rgba(59, 130, 246, 0.12)"
                    : "var(--bg-secondary, rgba(0,0,0,0.03))",
                border:
                  activeTab === "input"
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid transparent",
                color:
                  activeTab === "input"
                    ? "var(--accent-color)"
                    : "var(--text-primary)",
                fontWeight: activeTab === "input" ? 700 : 500,
                fontSize: "13.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Edit3 size={18} />
                <span>Input SS (Form Harian)</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </button>

            {/* Unit Tab */}
            <button
              type="button"
              onClick={() => handleTabClick("units")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  activeTab === "units"
                    ? "rgba(59, 130, 246, 0.12)"
                    : "var(--bg-secondary, rgba(0,0,0,0.03))",
                border:
                  activeTab === "units"
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid transparent",
                color:
                  activeTab === "units"
                    ? "var(--accent-color)"
                    : "var(--text-primary)",
                fontWeight: activeTab === "units" ? 700 : 500,
                fontSize: "13.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Bus size={18} />
                <span>Daftar Unit Armada</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
            </button>
          </div>
        </div>

        {/* SECTION 2: Fitur & Utilitas */}
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
            {/* Rekap Akumulasi */}
            <button
              type="button"
              onClick={handleAccumulationClick}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--bg-secondary, rgba(0,0,0,0.03))",
                border: "1px solid transparent",
                color: "var(--text-primary)",
                fontWeight: 500,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Layers size={18} style={{ color: "var(--accent-color)" }} />
                <span>Rekap Akumulasi Lintas Periode</span>
              </div>
              <ChevronRight size={16} style={{ opacity: 0.5 }} />
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
                background: "var(--bg-secondary, rgba(0,0,0,0.03))",
                border: "1px solid transparent",
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
                  <Sun size={18} style={{ color: "#eab308" }} />
                ) : (
                  <Moon size={18} style={{ color: "#6366f1" }} />
                )}
                <span>Mode Tampilan</span>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--bg-card)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
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
                  background: "rgba(234, 179, 8, 0.08)",
                  border: "1px solid rgba(234, 179, 8, 0.2)",
                  color: "var(--warning-color, #eab308)",
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
                      background: "#eab308",
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

        {/* SECTION 3: Manajemen Akun (Logout) */}
        <div>
          {!showLogoutConfirm ? (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <LogOut size={18} />
              <span>Keluar Akun (Logout)</span>
            </button>
          ) : (
            <div
              style={{
                padding: "14px",
                borderRadius: "14px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                animation: "fadeIn 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#ef4444",
                  fontWeight: 700,
                  fontSize: "13.5px",
                }}
              >
                <AlertTriangle size={18} />
                <span>Konfirmasi Keluar Akun</span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                Apakah Anda yakin ingin keluar? Sesi Anda akan diakhiri.
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "10px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    handleDismiss();
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "10px",
                    background: "#ef4444",
                    border: "none",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
