import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { updateBusData, getBusRowData } from '../services/googleSheets';
import { isNetworkError } from '../hooks/useOfflineSync';
import { ChevronDown, ChevronUp, Save, Loader2, Check, Copy } from 'lucide-react';

interface Props {
  bus: BusData;
  sheetId: string;
  tabName: string;
  headerMap: HeaderMap;
  isQueued: boolean;
  addToQueue: (item: any) => void;
  activeCategory: string;
  onUpdateBus?: (updates: Partial<BusData>) => void;
}

export function BusCard({ bus, sheetId, tabName, headerMap, isQueued, addToQueue, activeCategory, onUpdateBus }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const draftKey = `draft_bus_${sheetId}_${tabName}_${bus.rowIndex}`;

  const isDirtyRef = useRef(false);

  const [formData, setFormData] = useState<Partial<BusData>>(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        const getVal = (key: keyof BusData): string => {
          const dVal = parsed[key];
          if (dVal !== undefined && dVal !== null && String(dVal).trim() !== '') {
            return String(dVal);
          }
          const bVal = bus[key];
          return typeof bVal === 'string' ? bVal : '';
        };
        return {
          toaShift1: getVal('toaShift1'),
          manualShift1: getVal('manualShift1'),
          manualShift2: getVal('manualShift2'),
          totalToa: getVal('totalToa'),
          kmAwal1: getVal('kmAwal1'),
          kmAkhir1: getVal('kmAkhir1'),
          kmAwal2: getVal('kmAwal2'),
          kmAkhir2: getVal('kmAkhir2'),
          keterangan: getVal('keterangan'),
        };
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return {
      toaShift1: bus.toaShift1 || '',
      manualShift1: bus.manualShift1 || '',
      manualShift2: bus.manualShift2 || '',
      totalToa: bus.totalToa || '',
      kmAwal1: bus.kmAwal1 || '',
      kmAkhir1: bus.kmAkhir1 || '',
      kmAwal2: bus.kmAwal2 || '',
      kmAkhir2: bus.kmAkhir2 || '',
      keterangan: bus.keterangan || '',
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'queued'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [conflictData, setConflictData] = useState<Partial<BusData> | null>(null);

  const debouncedFormData = useDebounce(formData, 1000);

  // Sync formData when bus prop changes from reload/refresh (if not dirty)
  useEffect(() => {
    if (!isDirtyRef.current) {
      setFormData({
        toaShift1: bus.toaShift1 || '',
        manualShift1: bus.manualShift1 || '',
        manualShift2: bus.manualShift2 || '',
        totalToa: bus.totalToa || '',
        kmAwal1: bus.kmAwal1 || '',
        kmAkhir1: bus.kmAkhir1 || '',
        kmAwal2: bus.kmAwal2 || '',
        kmAkhir2: bus.kmAkhir2 || '',
        keterangan: bus.keterangan || '',
      });
    }
  }, [bus]);

  const inputRefs = {
    toaShift1: useRef<HTMLInputElement>(null),
    totalToa: useRef<HTMLInputElement>(null),
    manualShift1: useRef<HTMLInputElement>(null),
    manualShift2: useRef<HTMLInputElement>(null),
    kmAwal1: useRef<HTMLInputElement>(null),
    kmAkhir1: useRef<HTMLInputElement>(null),
    kmAwal2: useRef<HTMLInputElement>(null),
    kmAkhir2: useRef<HTMLInputElement>(null),
    keterangan: useRef<HTMLInputElement>(null),
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      handleSave(false);
    }
  };

  useEffect(() => {
    // Only save draft when user has actively edited the fields
    if (isDirtyRef.current) {
      localStorage.setItem(draftKey, JSON.stringify(debouncedFormData));
    }
  }, [debouncedFormData, draftKey]);

  // BUG-09: Simpan draft segera saat user meninggalkan halaman
  useEffect(() => {
    const saveImmediately = () => {
      if (isDirtyRef.current) {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveImmediately();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', saveImmediately);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', saveImmediately);
    };
  }, [formData, draftKey]);

  useEffect(() => {
    if (isExpanded && activeCategory !== 'ALL') {
      const timer = setTimeout(() => {
        const ref = inputRefs[activeCategory as keyof typeof inputRefs];
        if (ref && ref.current && !ref.current.disabled) {
          ref.current.focus();
        }
      }, 300); // Tunggu animasi expand selesai
      return () => clearTimeout(timer);
    }
  }, [isExpanded, activeCategory]);

  const handleChange = (field: keyof BusData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    isDirtyRef.current = true;
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setSaveStatus('idle');
    setError(null);
  };

  const handleCopyKm = () => {
    if (formData.kmAkhir1) {
      isDirtyRef.current = true;
      setFormData(prev => ({ ...prev, kmAwal2: prev.kmAkhir1 }));
      setSaveStatus('idle');
      setError(null);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async (forceOverwrite = false) => {
    // Validation
    const checkKm = (awal?: string, akhir?: string) => {
      if (awal && akhir) {
        const numAwal = Number(awal);
        const numAkhir = Number(akhir);
        if (!isNaN(numAwal) && !isNaN(numAkhir) && numAkhir < numAwal) {
          return false;
        }
      }
      return true;
    };

    if (!checkKm(formData.kmAwal1, formData.kmAkhir1)) {
      setError('KM Akhir Shift 1 tidak boleh lebih kecil dari KM Awal Shift 1');
      return;
    }
    if (!checkKm(formData.kmAwal2, formData.kmAkhir2)) {
      setError('KM Akhir Shift 2 tidak boleh lebih kecil dari KM Awal Shift 2');
      return;
    }
    if (!checkKm(formData.kmAkhir1, formData.kmAwal2)) {
      setError('KM Awal Shift 2 tidak boleh lebih kecil dari KM Akhir Shift 1');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!forceOverwrite) {
        // Pre-flight check
        const remoteData = await getBusRowData(sheetId, tabName, bus.rowIndex, headerMap);
        
        // Cek apakah ada field yang berubah dari snapshot asli (bus props)
        const fieldsToCheck: (keyof BusData)[] = [
          'toaShift1', 'manualShift1', 'manualShift2', 'totalToa',
          'kmAwal1', 'kmAkhir1', 'kmAwal2', 'kmAkhir2', 'keterangan'
        ];
        
        let hasCollision = false;
        for (const field of fieldsToCheck) {
          if ((remoteData[field] || '') !== (bus[field] || '')) {
            hasCollision = true;
            break;
          }
        }

        if (hasCollision) {
          setConflictData(remoteData);
          setIsLoading(false);
          return; // Hentikan penyimpanan
        }
      }

      await updateBusData(sheetId, tabName, bus.rowIndex, formData, headerMap);
      isDirtyRef.current = false;
      setSaveStatus('success');
      localStorage.removeItem(draftKey);
      setConflictData(null);
      if (onUpdateBus) {
        onUpdateBus(formData);
      }
      setIsExpanded(false); // Auto close immediately on success
    } catch (err: any) {
      if (err.message && err.message.includes('API Credentials missing')) {
        setError('Sesi login telah habis. Silakan refresh dan login ulang.');
      } else if (err.status === 401 || err.message?.includes('Auth') || err.message?.includes('Credentials')) {
        setError('Akses ditolak. Sesi mungkin kadaluarsa. Silakan login ulang.');
      } else if (isNetworkError(err)) {
        // BUG-03: Hanya masukkan ke antrean jika benar-benar error jaringan
        // BUG-02: Sertakan originalSnapshot untuk collision detection di jalur antrean
        const originalSnapshot: Partial<BusData> = {
          toaShift1: bus.toaShift1,
          manualShift1: bus.manualShift1,
          manualShift2: bus.manualShift2,
          totalToa: bus.totalToa,
          kmAwal1: bus.kmAwal1,
          kmAkhir1: bus.kmAkhir1,
          kmAwal2: bus.kmAwal2,
          kmAkhir2: bus.kmAkhir2,
          keterangan: bus.keterangan,
        };
        addToQueue({ sheetId, tabName, rowIndex: bus.rowIndex, updates: formData, headerMap, originalSnapshot });
        isDirtyRef.current = false;
        setSaveStatus('queued');
        localStorage.removeItem(draftKey);
        setIsExpanded(false);
      } else {
        // BUG-03: Error permanen dari Google API (400/403/404) — tampilkan langsung ke user
        const apiMsg = err?.result?.error?.message || err?.message || 'Gagal menyimpan data.';
        setError(`Gagal menyimpan: ${apiMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const isFieldDisabled = (fieldName: string) => {
    if (isLoading) return true;
    if (activeCategory === 'ALL') return false;
    // BUG-07: Field pelengkap (catatan/manual) selalu aktif, bukan kolom kerja utama
    const alwaysEnabledFields = ['manualShift1', 'manualShift2', 'keterangan'];
    if (alwaysEnabledFields.includes(fieldName)) return false;
    return activeCategory !== fieldName;
  };

  const renderServerSummary = () => {
    const CATEGORY_LABELS: Record<string, string> = {
      toaShift1: 'TOA S1',
      totalToa: 'Total TOA',
      manualShift1: 'Manual S1',
      manualShift2: 'Manual S2',
      kmAwal1: 'KM Awal S1',
      kmAkhir1: 'KM Akhir S1',
      kmAwal2: 'KM Awal S2',
      kmAkhir2: 'KM Akhir S2',
      keterangan: 'Keterangan',
    };

    if (activeCategory !== 'ALL') {
      const val = bus[activeCategory as keyof BusData];
      const label = CATEGORY_LABELS[activeCategory] || activeCategory;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return <span style={{ color: 'var(--text-secondary)' }}>{label}: {val}</span>;
      }
      return <span style={{ color: '#f87171', fontWeight: 500 }}>Belum Terisi</span>;
    }

    const parts: string[] = [];
    if (bus.kmAwal1 || bus.kmAkhir1) {
      parts.push(`KM S1: ${bus.kmAwal1 || '-'}-${bus.kmAkhir1 || '-'}`);
    }
    if (bus.kmAwal2 || bus.kmAkhir2) {
      parts.push(`KM S2: ${bus.kmAwal2 || '-'}-${bus.kmAkhir2 || '-'}`);
    }
    if (bus.toaShift1) {
      parts.push(`TOA S1: ${bus.toaShift1}`);
    }
    if (parts.length === 0) {
      return <span style={{ color: '#f87171', fontWeight: 500 }}>Belum Terisi</span>;
    }
    return <span style={{ color: 'var(--text-secondary)' }}>{parts.join(' | ')}</span>;
  };

  return (
    <div className="bus-card glass">
      <div 
        className="bus-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="bus-card-title" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{bus.unit}</span>
            {(saveStatus === 'queued' || isQueued) && (
              <span className="bus-card-status status-queued">Menunggu Sinyal</span>
            )}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.9 }}>
            {renderServerSummary()}
          </div>
        </div>
        <div style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {formData.keterangan && formData.keterangan.trim() !== '' && (
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ 
            margin: '0 16px 16px 16px', 
            padding: '10px 12px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '8px', 
            borderLeft: '3px solid var(--accent-color)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            cursor: 'pointer'
          }}>
          <span style={{ fontSize: '14px', marginTop: '1px' }}>📝</span>
          <span style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>{formData.keterangan}</span>
        </div>
      )}

      {isExpanded && (
        <div className="bus-card-content">
          
          <div className="form-grid full">
            <div className="input-group">
              <label>TOA SHIFT 1</label>
              <input 
                ref={inputRefs.toaShift1}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.toaShift1 || ''} 
                onChange={handleChange('toaShift1')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('toaShift1')}
              />
            </div>
            <div className="input-group">
              <label>TOTAL TOA</label>
              <input 
                ref={inputRefs.totalToa}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.totalToa || ''} 
                onChange={handleChange('totalToa')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('totalToa')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>MANUAL SHIFT 1</label>
              <input 
                ref={inputRefs.manualShift1}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.manualShift1 || ''} 
                onChange={handleChange('manualShift1')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('manualShift1')}
              />
            </div>
            <div className="input-group">
              <label>MANUAL SHIFT 2</label>
              <input 
                ref={inputRefs.manualShift2}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.manualShift2 || ''} 
                onChange={handleChange('manualShift2')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('manualShift2')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>KM Awal Shift 1</label>
              <input 
                ref={inputRefs.kmAwal1}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAwal1 || ''} 
                onChange={handleChange('kmAwal1')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('kmAwal1')}
              />
            </div>
            <div className="input-group">
              <label>KM Akhir Shift 1</label>
              <input 
                ref={inputRefs.kmAkhir1}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAkhir1 || ''} 
                onChange={handleChange('kmAkhir1')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('kmAkhir1')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ marginBottom: 0 }}>KM Awal Shift 2</label>
                <button 
                  type="button"
                  onClick={handleCopyKm} 
                  disabled={isFieldDisabled('kmAwal2') || !formData.kmAkhir1}
                  aria-label="Salin KM Akhir 1"
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: isCopied ? 'var(--success-color)' : 'var(--accent-color)', 
                    cursor: 'pointer', 
                    padding: '4px', 
                    display: 'flex', 
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <input 
                ref={inputRefs.kmAwal2}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAwal2 || ''} 
                onChange={handleChange('kmAwal2')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('kmAwal2')}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label>KM Akhir Shift 2</label>
              <input 
                ref={inputRefs.kmAkhir2}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAkhir2 || ''} 
                onChange={handleChange('kmAkhir2')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('kmAkhir2')}
              />
            </div>
          </div>

          <div className="form-grid full">
            <div className="input-group">
              <label>KETERANGAN</label>
              <input 
                ref={inputRefs.keterangan}
                type="text" 
                className="input-field" 
                value={formData.keterangan || ''} 
                onChange={handleChange('keterangan')}
                onKeyDown={handleKeyDown}
                placeholder="Tambahkan keterangan..."
                disabled={isFieldDisabled('keterangan')}
              />
            </div>
          </div>

          {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

          {conflictData && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid var(--danger-color)', 
              borderRadius: '8px', 
              padding: '12px', 
              marginTop: '12px',
              marginBottom: '12px'
            }}>
              <h4 style={{ color: 'var(--danger-color)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚠️ Tabrakan Data Terdeteksi
              </h4>
              <p style={{ fontSize: '13px', margin: '0 0 12px 0', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                Petugas lain baru saja mengubah data bus ini di Google Sheets. Berikut adalah rincian data terbaru dari server:
              </p>

              <div style={{ 
                background: 'rgba(0, 0, 0, 0.25)', 
                borderRadius: '6px', 
                padding: '10px 12px', 
                marginBottom: '12px',
                fontSize: '12px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      <th style={{ padding: '4px 0' }}>KOLOM</th>
                      <th style={{ padding: '4px 0', color: 'var(--accent-color)' }}>DATA SERVER</th>
                      <th style={{ padding: '4px 0', color: 'var(--danger-color)' }}>INPUT ANDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'toaShift1', label: 'TOA Shift 1' },
                      { key: 'totalToa', label: 'Total TOA' },
                      { key: 'manualShift1', label: 'Manual Shift 1' },
                      { key: 'manualShift2', label: 'Manual Shift 2' },
                      { key: 'kmAwal1', label: 'KM Awal S1' },
                      { key: 'kmAkhir1', label: 'KM Akhir S1' },
                      { key: 'kmAwal2', label: 'KM Awal S2' },
                      { key: 'kmAkhir2', label: 'KM Akhir S2' },
                      { key: 'keterangan', label: 'Keterangan' },
                    ].map(f => {
                      const serverVal = conflictData[f.key as keyof BusData] || '';
                      const localVal = formData[f.key as keyof BusData] || '';
                      const isDiff = (serverVal !== (bus[f.key as keyof BusData] || '')) || (serverVal !== localVal);
                      if (!isDiff && !serverVal) return null;
                      return (
                        <tr key={f.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '6px 0', fontWeight: 600 }}>{f.label}</td>
                          <td style={{ padding: '6px 0', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                            {serverVal || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>(Kosong)</span>}
                          </td>
                          <td style={{ padding: '6px 0', color: isDiff ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                            {localVal || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>(Kosong)</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button 
                  className="btn" 
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={() => {
                    isDirtyRef.current = false;
                    setFormData(prev => ({ ...prev, ...conflictData }));
                    setConflictData(null);
                    setError('Form Anda telah diperbarui dengan data terbaru dari server.');
                  }}
                >
                  Gunakan Data Server
                </button>
                <button 
                  className="btn" 
                  style={{ background: 'var(--danger-color)' }}
                  onClick={() => handleSave(true)}
                >
                  Tetap Timpa (Force Save)
                </button>
              </div>
            </div>
          )}

          <button 
            className="btn" 
            onClick={() => handleSave(false)}
            disabled={isLoading}
            style={{ 
              backgroundColor: saveStatus === 'success' ? 'var(--success-color)' : '',
              marginTop: '8px'
            }}
          >
            {isLoading ? <Loader2 className="spinner" size={20} /> : saveStatus === 'success' ? <Check size={20} /> : <Save size={20} />}
            {isLoading ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : 'Simpan Data'}
          </button>
        </div>
      )}
    </div>
  );
}
