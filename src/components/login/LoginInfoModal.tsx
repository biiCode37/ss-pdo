import { useState, memo } from "react";
import { TEXT_AUTH } from "@/constants/texts";
import { LoginInfoHeader } from "./LoginInfoHeader";
import { LoginInfoAboutSection } from "./LoginInfoAboutSection";
import { LoginInfoComparisonSection } from "./LoginInfoComparisonSection";
import { LoginInfoPermissionsSection } from "./LoginInfoPermissionsSection";

export interface LoginInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LoginInfoModalComponent({ isOpen, onClose }: LoginInfoModalProps) {
  const [showSheetsScopeDetails, setShowSheetsScopeDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay login-info-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "flex-end", // Mobile bottom sheet style
        justifyContent: "center",
        zIndex: 1050,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="glass login-info-sheet no-scrollbar"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "min(90dvh, 760px)",
          overflowY: "auto",
          padding: "20px 20px 32px",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          textAlign: "left",
          position: "relative",
          backgroundColor: "var(--bg-card, #171717)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
          animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LoginInfoHeader onClose={onClose} />
        <LoginInfoAboutSection />
        <LoginInfoComparisonSection />
        <LoginInfoPermissionsSection
          showDetails={showSheetsScopeDetails}
          onToggleDetails={() => setShowSheetsScopeDetails((prev) => !prev)}
        />

        {/* Close Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          {TEXT_AUTH.INFO_MODAL_CLOSE}
        </button>
      </div>
    </div>
  );
}

export const LoginInfoModal = memo(LoginInfoModalComponent);
export default LoginInfoModal;
