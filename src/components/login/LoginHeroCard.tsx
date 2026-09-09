import { LogIn, Loader2, Info } from "lucide-react";
import { TEXT_AUTH, TEXT_DASHBOARD } from "../../constants/texts";

interface LoginHeroCardProps {
  isLoading: boolean;
  isApiReady: boolean;
  error: string | null;
  onLogin: () => void;
  onOpenInfo: () => void;
}

export function LoginHeroCard({
  isLoading,
  isApiReady,
  error,
  onLogin,
  onOpenInfo,
}: LoginHeroCardProps) {
  return (
    <div
      className="glass login-hero-card"
      style={{
        padding: "32px 20px 28px",
        textAlign: "center",
        marginBottom: "16px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
      }}
    >
      {/* Radial Glow Accent */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "220px",
          height: "220px",
          background:
            "radial-gradient(circle, rgba(62, 207, 142, 0.22) 0%, rgba(62, 207, 142, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <img
        src="/app-logo.png"
        alt="Logo PUSM"
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 14px auto",
          borderRadius: "20px",
          display: "block",
          filter: "drop-shadow(0 8px 20px rgba(62, 207, 142, 0.28))",
        }}
      />

      <h1
        style={{
          fontSize: "28px",
          fontWeight: 800,
          letterSpacing: "-0.5px",
          marginBottom: "4px",
          background: "var(--title-gradient)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.2,
        }}
        aria-label={`${TEXT_DASHBOARD.APP_TITLE} - ${TEXT_DASHBOARD.APP_SUBTITLE}`}
      >
        {TEXT_DASHBOARD.APP_TITLE}
        <span
          style={{
            display: "block",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: "4px",
            letterSpacing: "-0.2px",
            WebkitTextFillColor: "initial",
          }}
        >
          {TEXT_DASHBOARD.APP_SUBTITLE}
        </span>
      </h1>

      <div
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "20px",
          backgroundColor: "rgba(62, 207, 142, 0.12)",
          border: "1px solid rgba(62, 207, 142, 0.3)",
          color: "var(--accent-color, #3ECF8E)",
          fontSize: "11.5px",
          fontWeight: 700,
          marginBottom: "12px",
          letterSpacing: "0.2px",
        }}
      >
        {TEXT_AUTH.BADGE}
      </div>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "13.5px",
          lineHeight: 1.5,
          marginBottom: "22px",
          maxWidth: "460px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {TEXT_AUTH.HERO_DESC}
      </p>

      {error && (
        <div
          className="error-text"
          role="alert"
          style={{
            marginBottom: "18px",
            padding: "10px 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            fontSize: "13px",
            textAlign: "left",
            lineHeight: 1.45,
          }}
        >
          {error}
        </div>
      )}

      {/* Main Google Login Action Button */}
      <button
        type="button"
        className="btn"
        onClick={onLogin}
        disabled={isLoading || !isApiReady}
        data-testid="google-login-btn"
        style={{
          width: "100%",
          maxWidth: "360px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "14px 20px",
          fontSize: "15px",
          fontWeight: 700,
          borderRadius: "14px",
          opacity: isApiReady ? 1 : 0.5,
          cursor: isApiReady && !isLoading ? "pointer" : "not-allowed",
          transition: "transform 0.15s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.15s ease",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="spinner" size={20} />
            <span>{TEXT_AUTH.SIGN_IN_LOADING}</span>
          </>
        ) : (
          <>
            <LogIn size={20} />
            <span>{TEXT_AUTH.SIGN_IN_BTN}</span>
          </>
        )}
      </button>

      <p
        style={{
          fontSize: "11.5px",
          color: "var(--text-secondary)",
          marginTop: "12px",
          marginBottom: "14px",
        }}
      >
        {TEXT_AUTH.ACCOUNT_HINT}
      </p>

      {/* Info Trigger Button */}
      <button
        type="button"
        onClick={onOpenInfo}
        data-testid="open-info-modal-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 14px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
          color: "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        <Info size={14} color="var(--accent-color, #3ECF8E)" />
        <span>Pelajari Aplikasi & Izin Akses</span>
      </button>
    </div>
  );
}
