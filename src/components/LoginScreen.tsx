import { useState } from "react";
import { signIn } from "../services/googleSheets";
import { upsertUserProfile } from "../services/routeService";
import { LogIn, Loader2 } from "lucide-react";
import { formatUserError } from "../utils/errorFormatter";

interface Props {
  onLoginSuccess: () => void;
  isApiReady: boolean;
}

export function LoginScreen({ onLoginSuccess, isApiReady }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      // Sync user profile to Supabase (fire and forget / non-blocking)
      const userEmail = localStorage.getItem('PDO_USER_EMAIL') || 'user@pusm.id';
      const userName = localStorage.getItem('PDO_USER_NAME') || 'Petugas PUSM';
      upsertUserProfile({ email: userEmail, full_name: userName }).catch(() => {});

      onLoginSuccess();
    } catch (err: any) {
      const userMessage = formatUserError(err);
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: "center" }}>
      <div
        className="glass"
        style={{ padding: "40px 24px", textAlign: "center" }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "8px",
            background: "linear-gradient(135deg, var(--accent-color), #8b5cf6)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PUSM
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
          PDO Utara Spreadsheet Mobile
        </p>

        {error && (
          <div className="error-text" style={{ marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <button
          className="btn"
          onClick={handleLogin}
          disabled={isLoading || !isApiReady}
          style={{ marginBottom: "16px", opacity: isApiReady ? 1 : 0.5 }}
        >
          {isLoading ? (
            <Loader2 className="spinner" size={20} />
          ) : (
            <LogIn size={20} />
          )}
          Sign In with Google
        </button>
      </div>
    </div>
  );
}
