import React, { useEffect, useLayoutEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { acquireScrollLock } from "@/utils/scrollLockCoordinator";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";

export interface ModalShellProps {
  /** Menentukan apakah dialog sedang terbuka */
  isOpen: boolean;
  /** Callback saat modal diminta ditutup (Escape, backdrop, atau back button) */
  onClose?: () => void;
  /** Judul / accessible name untuk dialog (mengisi aria-label) */
  title?: string;
  /** Nilai aria-label alternatif */
  ariaLabel?: string;
  /** ID elemen judul untuk aria-labelledby */
  ariaLabelledBy?: string;
  /** ID elemen deskripsi untuk aria-describedby */
  ariaDescribedBy?: string;
  /** ID unik untuk modal (digunakan juga untuk back navigation stack) */
  id?: string;
  /** ID khusus untuk useMobileBackHandler jika berbeda dari id modal */
  backHandlerId?: string;
  /** Isi konten di dalam dialog */
  children: React.ReactNode;
  /** Pertahankan mounting DOM saat tertutup (misal untuk menjaga form state), default false */
  keepMounted?: boolean;
  /** Tutup modal saat area backdrop di luar konten di-klik, default true */
  closeOnBackdropClick?: boolean;
  /** Tutup modal saat tombol Escape ditekan, default true */
  closeOnEscape?: boolean;
  /** Target container untuk portal, default document.body */
  portalTarget?: HTMLElement | null;
  /** Matikan portal dan render inline di DOM tree */
  disablePortal?: boolean;
  /** ClassName kustom untuk overlay backdrop */
  backdropClassName?: string;
  /** Gaya CSS kustom untuk overlay backdrop */
  backdropStyle?: React.CSSProperties;
  /** ClassName kustom untuk kartu/konten dialog */
  contentClassName?: string;
  /** Gaya CSS kustom untuk kartu/konten dialog */
  contentStyle?: React.CSSProperties;
  /** z-index kustom untuk backdrop overlay */
  zIndex?: number;
  /** Ref elemen yang akan menerima fokus awal */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Kembalikan fokus ke elemen pemicu saat modal ditutup, default true */
  restoreFocus?: boolean;
  /** Event handler touch pasif / kontrol */
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
}

import {
  registerModalDismiss,
  isTopmostModal,
  getHighestActiveZIndex,
  getTopmostModalExcluding,
} from "@/utils/modalStackCoordinator";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  id: providedId,
  backHandlerId,
  children,
  keepMounted = false,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  portalTarget,
  disablePortal = false,
  backdropClassName = "",
  backdropStyle,
  contentClassName = "",
  contentStyle,
  zIndex,
  initialFocusRef,
  restoreFocus = true,
  onTouchStart,
  onTouchMove,
}) => {
  const generatedId = useId();
  const id = providedId || generatedId;

  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // MITIGASI R97-01: Simpan onClose terbaru di ref tanpa merender ulang / mengubah urutan stack
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  // MITIGASI R97-02: Hindari membaca/menulis ref saat render dan hindari cascading setState.
  // Lapisan z-index dihitung dan diterapkan secara deterministik pada lifecycle layout effect.
  const baseZIndex = zIndex ?? 100;

  // 1. Android / Mobile Hardware Back Handler
  useMobileBackHandler({
    id: backHandlerId || id,
    isOpen: Boolean(isOpen && onClose),
    onClose: () => {
      onCloseRef.current?.();
    },
  });

  // 2. Coordinated Body Scroll Lock (Reference Counting)
  useEffect(() => {
    if (!isOpen) return;
    const releaseLock = acquireScrollLock();
    return () => {
      releaseLock();
    };
  }, [isOpen]);

  // 3. Focus Management (Initial Focus, Trap, & Safe Restoration)
  useEffect(() => {
    if (!isOpen) return;

    if (typeof document !== "undefined") {
      previousActiveElementRef.current =
        (document.activeElement as HTMLElement) || null;
    }

    // Pindahkan fokus ke dalam dialog aktif
    const frameId = requestAnimationFrame(() => {
      if (!isOpen) return;
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      if (contentRef.current) {
        const autofocusEl =
          contentRef.current.querySelector<HTMLElement>("[autofocus]");
        if (autofocusEl) {
          autofocusEl.focus();
          return;
        }

        const focusable =
          contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
          return;
        }

        // Fallback: fokuskan kontainer dialog itu sendiri
        contentRef.current.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frameId);

      // MITIGASI R95-03: Restorasi fokus hanya jika tidak mengganggu modal lain yang masih aktif
      if (restoreFocus && previousActiveElementRef.current) {
        const otherTopmost = getTopmostModalExcluding(id);
        if (otherTopmost) {
          // Masih ada modal lain yang aktif di layar
          const currentActive =
            typeof document !== "undefined" ? document.activeElement : null;
          if (typeof document !== "undefined") {
            const otherEl = document.getElementById(otherTopmost.id);
            if (otherEl && otherEl.contains(currentActive)) {
              // Fokus sudah berada di dalam modal aktif yang lain, biarkan tetap di sana
              return;
            }
            if (otherEl) {
              const targetFocus =
                otherEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ||
                otherEl;
              targetFocus?.focus();
              return;
            }
          }
          return;
        }

        // Modal terakhir ditutup: pulihkan ke elemen pemicu semula
        if (
          typeof document !== "undefined" &&
          document.body.contains(previousActiveElementRef.current)
        ) {
          previousActiveElementRef.current.focus();
        }
      }
    };
  }, [isOpen, id, initialFocusRef, restoreFocus]);

  // 4. Keyboard Interactions (Topmost Escape & Focus Trap Tab / Shift+Tab) & Stack Registration
  // MITIGASI R97-01 & R97-02: Efek registrasi TIDAK bergantung pada onClose dan tidak memicu render cascading.
  // Urutan stack LIFO tetap stabil saat parent merender ulang.
  useLayoutEffect(() => {
    if (!isOpen) {
      if (backdropRef.current) {
        backdropRef.current.style.zIndex = String(baseZIndex);
      }
      return;
    }

    const highestActiveZ = getHighestActiveZIndex();
    const allocatedZ =
      highestActiveZ > 0 ? Math.max(baseZIndex, highestActiveZ + 10) : baseZIndex;

    if (backdropRef.current) {
      backdropRef.current.style.zIndex = String(allocatedZ);
    }

    const unregister = registerModalDismiss({
      id,
      onDismiss: () => {
        onCloseRef.current?.();
      },
      zIndex: allocatedZ,
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hanya dialog teratas (topmost) yang memproses Escape & Focus Trap
      if (!isTopmostModal(id)) return;

      if (e.key === "Escape") {
        if (closeOnEscape && onCloseRef.current) {
          e.preventDefault();
          e.stopPropagation();
          onCloseRef.current();
        }
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusableEls =
          contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

        if (focusableEls.length === 0) {
          e.preventDefault();
          contentRef.current.focus();
          return;
        }

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstEl ||
            document.activeElement === contentRef.current
          ) {
            e.preventDefault();
            lastEl.focus();
          }
        } else if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unregister();
    };
  }, [isOpen, id, baseZIndex, closeOnEscape]);

  // Handle Backdrop Click (hanya menutup jika klik terjadi pada backdrop, bukan isi konten)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick && onCloseRef.current) {
      onCloseRef.current();
    }
  };

  if (!isOpen && !keepMounted) {
    return null;
  }

  const effectiveAriaLabel = ariaLabel || title;

  const overlayElement = (
    <div
      id={id}
      ref={backdropRef}
      aria-hidden={!isOpen ? "true" : undefined}
      className={`modal-shell-backdrop ${backdropClassName}`.trim()}
      onClick={handleBackdropClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: isOpen ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        zIndex: baseZIndex,
        ...backdropStyle,
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-label={effectiveAriaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`modal-shell-content ${contentClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        style={{
          outline: "none",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );

  if (disablePortal || typeof document === "undefined") {
    return overlayElement;
  }

  const target = portalTarget ?? document.body;
  return createPortal(overlayElement, target);
};

export default ModalShell;
