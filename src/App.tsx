import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { initGoogleApi, checkSignedIn, signOut, hasGoogleCreds } from './services/googleSheets';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  // BUG-15: Guard untuk mencegah double-init di StrictMode
  const initCalledRef = useRef(false);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError('Kredensial API tidak ditemukan di Environment Variables.');
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsApiReady(true);
      setIsSignedIn(checkSignedIn());
    } catch (err: any) {
      setInitError('Gagal menginisialisasi Google API. Cek kembali API Key dan Client ID Anda.');
    }
  };

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initializeApi();
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
