import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { initGoogleApi, checkSignedIn, signOut, hasGoogleCreds } from './services/googleSheets';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setInitError('Kredensial API tidak ditemukan di Environment Variables.');
      return;
    }
    
    try {
      setInitError(null);
      await initGoogleApi();
      setIsSignedIn(checkSignedIn());
    } catch (err: any) {
      console.error('Failed to init Google API:', err);
      setInitError('Gagal menginisialisasi Google API. Cek kembali API Key dan Client ID Anda.');
    }
  };

  useEffect(() => {
    if (hasGoogleCreds()) {
      initializeApi();
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsSignedIn(false);
  };

  return (
    <>
      {!isSignedIn ? (
        <LoginScreen onLoginSuccess={() => setIsSignedIn(true)} />
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
