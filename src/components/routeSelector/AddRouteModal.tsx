import { X, Loader2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { TEXT_DASHBOARD, TEXT_COMMON } from '../../constants/texts';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';

const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRouteCodeSuffix: string;
  onRouteCodeSuffixChange: (val: string) => void;
  newMonth: number;
  onMonthChange: (val: number) => void;
  newYear: number;
  onYearChange: (val: number) => void;
  newRouteUrl: string;
  onRouteUrlChange: (val: string) => void;
  checkStatus: 'idle' | 'checking' | 'valid' | 'invalid';
  checkMessage: string | null;
  duplicateWarningMessage: string | null;
  formError: string | null;
  isSaving: boolean;
  isCheckingLink: boolean;
  onSaveRoute: () => void;
}

export function AddRouteModal({
  isOpen,
  onClose,
  newRouteCodeSuffix,
  onRouteCodeSuffixChange,
  newMonth,
  onMonthChange,
  newYear,
  onYearChange,
  newRouteUrl,
  onRouteUrlChange,
  checkStatus,
  checkMessage,
  duplicateWarningMessage,
  formError,
  isSaving,
  isCheckingLink,
  onSaveRoute,
}: AddRouteModalProps) {
  useMobileBackHandler({
    id: 'add_route_modal',
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 20px',
          borderRadius: '20px',
          textAlign: 'left',
          position: 'relative',
          backgroundColor: 'var(--bg-card, #171717)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(62, 207, 142, 0.12)',
                color: 'var(--accent-color, #3ECF8E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} />
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.ADD_NEW_ROUTE}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={TEXT_COMMON.CLOSE}
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Trayek JAK. */}
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            {TEXT_DASHBOARD.ROUTE_SELECTOR.ADD_ROUTE_LABEL_CODE}
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--input-border, rgba(255, 255, 255, 0.15))',
              background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                background: 'rgba(62, 207, 142, 0.15)',
                color: 'var(--accent-color, #3ECF8E)',
                fontWeight: 800,
                fontSize: '13.5px',
                letterSpacing: '0.5px',
                borderRight: '1px solid var(--input-border, rgba(255, 255, 255, 0.15))',
                userSelect: 'none',
              }}
            >
              JAK.
            </div>
            <input
              type="text"
              className="input-field"
              placeholder={TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_INPUT_PLACEHOLDER}
              value={newRouteCodeSuffix}
              onChange={(e) => onRouteCodeSuffixChange(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 0,
                background: 'transparent',
                padding: '10px 14px',
                fontSize: '13.5px',
                fontWeight: 600,
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '2px' }}>
            {TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_INPUT_HINT}
          </div>
        </div>

        {/* Periode Bulan & Tahun */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.ADD_ROUTE_LABEL_MONTH}
            </label>
            <select
              className="input-field"
              value={newMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
            >
              {MONTH_NAMES_ID.slice(1).map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {TEXT_DASHBOARD.ROUTE_SELECTOR.ADD_ROUTE_LABEL_YEAR}
            </label>
            <input
              type="number"
              className="input-field tabular-nums"
              placeholder={TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_INPUT_PLACEHOLDER}
              value={newYear}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                onYearChange(isNaN(parsed) ? new Date().getFullYear() : parsed);
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
              min={2020}
              max={2099}
            />
          </div>
        </div>

        {/* Link Google Sheets */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            {TEXT_DASHBOARD.ROUTE_SELECTOR.SHEET_URL_LABEL}
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={TEXT_DASHBOARD.ROUTE_SELECTOR.SHEET_URL_PLACEHOLDER}
            value={newRouteUrl}
            onChange={(e) => onRouteUrlChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '12.5px',
            }}
          />
        </div>

        {/* Proactive Duplicate Warning Banner */}
        {duplicateWarningMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: 'var(--warning-color, #f59e0b)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '12px',
              lineHeight: '1.45',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{duplicateWarningMessage}</span>
          </div>
        )}

        {/* Live Status Inspection Badge */}
        {checkStatus === 'checking' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--accent-color)', marginBottom: '12px' }}>
            <Loader2 className="spinner" size={14} />
            <span>{checkMessage || TEXT_DASHBOARD.ROUTE_SELECTOR.CHECKING_ACCESS}</span>
          </div>
        )}
        {checkStatus === 'valid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--success-color, #10b981)', marginBottom: '12px', fontWeight: 600 }}>
            <CheckCircle size={15} />
            <span>{checkMessage}</span>
          </div>
        )}
        {checkStatus === 'invalid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--danger-color)', marginBottom: '12px' }}>
            <AlertCircle size={15} />
            <span>{checkMessage}</span>
          </div>
        )}

        {formError && (
          <div className="error-text" style={{ marginBottom: '12px', fontSize: '12px' }}>
            {formError}
          </div>
        )}

        <button
          type="button"
          className="btn"
          onClick={onSaveRoute}
          disabled={isSaving || isCheckingLink || Boolean(duplicateWarningMessage)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isSaving ? <Loader2 className="spinner" size={18} /> : null}
          <span>{isSaving ? TEXT_DASHBOARD.ROUTE_SELECTOR.SAVING_ROUTE : TEXT_DASHBOARD.ROUTE_SELECTOR.SAVE_ROUTE_BTN}</span>
        </button>
      </div>
    </div>
  );
}
