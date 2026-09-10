import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Plus, Loader2 } from 'lucide-react';
import { TEXT_DASHBOARD, TEXT_COMMON } from '../../constants/texts';
import { useMobileBackHandler } from '../../hooks/useMobileBackHandler';

const MONTH_NAMES_ID = TEXT_COMMON.MONTHS;
const isTestEnv =
  import.meta.env?.MODE === 'test' ||
  Boolean((globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT);

interface RouteSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number | null;
  onYearChange: (val: string) => void;
  availableYears: number[];
  selectedMonth: number | null;
  onMonthChange: (val: string) => void;
  availableMonths: number[];
  monthEnabled: boolean;
  selectedRouteCode: string;
  onRouteCodeChange: (val: string) => void;
  availableRouteCodes: string[];
  routeEnabled: boolean;
  selectedTab: string;
  onTabChange: (val: string) => void;
  days: string[];
  dateEnabled: boolean;
  isAccumulation: boolean;
  isLoading: boolean;
  sheetUrl: string;
  onLoadData: (tab?: string, targetUrl?: string) => void;
  onOpenAddRoute: () => void;
  warningMessage?: string | null;
  onExitAccumulation?: () => void;
}

export function RouteSelectorSheet({
  isOpen,
  onClose,
  selectedYear,
  onYearChange,
  availableYears,
  selectedMonth,
  onMonthChange,
  availableMonths,
  monthEnabled,
  selectedRouteCode,
  onRouteCodeChange,
  availableRouteCodes,
  routeEnabled,
  selectedTab,
  onTabChange,
  days,
  dateEnabled,
  isAccumulation,
  isLoading,
  sheetUrl,
  onLoadData,
  onOpenAddRoute,
  warningMessage,
  onExitAccumulation,
}: RouteSelectorSheetProps) {
  useMobileBackHandler({
    id: 'route_selector_sheet',
    isOpen,
    onClose,
  });

  // Body scroll lock saat sheet terbuka
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const sheetContent = (
    <div
      className="modal-overlay route-selector-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: isOpen ? 'flex' : 'none',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 99999,
        touchAction: 'none',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(90dvh, 760px)',
          overflowY: 'auto',
          padding: '16px 20px calc(28px + env(safe-area-inset-bottom, 16px)) 20px',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: 'var(--bg-card, #171717)',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Top Handle Bar for Touch UI */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--text-secondary)',
              opacity: 0.35,
            }}
          />
        </div>

        {/* Header Sheet */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            marginBottom: '14px',
            borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--accent-color)' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={TEXT_COMMON.CLOSE}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Header: Label Periode & Tombol Tambah Rute Baru */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <label style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_PERIOD_LABEL}
          </label>
          <button
            type="button"
            onClick={onOpenAddRoute}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-color)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} /> {TEXT_DASHBOARD.ROUTE_SELECTOR.ADD_ROUTE_BTN}
          </button>
        </div>

        {/* Banner Mode Akumulasi Aktif + Tombol Keluar (ACC-17-01) */}
        {isAccumulation && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: 'var(--warning-color, #eab308)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡</span>
              <span>{TEXT_DASHBOARD.ROUTE_SELECTOR.ACCUMULATION_ACTIVE_BANNER}</span>
            </div>
            {onExitAccumulation && (
              <button
                type="button"
                data-testid="exit-accumulation-btn-sheet"
                onClick={() => {
                  onExitAccumulation();
                  onClose();
                }}
                style={{
                  background: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '6px',
                  color: 'var(--warning-color, #eab308)',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {TEXT_DASHBOARD.ROUTE_SELECTOR.EXIT_ACCUMULATION_BTN}
              </button>
            )}
          </div>
        )}

        {/* Sequential Cascade: 4 Kolom (Tahun → Bulan → Rute → Tanggal) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {/* Kolom 1: Tahun */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              {TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_LABEL}
            </label>
            <select
              className="input-field"
              value={selectedYear ?? ''}
              onChange={(e) => onYearChange(e.target.value)}
              disabled={availableYears.length === 0}
              title={availableYears.length === 0 ? TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_NO_ROUTE_DATA : TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_YEAR_FIRST}
              style={{ width: '100%', padding: '9px 10px', fontSize: '13px' }}
            >
              <option value="">{TEXT_DASHBOARD.ROUTE_SELECTOR.YEAR_PLACEHOLDER}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Kolom 2: Bulan */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              {TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_LABEL}
            </label>
            <select
              className="input-field"
              value={selectedMonth ?? ''}
              onChange={(e) => onMonthChange(e.target.value)}
              disabled={!monthEnabled || availableMonths.length === 0}
              title={!monthEnabled ? TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_YEAR_FIRST : TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_MONTH}
              style={{ width: '100%', padding: '9px 10px', fontSize: '13px', opacity: !monthEnabled ? 0.55 : 1 }}
            >
              <option value="">{TEXT_DASHBOARD.ROUTE_SELECTOR.MONTH_PLACEHOLDER}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{MONTH_NAMES_ID[m]}</option>
              ))}
            </select>
          </div>

          {/* Kolom 3: Rute */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              {TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_LABEL}
            </label>
            <select
              className="input-field"
              value={selectedRouteCode}
              onChange={(e) => onRouteCodeChange(e.target.value)}
              disabled={!routeEnabled || availableRouteCodes.length === 0}
              title={!routeEnabled ? TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_MONTH_FIRST : TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_ROUTE}
              style={{ width: '100%', padding: '9px 10px', fontSize: '13px', opacity: !routeEnabled ? 0.55 : 1 }}
            >
              <option value="">
                {routeEnabled && availableRouteCodes.length === 0
                  ? TEXT_DASHBOARD.ROUTE_SELECTOR.EMPTY_ROUTE
                  : TEXT_DASHBOARD.ROUTE_SELECTOR.ROUTE_PLACEHOLDER}
              </option>
              {availableRouteCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Kolom 4: Tanggal */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              {TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_LABEL}
            </label>
            <select
              className="input-field"
              value={selectedTab}
              onChange={(e) => onTabChange(e.target.value)}
              disabled={!dateEnabled || days.length === 0}
              title={!dateEnabled ? TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_ROUTE_FIRST : TEXT_DASHBOARD.ROUTE_SELECTOR.TITLE_SELECT_DATE}
              style={{ width: '100%', padding: '9px 10px', fontSize: '13px', opacity: !dateEnabled ? 0.55 : 1 }}
            >
              {isAccumulation && (
                <option value="AKUMULASI">{TEXT_DASHBOARD.ROUTE_SELECTOR.ACCUMULATION_OPTION}</option>
              )}
              <option value="" disabled={isAccumulation}>{TEXT_DASHBOARD.ROUTE_SELECTOR.DATE_PLACEHOLDER}</option>
              {days.map((day) => (
                <option key={day} value={day}>{TEXT_DASHBOARD.TOA_TREND.DATE_PREFIX}{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning sheet belum tersedia */}
        {warningMessage && (
          <div style={{ fontSize: '12px', color: 'var(--warning-color)', marginBottom: '12px', padding: '8px 10px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px' }}>
            {warningMessage}
          </div>
        )}

        {/* Tombol Muat Data */}
        <button
          type="button"
          className="btn"
          onClick={() => {
            onLoadData(selectedTab, sheetUrl);
            onClose();
          }}
          disabled={isLoading || !sheetUrl}
          style={{
            marginTop: '8px',
            width: '100%',
            padding: '12px',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : TEXT_DASHBOARD.ROUTE_SELECTOR.LOAD_DATA_BTN}
        </button>
      </div>
    </div>
  );

  if (isTestEnv || !isOpen) {
    return sheetContent;
  }

  return createPortal(sheetContent, document.body);
}
