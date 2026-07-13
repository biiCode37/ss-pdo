import { useState } from 'react';
import { signIn } from '../services/googleSheets';
import { LogIn, Loader2, Settings } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onOpenSettings: () => void;
}

export function LoginScreen({ onLoginSuccess, onOpenSettings }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.error !== 'popup_closed_by_user') {
        setError('Gagal login. Pastikan Anda mengizinkan popup Google dan Settings API sudah diatur.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <div className="glass" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          marginBottom: '8px',
          background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          PDO Mobile
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Aplikasi penginputan data shift bus harian langsung ke Google Sheets.
        </p>
        
        {error && <div className="error-text" style={{ marginBottom: '16px' }}>{error}</div>}

        <button className="btn" onClick={handleLogin} disabled={isLoading} style={{ marginBottom: '16px' }}>
          {isLoading ? <Loader2 className="spinner" size={20} /> : <LogIn size={20} />}
          Sign In with Google
        </button>

        <button className="btn btn-outline" onClick={onOpenSettings} disabled={isLoading}>
          <Settings size={20} />
          Pengaturan API (Wajib di awal)
        </button>
      </div>
    </div>
  );
}
