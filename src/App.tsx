import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { initGoogleApi, checkSignedIn, signOut, hasGoogleCreds } from './services/googleSheets';

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const initializeApi = async () => {
    if (!hasGoogleCreds()) {
      setIsSettingsOpen(true);
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
    // Attempt initialization on mount if creds exist
    if (hasGoogleCreds()) {
      initializeApi();
    }
  }, []);

  const handleSettingsSaved = () => {
    setIsSettingsOpen(false);
    initializeApi(); // Re-initialize with new creds
  };

  const handleLogout = async () => {
    await signOut();
    setIsSignedIn(false);
  };

  return (
    <>
      {!isSignedIn ? (
        <LoginScreen 
          onLoginSuccess={() => setIsSignedIn(true)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <Dashboard 
          onLogout={handleLogout} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      {initError && !isSettingsOpen && (
        <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, background: 'var(--danger-color)', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', zIndex: 50 }}>
          {initError}
        </div>
      )}
    </>
  );
}
