import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { initGoogleApi, checkSignedIn, signOut, hasGoogleCreds } from './services/googleSheets';

import { formatUserError } from './utils/errorFormatter';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  // BUG-15: Guard untuk mencegah double-init di StrictMode
  const initCalledRef = useRef(false);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError(formatUserError('API Credentials missing'));
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsApiReady(true);
      setIsSignedIn(checkSignedIn());
    } catch (err: any) {
      setInitError(formatUserError(err, 'Gagal menginisialisasi layanan Google API.'));
    }
  };

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initializeApi();
  }, []);

  // Listen to session expiration / insufficient scope events
  useEffect(() => {
    const handleAuthExpired = () => {
      // Menjaga status login tetap aktif (Aturan Emas #3: No Timeout/Logout Paksa).
      // Pembaruan token ditangani oleh Dashboard secara inline/popup tanpa melempar pengguna ke LoginScreen.
    };
    window.addEventListener('google-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('google-auth-expired', handleAuthExpired);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsSignedIn(false);
  };

  return (
    <>
      {!isSignedIn ? (
        <LoginScreen onLoginSuccess={() => setIsSignedIn(true)} isApiReady={isApiReady} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}

      {initError && (
        <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'var(--danger-color)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', zIndex: 50 }}>
          {initError}
        </div>
      )}
    </>
  );
}
