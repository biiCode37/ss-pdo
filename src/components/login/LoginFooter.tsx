import React from "react";
import { ShieldCheck, FileText, Mail } from "lucide-react";
import { TEXT_AUTH } from "../../constants/texts";
import type { LegalModalType } from "./LegalModals";

interface LoginFooterProps {
  onSelectModal: (modal: LegalModalType) => void;
}

export function LoginFooter({ onSelectModal }: LoginFooterProps) {
  const handleLinkClick = (e: React.MouseEvent, type: LegalModalType, hash: string) => {
    e.preventDefault();
    window.location.hash = hash;
    onSelectModal(type);
  };

  return (
    <footer
      className="login-footer"
      style={{
        textAlign: "center",
        paddingTop: "14px",
        marginTop: "8px",
        borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <a
          href="#privacy"
          onClick={(e) => handleLinkClick(e, "privacy", "privacy")}
          data-testid="legal-link-privacy"
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-color, #3ECF8E)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px",
            textDecoration: "none",
          }}
        >
          <ShieldCheck size={14} />
          <span>{TEXT_AUTH.LEGAL.PRIVACY}</span>
        </a>

        <a
          href="#terms"
          onClick={(e) => handleLinkClick(e, "terms", "terms")}
          data-testid="legal-link-terms"
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-color, #3ECF8E)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px",
            textDecoration: "none",
          }}
        >
          <FileText size={14} />
          <span>{TEXT_AUTH.LEGAL.TERMS}</span>
        </a>

        <a
          href="#developer"
          onClick={(e) => handleLinkClick(e, "developer", "developer")}
          data-testid="legal-link-developer"
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-color, #3ECF8E)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px",
            textDecoration: "none",
          }}
        >
          <Mail size={14} />
          <span>{TEXT_AUTH.LEGAL.DEVELOPER}</span>
        </a>
      </div>

      <p
        style={{
          fontSize: "11px",
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {TEXT_AUTH.LEGAL.COPYRIGHT}
      </p>
    </footer>
  );
}
