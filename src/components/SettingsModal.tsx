import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getGoogleCreds } from '../services/googleSheets';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsModal({ onClose, onSaved }: Props) {
  const [clientId, setClientId] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const creds = getGoogleCreds();
    setClientId(creds.clientId);
    setApiKey(creds.apiKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GAPI_CLIENT_ID', clientId.trim());
    localStorage.setItem('GAPI_API_KEY', apiKey.trim());
    onSaved();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Pengaturan API</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Masukkan Google OAuth Client ID dan API Key Anda agar aplikasi ini dapat membaca dan menulis ke Google Sheets. Data ini hanya disimpan lokal di HP Anda.
        </p>

        <div className="input-group">
          <label>OAuth Client ID</label>
          <input 
            type="text" 
            className="input-field" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxx.apps.googleusercontent.com"
          />
        </div>

        <div className="input-group">
          <label>API Key</label>
          <input 
            type="text" 
            className="input-field" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
          />
        </div>

        <button className="btn" onClick={handleSave} style={{ marginTop: '16px' }}>
          <Save size={20} /> Simpan Pengaturan
        </button>
      </div>
    </div>
  );
}
