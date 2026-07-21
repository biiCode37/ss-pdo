import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import type { BusData, HeaderMap } from '../services/googleSheets';
import { updateBusData, getBusRowData } from '../services/googleSheets';
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

  const [formData, setFormData] = useState<Partial<BusData>>(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return {
          toaShift1: parsed.toaShift1 ?? bus.toaShift1,
          manualShift1: parsed.manualShift1 ?? bus.manualShift1,
          manualShift2: parsed.manualShift2 ?? bus.manualShift2,
          totalToa: parsed.totalToa ?? bus.totalToa,
          kmAwal1: parsed.kmAwal1 ?? bus.kmAwal1,
          kmAkhir1: parsed.kmAkhir1 ?? bus.kmAkhir1,
          kmAwal2: parsed.kmAwal2 ?? bus.kmAwal2,
          kmAkhir2: parsed.kmAkhir2 ?? bus.kmAkhir2,
          keterangan: parsed.keterangan ?? bus.keterangan,
        };
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return {
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
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'queued'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [conflictData, setConflictData] = useState<Partial<BusData> | null>(null);

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    // Save draft when user types, but debounce it
    localStorage.setItem(draftKey, JSON.stringify(debouncedFormData));
  }, [debouncedFormData, draftKey]);

  const handleChange = (field: keyof BusData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setSaveStatus('idle');
    setError(null);
  };

  const handleCopyKm = () => {
    if (formData.kmAkhir1) {
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
      setSaveStatus('success');
      localStorage.removeItem(draftKey);
      setConflictData(null);
      if (onUpdateBus) {
        onUpdateBus(formData);
      }
      setTimeout(() => setIsExpanded(false), 1000); // Auto close on success after 1s
    } catch (err: any) {
      if (err.message && err.message.includes('API Credentials missing')) {
        setError('Sesi login telah habis. Silakan refresh dan login ulang.');
      } else if (err.status === 401 || err.message?.includes('Auth') || err.message?.includes('Credentials')) {
        setError('Akses ditolak. Sesi mungkin kadaluarsa. Silakan login ulang.');
      } else {
        // Assume network error or temporary Google API glitch
        addToQueue({ sheetId, tabName, rowIndex: bus.rowIndex, updates: formData, headerMap });
        setSaveStatus('queued');
        localStorage.removeItem(draftKey);
        setIsExpanded(false);
      }
    } finally {
      setIsLoading(false);
    }
  };



  const getMissingCount = () => {
    const hasValue = (val: any) => val !== undefined && val !== null && String(val).trim() !== '';
    if (activeCategory === 'ALL') {
      let count = 0;
      if (!hasValue(formData.toaShift1)) count++;
      if (!hasValue(formData.totalToa)) count++;
      if (!hasValue(formData.kmAwal1)) count++;
      if (!hasValue(formData.kmAkhir1)) count++;
      if (!hasValue(formData.kmAwal2)) count++;
      if (!hasValue(formData.kmAkhir2)) count++;
      return count;
    } else {
      return hasValue(formData[activeCategory as keyof BusData]) ? 0 : 1;
    }
  };
  
  const missingCount = getMissingCount();

  const isFieldDisabled = (fieldName: string) => {
    if (isLoading) return true;
    if (activeCategory === 'ALL') return false;
    return activeCategory !== fieldName;
  };

  return (
    <div className="bus-card glass">
      <div 
        className="bus-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="bus-card-title" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{bus.unit}</span>
            {missingCount > 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--danger-color)', fontWeight: 'bold', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '12px' }}>
                -{missingCount}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--success-color)', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '12px' }}>
                Selesai
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(saveStatus === 'success' || (saveStatus === 'idle' && !isQueued && !error)) && null}
            {saveStatus === 'success' && (
              <span className="bus-card-status status-updated">Tersimpan</span>
            )}
            {(saveStatus === 'queued' || isQueued) && (
              <span className="bus-card-status status-queued">Menunggu Sinyal</span>
            )}
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
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.toaShift1 || ''} 
                onChange={handleChange('toaShift1')}
                placeholder="0"
                disabled={isFieldDisabled('toaShift1')}
              />
            </div>
            <div className="input-group">
              <label>TOTAL TOA</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.totalToa || ''} 
                onChange={handleChange('totalToa')}
                placeholder="0"
                disabled={isFieldDisabled('totalToa')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>MANUAL SHIFT 1</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.manualShift1 || ''} 
                onChange={handleChange('manualShift1')}
                placeholder="0"
                disabled={isFieldDisabled('manualShift1')}
              />
            </div>
            <div className="input-group">
              <label>MANUAL SHIFT 2</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.manualShift2 || ''} 
                onChange={handleChange('manualShift2')}
                placeholder="0"
                disabled={isFieldDisabled('manualShift2')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>KM Awal Shift 1</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAwal1 || ''} 
                onChange={handleChange('kmAwal1')}
                placeholder="0"
                disabled={isFieldDisabled('kmAwal1')}
              />
            </div>
            <div className="input-group">
              <label>KM Akhir Shift 1</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAkhir1 || ''} 
                onChange={handleChange('kmAkhir1')}
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
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAwal2 || ''} 
                onChange={handleChange('kmAwal2')}
                placeholder="0"
                disabled={isFieldDisabled('kmAwal2')}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label>KM Akhir Shift 2</label>
              <input 
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.kmAkhir2 || ''} 
                onChange={handleChange('kmAkhir2')}
                placeholder="0"
                disabled={isFieldDisabled('kmAkhir2')}
              />
            </div>
          </div>

          <div className="form-grid full">
            <div className="input-group">
              <label>KETERANGAN</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.keterangan || ''} 
                onChange={handleChange('keterangan')}
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
                Petugas lain baru saja mengubah data bus ini. Jika Anda menyimpan sekarang, data mereka akan tertimpa.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <button 
                  className="btn" 
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, ...conflictData }));
                    setConflictData(null);
                    setError('Draft lokal Anda telah diperbarui dengan data dari server.');
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
