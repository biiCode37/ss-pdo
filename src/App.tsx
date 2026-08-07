import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { initGoogleApi, checkSignedInAsync, signOut, hasGoogleCreds } from './services/googleSheets';
import type { AuthResult } from './services/googleSheets';
import { useUserActivityTracking } from './hooks/useUserActivityTracking';

import { formatUserError } from './utils/errorFormatter';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  // BUG-15: Guard untuk mencegah double-init di StrictMode
  const initCalledRef = useRef(false);

  // Telemetry: Heartbeat durasi aktif pengguna
  const userEmail = localStorage.getItem('PDO_USER_EMAIL') || undefined;
  useUserActivityTracking(isSignedIn, userEmail);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError(formatUserError('API Credentials missing'));
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsApiReady(true);
      // ISS-01: Async token validation saat startup
      const authResult: AuthResult = await checkSignedInAsync();
      setIsSignedIn(authResult.authenticated);
      if (authResult.reason === 'needs_reauth') {
        setNeedsReauth(true);
      }
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
      // ISS-01: Set needs_reauth agar Dashboard menampilkan re-auth prompt
      setNeedsReauth(true);
    };
    window.addEventListener('google-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('google-auth-expired', handleAuthExpired);
  }, []);

  // ISS-01: Listen for successful token refresh, clear needs_reauth
  useEffect(() => {
    const handleLoginSuccess = () => {
      setNeedsReauth(false);
    };
    window.addEventListener('google-login-success', handleLoginSuccess);
    return () => window.removeEventListener('google-login-success', handleLoginSuccess);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsSignedIn(false);
    setNeedsReauth(false);
  };

  return (
    <>
      {!isSignedIn ? (
        <LoginScreen onLoginSuccess={() => setIsSignedIn(true)} isApiReady={isApiReady} />
      ) : (
        <Dashboard onLogout={handleLogout} needsReauth={needsReauth} />
      )}

      {initError && (
        <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'var(--danger-color)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', zIndex: 50 }}>
          {initError}
        </div>
      )}
    </>
  );
}

