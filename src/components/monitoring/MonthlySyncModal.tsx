import React, { useState, useEffect, useMemo } from 'react';
import { CloudDownload, X, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { TEXT_MONITORING } from '@/constants/texts';
import {
  ingestMonthlyMasterSheet,
  parseMonthAndYearFromTab,
  INDONESIAN_MONTH_NAMES,
  type MonthlyMasterIngestionProgress,
} from '@/services/monthlyMasterIngestionService';

export interface MonthlySyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: number, skipped: number) => void;
  currentYear: number;
  currentMonth: number; // 1-12
  monthName: string;
}

const LOCAL_STORAGE_KEY = 'ss_pdo_master_sheet_url';

export const MonthlySyncModal: React.FC<MonthlySyncModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentYear,
  currentMonth,
  monthName,
}) => {
  const [url, setUrl] = useState('');
  const [tabName, setTabName] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<MonthlyMasterIngestionProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inisialisasi URL dari localStorage dan tab default saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_KEY) || '';
      setUrl(savedUrl);
      setTabName(`${monthName.toUpperCase()} ${currentYear}`);
      setErrorMessage(null);
      setProgress(null);
      setSyncing(false);
    }
  }, [isOpen, currentYear, currentMonth, monthName]);

  // Listener tombol Escape
  useEffect(() => {
    if (!isOpen || syncing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, syncing, onClose]);

  // Deteksi target bulan & tahun secara reaktif dan cerdas dari input tabName
  const detected = useMemo(
    () => parseMonthAndYearFromTab(tabName, currentYear, currentMonth),
    [tabName, currentYear, currentMonth]
  );
  const targetYear = detected.year;
  const targetMonth = detected.month;
  const targetMonthName = detected.monthName;

  // Hitung batas hari dan status masa depan secara dinamis
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === targetYear && now.getMonth() + 1 === targetMonth;
  const isFutureMonth =
    targetYear > now.getFullYear() ||
    (targetYear === now.getFullYear() && targetMonth > now.getMonth() + 1);
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const maxDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

  // Daftar tombol pilihan cepat (Quick Pills) 4 bulan terakhir
  const quickMonths = useMemo(() => {
    const list: { name: string; tab: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mName = INDONESIAN_MONTH_NAMES[m - 1];
      list.push({
        name: `${mName} ${y}`,
        tab: `${mName.toUpperCase()} ${y}`,
      });
    }
    return list;
  }, [currentYear, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (syncing) return;

    setErrorMessage(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMessage(TEXT_MONITORING.MONTHLY_SYNC.ERR_INVALID_URL);
      return;
    }

    const trimmedTab = tabName.trim();
    if (!trimmedTab) {
      setErrorMessage(TEXT_MONITORING.MONTHLY_SYNC.ERR_INVALID_TAB);
      return;
    }

    if (isFutureMonth) {
      setErrorMessage(TEXT_MONITORING.MONTHLY_SYNC.FUTURE_MONTH_ERR(targetMonthName, targetYear));
      return;
    }

    try {
      setSyncing(true);
      setProgress({
        percent: 5,
        stepMessage: TEXT_MONITORING.MONTHLY_SYNC.STATUS_FETCHING,
        processedRecords: 0,
        totalRecords: 0,
      });

      // Simpan URL ke localStorage agar pengguna tidak perlu input ulang
      localStorage.setItem(LOCAL_STORAGE_KEY, trimmedUrl);

      const res = await ingestMonthlyMasterSheet(
        trimmedUrl,
        trimmedTab,
        targetYear,
        targetMonth,
        (p) => setProgress(p)
      );

      if (res.success) {
        onSuccess(res.savedCount, res.skippedCount);
        onClose();
      } else {
        setErrorMessage(res.errors.join('\n') || 'Gagal menyinkronkan data.');
      }
    } catch (err: any) {
      let errMsg = err?.message || 'Terjadi kesalahan sistem saat sinkronisasi.';
      if (
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('ERR_NAME_NOT_RESOLVED') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('network')
      ) {
        errMsg = TEXT_MONITORING.MONTHLY_SYNC.ERR_NETWORK;
      }
      setErrorMessage(errMsg);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="monthly-sync-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--card-bg, #1e1e1e)',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          disabled={syncing}
          aria-label={TEXT_MONITORING.MONTHLY_SYNC.BTN_CANCEL}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary, #a3a3a3)',
            cursor: syncing ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
            opacity: syncing ? 0.4 : 1,
          }}
        >
          <X size={20} />
        </button>

        {/* Header Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(62, 207, 142, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color, #3ECF8E)',
              flexShrink: 0,
            }}
          >
            <CloudDownload size={22} />
          </div>
          <div>
            <h2
              id="monthly-sync-title"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary, #ededed)',
                margin: 0,
              }}
            >
              {TEXT_MONITORING.MONTHLY_SYNC.TITLE}
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary, #a3a3a3)',
                margin: '2px 0 0',
                lineHeight: 1.4,
              }}
            >
              {TEXT_MONITORING.MONTHLY_SYNC.DESC}
            </p>
          </div>
        </div>

        {/* Badge Info Rentang Hari */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: isFutureMonth
              ? 'rgba(239, 68, 68, 0.12)'
              : 'var(--input-bg, rgba(255, 255, 255, 0.04))',
            border: isFutureMonth
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            fontSize: '12px',
            fontWeight: 600,
            color: isFutureMonth ? '#ef4444' : 'var(--accent-color, #3ECF8E)',
            marginBottom: '18px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Calendar size={14} style={{ flexShrink: 0 }} />
          <span>
            {isFutureMonth
              ? TEXT_MONITORING.MONTHLY_SYNC.FUTURE_MONTH_ERR(targetMonthName, targetYear)
              : TEXT_MONITORING.MONTHLY_SYNC.RANGE_INFO(1, maxDay, targetMonthName, targetYear)}
          </span>
        </div>

        {/* Pesan Kesalahan jika ada */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '16px',
              whiteSpace: 'pre-line',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1, lineHeight: 1.4 }}>{errorMessage}</div>
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="monthly-sync-url-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #a3a3a3)',
                marginBottom: '6px',
              }}
            >
              {TEXT_MONITORING.MONTHLY_SYNC.LABEL_URL}
            </label>
            <input
              id="monthly-sync-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={syncing}
              placeholder={TEXT_MONITORING.MONTHLY_SYNC.PLACEHOLDER_URL}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-primary, #ededed)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          <div>
            {/* Quick Month Chips */}
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #a3a3a3)',
                  marginBottom: '6px',
                }}
              >
                {TEXT_MONITORING.MONTHLY_SYNC.QUICK_CHIPS_LABEL}
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {quickMonths.map((qm) => {
                  const isSelected = tabName.trim().toUpperCase() === qm.tab;
                  return (
                    <button
                      key={qm.tab}
                      type="button"
                      disabled={syncing}
                      onClick={() => {
                        setTabName(qm.tab);
                        setErrorMessage(null);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: syncing ? 'not-allowed' : 'pointer',
                        border: isSelected
                          ? '1px solid var(--accent-color, #3ECF8E)'
                          : '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                        background: isSelected
                          ? 'rgba(62, 207, 142, 0.15)'
                          : 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                        color: isSelected
                          ? 'var(--accent-color, #3ECF8E)'
                          : 'var(--text-secondary, #a3a3a3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {qm.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <label
              htmlFor="monthly-sync-tab-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #a3a3a3)',
                marginBottom: '6px',
              }}
            >
              {TEXT_MONITORING.MONTHLY_SYNC.LABEL_TAB}
            </label>
            <input
              id="monthly-sync-tab-input"
              type="text"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              disabled={syncing}
              placeholder={TEXT_MONITORING.MONTHLY_SYNC.PLACEHOLDER_TAB}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-primary, #ededed)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
            />
          </div>

          {/* Indikator Progres Saat Sinkronisasi */}
          {syncing && (
            <div
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: 'var(--text-primary, #ededed)',
                  fontWeight: 600,
                }}
              >
                <span>{progress?.stepMessage || TEXT_MONITORING.MONTHLY_SYNC.STATUS_FETCHING}</span>
                <span style={{ color: 'var(--accent-color, #3ECF8E)' }}>
                  {progress?.percent || 5}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress?.percent || 5}%`,
                    background: 'var(--accent-color, #3ECF8E)',
                    borderRadius: '3px',
                    transition: 'width 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={syncing}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-secondary, #a3a3a3)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {TEXT_MONITORING.MONTHLY_SYNC.BTN_CANCEL}
            </button>
            <button
              type="submit"
              disabled={syncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'var(--accent-color, #3ECF8E)',
                border: 'none',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 700,
                cursor: syncing ? 'wait' : 'pointer',
                opacity: syncing ? 0.7 : 1,
                transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                boxShadow: '0 2px 8px rgba(62, 207, 142, 0.25)',
              }}
            >
              {syncing ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{progress?.percent ? `${progress.percent}%` : 'Memproses...'}</span>
                </>
              ) : (
                <>
                  <CloudDownload size={16} />
                  <span>{TEXT_MONITORING.MONTHLY_SYNC.BTN_START}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonthlySyncModal;
