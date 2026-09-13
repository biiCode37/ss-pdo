import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ProfileUserCard } from "./profileMenu/ProfileUserCard";
import { ProfileAdminSection } from "./profileMenu/ProfileAdminSection";
import { ProfileFeaturesSection } from "./profileMenu/ProfileFeaturesSection";
import { ProfileMenuFooter } from "./profileMenu/ProfileMenuFooter";
import { useProfileData } from "./profileMenu/useProfileData";
import { useSheetGesture } from "./profileMenu/useSheetGesture";
import type { ProfileMenuSheetProps } from "./profileMenu/types";

export function ProfileMenuSheet({
  isOpen,
  onClose,
  onOpenAccumulation,
  onOpenRegionalMonitoring,
  onOpenUserManagement,
  isDarkMode,
  onToggleTheme,
  offlineQueueCount,
  isOnline,
  onLogout,
  onFormatWholeSheet,
  currentTabName,
  hasActiveData,
}: ProfileMenuSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { userProfile, avatarFailed, setAvatarFailed } = useProfileData(isOpen);

  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef(0);
  const isClosingRef = useRef(false);

  const handleDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTimeout(onClose, 220);
  };

  // BUG-58: Ref agar listener Escape memanggil handleDismiss terbaru
  // (closure lama selalu melihat isClosing=false → dismiss ganda)
  const handleDismissRef = useRef(handleDismiss);
  handleDismissRef.current = handleDismiss;

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSheetGesture({
    contentRef,
    overlayRef,
    onDismiss: handleDismiss,
  });

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      setIsClosing(false);
      isClosingRef.current = false;
      return;
    }

    mountTimeRef.current = Date.now();

    const frameId = requestAnimationFrame(() => setIsMounted(true));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismissRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
          maxHeight: "min(88dvh, 760px)",
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
          transform:
            isClosing || !isMounted
              ? "translateY(100%) scale(0.95)"
              : "translateY(0px) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ProfileUserCard
          userProfile={userProfile}
          avatarFailed={avatarFailed}
          onAvatarError={() => setAvatarFailed(true)}
          onDismiss={handleDismiss}
        />

        <ProfileAdminSection
          role={userProfile.role}
          onClose={onClose}
          onOpenUserManagement={onOpenUserManagement}
        />

        <ProfileFeaturesSection
          onDismiss={handleDismiss}
          onOpenRegionalMonitoring={onOpenRegionalMonitoring}
          onOpenAccumulation={onOpenAccumulation}
          onFormatWholeSheet={onFormatWholeSheet}
          currentTabName={currentTabName}
          hasActiveData={hasActiveData}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          isOnline={isOnline}
          offlineQueueCount={offlineQueueCount}
        />

        <ProfileMenuFooter onLogout={onLogout} onDismiss={handleDismiss} />
      </div>
    </div>,
    document.body,
  );
}
export default ProfileMenuSheet;
