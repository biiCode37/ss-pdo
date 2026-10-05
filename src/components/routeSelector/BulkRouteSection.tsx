import { useState } from 'react';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { TEXT_DASHBOARD, TEXT_COMMON } from '@/constants/texts';
import type { BulkRouteItem } from '@/utils/bulkRouteInspector';

const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;
const SERVICE_ACCOUNT_EMAIL = 'pusm-service-google-acc@ss-pdo.iam.gserviceaccount.com';

interface BulkRouteSectionProps {
  fallbackMonth: number;
  onFallbackMonthChange: (val: number) => void;
  fallbackYear: number;
  onFallbackYearChange: (val: number) => void;
  bulkRawText: string;
  onBulkRawTextChange: (val: string) => void;
  bulkItems: BulkRouteItem[];
  isInspecting: boolean;
  inspectProgress: { current: number; total: number };
  isSavingBulk: boolean;
  bulkFormError: string | null;
  bulkSuccessMessage: string | null;
  onInspect: () => void;
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: (val: boolean) => void;
  onSaveBulk: () => void;
}

export function BulkRouteSection({
  fallbackMonth,
  onFallbackMonthChange,
  fallbackYear,
  onFallbackYearChange,
  bulkRawText,
  onBulkRawTextChange,
  bulkItems,
  isInspecting,
  inspectProgress,
  isSavingBulk,
  bulkFormError,
  bulkSuccessMessage,
  onInspect,
  onToggleSelect,
  onToggleSelectAll,
  onSaveBulk,
}: BulkRouteSectionProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const texts = TEXT_DASHBOARD.ROUTE_SELECTOR.BULK_ADD;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const readyItemsCount = bulkItems.filter((it) => it.status === 'ready').length;
  const selectedItemsCount = bulkItems.filter((it) => it.selected && it.status === 'ready').length;
  const allReadySelected = readyItemsCount > 0 && selectedItemsCount === readyItemsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Fallback Periode Bulan & Tahun */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Bulan Default (Acuan / Fallback)
          </label>
          <select
            value={fallbackMonth}
            onChange={(e) => onFallbackMonthChange(Number(e.target.value))}
            disabled={isInspecting || isSavingBulk}
            className="input-field"
            style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
          >
            {MONTH_NAMES_ID.slice(1).map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '100px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Tahun
          </label>
          <input
            type="number"
            value={fallbackYear}
            onChange={(e) => onFallbackYearChange(Number(e.target.value))}
            disabled={isInspecting || isSavingBulk}
            className="input-field"
            style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Textarea Multi-Link */}
      <div>
        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          {texts.TEXTAREA_LABEL}
        </label>
        <textarea
          rows={5}
          value={bulkRawText}
          onChange={(e) => onBulkRawTextChange(e.target.value)}
          placeholder={texts.TEXTAREA_PLACEHOLDER}
          disabled={isInspecting || isSavingBulk}
          className="input-field"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '11.5px',
            fontFamily: 'monospace',
            lineHeight: '1.4',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Tombol Periksa Link */}
      <button
        type="button"
        onClick={onInspect}
        disabled={isInspecting || isSavingBulk || !bulkRawText.trim()}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px',
          fontSize: '12.5px',
          backgroundColor: 'var(--bg-secondary, #27272a)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {isInspecting ? (
          <>
            <Loader2 className="spinner" size={14} />
            <span>{texts.INSPECTING_PROGRESS(inspectProgress.current, inspectProgress.total)}</span>
          </>
        ) : (
          <>
            <Search size={14} />
            <span>{texts.BTN_INSPECT}</span>
          </>
        )}
      </button>

      {/* Pesan Error / Sukses */}
      {bulkFormError && (
        <div style={{ color: 'var(--danger-color)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{bulkFormError}</span>
        </div>
      )}
      {bulkSuccessMessage && (
        <div style={{ color: 'var(--success-color, #10b981)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={14} style={{ flexShrink: 0 }} />
          <span>{bulkSuccessMessage}</span>
        </div>
      )}

      {/* Daftar Pratinjau Interaktif */}
      {bulkItems.length > 0 && (
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {texts.PREVIEW_TITLE} ({bulkItems.length})
            </span>
            {readyItemsCount > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allReadySelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  disabled={isSavingBulk}
                />
                <span>Pilih Semua yang Siap ({readyItemsCount})</span>
              </label>
            )}
          </div>

          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '2px',
            }}
          >
            {bulkItems.map((item, idx) => {
              const isReady = item.status === 'ready';
              const isDuplicate = item.status === 'duplicate';
              const isError = item.status === 'error';
              const isItemInspecting = item.status === 'inspecting';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
                    border: '1px solid var(--border-color)',
                    fontSize: '11.5px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => onToggleSelect(idx)}
                    disabled={!isReady || isSavingBulk}
                    style={{ cursor: isReady ? 'pointer' : 'not-allowed' }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isReady
                            ? 'var(--success-color, #10b981)'
                            : isDuplicate
                            ? 'var(--warning-color, #f59e0b)'
                            : 'var(--text-primary)',
                        }}
                      >
                        {item.routeCode || 'Rute ?'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        ({MONTH_NAMES_ID[item.month] || item.month} {item.year})
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.spreadsheetTitle || item.sheetUrl}
                    >
                      {item.spreadsheetTitle || item.sheetUrl}
                    </div>

                    {item.errorMessage && (
                      <div style={{ fontSize: '10px', color: 'var(--danger-color)', marginTop: '2px' }}>
                        {item.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div style={{ flexShrink: 0 }}>
                    {isItemInspecting && <Loader2 className="spinner" size={14} />}
                    {isReady && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontWeight: 600,
                        }}
                      >
                        {texts.STATUS_READY}
                      </span>
                    )}
                    {isDuplicate && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          fontWeight: 600,
                        }}
                      >
                        {texts.STATUS_DUPLICATE}
                      </span>
                    )}
                    {isError && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            fontWeight: 600,
                          }}
                        >
                          {texts.STATUS_ERROR}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '9.5px',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: 'var(--bg-card, #18181b)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          title={SERVICE_ACCOUNT_EMAIL}
                        >
                          {copiedEmail ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
                          <span>{copiedEmail ? 'Disalin!' : 'Salin Email'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tombol Simpan Bulk */}
          <button
            type="button"
            className="btn"
            onClick={onSaveBulk}
            disabled={isSavingBulk || selectedItemsCount === 0}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: 'var(--primary-color, #10b981)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              cursor: selectedItemsCount > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedItemsCount > 0 ? 1 : 0.6,
            }}
          >
            {isSavingBulk ? (
              <>
                <Loader2 className="spinner" size={16} />
                <span>Menyimpan Rute...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                <span>{texts.BTN_SAVE_BULK(selectedItemsCount)}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
