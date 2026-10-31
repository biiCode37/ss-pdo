import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Lock,
  Layers,
  Layout,
  Sliders,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  CheckSquare,
  Check,
} from 'lucide-react';
import { usePageAccess } from '@/context/PageAccessContext';
import type { PageCategory, AppPageSetting, PageKey } from '@/types/pageManagement';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import { showSuccessToast, showErrorToast } from '@/utils/alertUtils';
import { PageAccessConfigModal } from './PageAccessConfigModal';
import { FloatingBulkActionBar } from './FloatingBulkActionBar';
import { BulkRoleConfigModal } from './BulkRoleConfigModal';
import { confirmResetPageSettings } from '@/utils/modals/pageAccessSafetyDialog';

interface Props {
  onBack: () => void;
}

type FilterCategory = 'all' | PageCategory;

export const PageManagementPage: React.FC<Props> = ({ onBack }) => {
  const { pageSettings, togglePageStatus, updatePermissions, bulkUpdate } = usePageAccess();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Multi-Select State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<PageKey[]>([]);

  // Modal State
  const [configTarget, setConfigTarget] = useState<AppPageSetting | null>(null);
  const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const settingsList = useMemo(() => {
    return Object.values(pageSettings);
  }, [pageSettings]);

  const filteredSettings = useMemo(() => {
    if (activeCategory === 'all') return settingsList;
    return settingsList.filter((s) => s.category === activeCategory);
  }, [settingsList, activeCategory]);

  const selectableKeys = useMemo(() => {
    return filteredSettings
      .filter((s) => s.page_key !== ('page_management' as PageKey))
      .map((s) => s.page_key);
  }, [filteredSettings]);

  const handleToggle = async (setting: AppPageSetting) => {
    if (togglingKey || isSelectMode) return;
    const nextStatus = !setting.is_enabled;
    setTogglingKey(setting.page_key);

    try {
      const ok = await togglePageStatus(setting.page_key, nextStatus);
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.UPDATE_SUCCESS);
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.UPDATE_FAILED);
      }
    } catch {
      showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.UPDATE_FAILED);
    } finally {
      setTogglingKey(null);
    }
  };

  const handleToggleSelectCard = (key: PageKey) => {
    if (key === ('page_management' as PageKey)) return;
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(selectableKeys);
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedKeys([]);
    } else {
      setIsSelectMode(true);
    }
  };

  const handleSavePermissions = async (
    pageKey: PageKey,
    allowedRoles: string[],
    allowedUserEmails: string[],
    deniedUserEmails: string[]
  ): Promise<boolean> => {
    try {
      const ok = await updatePermissions(
        pageKey,
        allowedRoles,
        allowedUserEmails,
        deniedUserEmails
      );
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.PERMISSIONS_UPDATE_SUCCESS);
        return true;
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.PERMISSIONS_UPDATE_FAILED);
        return false;
      }
    } catch {
      showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.PERMISSIONS_UPDATE_FAILED);
      return false;
    }
  };

  // Bulk Action Handlers
  const handleBulkEnable = async () => {
    if (selectedKeys.length === 0) return;
    setIsBulkLoading(true);
    try {
      const ok = await bulkUpdate(selectedKeys, 'set_status', { is_enabled: true });
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_STATUS_SUCCESS);
        setIsSelectMode(false);
        setSelectedKeys([]);
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_ACTION_FAILED);
      }
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDisable = async () => {
    if (selectedKeys.length === 0) return;
    setIsBulkLoading(true);
    try {
      const ok = await bulkUpdate(selectedKeys, 'set_status', { is_enabled: false });
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_STATUS_SUCCESS);
        setIsSelectMode(false);
        setSelectedKeys([]);
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_ACTION_FAILED);
      }
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkSetRoles = async (roles: string[]) => {
    if (selectedKeys.length === 0) return;
    setIsBulkLoading(true);
    try {
      const ok = await bulkUpdate(selectedKeys, 'set_roles', { allowed_roles: roles });
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_ROLES_SUCCESS);
        setIsSelectMode(false);
        setSelectedKeys([]);
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_ACTION_FAILED);
      }
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkReset = async () => {
    if (selectedKeys.length === 0) return;
    const confirmed = await confirmResetPageSettings(selectedKeys.length);
    if (!confirmed) return;

    setIsBulkLoading(true);
    try {
      const ok = await bulkUpdate(selectedKeys, 'reset_default', {});
      if (ok) {
        showSuccessToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_RESET_SUCCESS);
        setIsSelectMode(false);
        setSelectedKeys([]);
      } else {
        showErrorToast(TEXT_PAGE_MANAGEMENT.TOAST.BULK_ACTION_FAILED);
      }
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        backgroundColor: 'var(--color-surface-canvas)',
        color: 'var(--color-text-primary)',
        paddingBottom: selectedKeys.length > 0 ? '110px' : '80px',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 800,
          background: 'var(--color-surface-default)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              data-testid="page-management-back-btn"
              onClick={onBack}
              aria-label={TEXT_PAGE_MANAGEMENT.MAINTENANCE.BACK_TO_HOME}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--color-text-primary)',
                }}
              >
                {TEXT_PAGE_MANAGEMENT.TITLE}
              </h1>
              {isSelectMode && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-action-primary-bg)',
                    display: 'block',
                  }}
                >
                  {selectedKeys.length} / {selectableKeys.length} Dipilih
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Multi-Select Toggle Button */}
            <button
              type="button"
              data-testid="btn-toggle-select-mode"
              onClick={handleToggleSelectMode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                background: isSelectMode
                  ? 'var(--color-action-primary-bg)'
                  : 'var(--color-surface-subtle)',
                border: isSelectMode
                  ? 'none'
                  : '1px solid var(--color-border-subtle)',
                color: isSelectMode
                  ? 'var(--color-action-primary-fg)'
                  : 'var(--color-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {isSelectMode ? <Check size={14} /> : <CheckSquare size={14} />}
              <span>
                {isSelectMode
                  ? TEXT_PAGE_MANAGEMENT.BULK_ACTION.EXIT_SELECT_MODE
                  : TEXT_PAGE_MANAGEMENT.BULK_ACTION.SELECT_MODE_BTN}
              </span>
            </button>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '20px',
                backgroundColor: 'var(--color-role-superadmin-bg)',
                border: '1px solid var(--color-role-superadmin-border)',
                color: 'var(--color-role-superadmin-fg)',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={13} />
              <span>{TEXT_PAGE_MANAGEMENT.SUPERADMIN_BADGE}</span>
            </div>
          </div>
        </div>

        {/* Selection Bar Subheader when in select mode */}
        {isSelectMode && (
          <div
            style={{
              maxWidth: '720px',
              margin: '10px auto 0',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {TEXT_PAGE_MANAGEMENT.BULK_ACTION.SELECT_ALL}
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {TEXT_PAGE_MANAGEMENT.BULK_ACTION.DESELECT_ALL}
              </button>
            </div>

            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
              Klik kartu untuk memilih
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Content Container */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        {/* Category Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '16px',
            scrollbarWidth: 'none',
          }}
        >
          {(
            [
              { key: 'all', label: TEXT_PAGE_MANAGEMENT.CATEGORIES.ALL },
              { key: 'page', label: TEXT_PAGE_MANAGEMENT.CATEGORIES.PAGE },
              { key: 'tab', label: TEXT_PAGE_MANAGEMENT.CATEGORIES.TAB },
              { key: 'modal', label: TEXT_PAGE_MANAGEMENT.CATEGORIES.MODAL },
            ] as const
          ).map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className="pm-filter-tab"
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: isActive
                    ? '1px solid var(--color-action-primary-bg)'
                    : '1px solid var(--color-border-subtle)',
                  background: isActive
                    ? 'var(--color-action-primary-bg)'
                    : 'var(--color-surface-subtle)',
                  color: isActive ? 'var(--color-action-primary-fg)' : 'var(--color-text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 3. Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Pinned Card: Self-Lockout Guard (Page Management itself) */}
          {(activeCategory === 'all' || activeCategory === 'page') && (
            <div
              data-testid="pm-card-page_management"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'var(--color-surface-default)',
                border: '1px solid var(--color-border-subtle)',
                opacity: 0.85,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-role-admin-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-role-admin-fg)',
                  }}
                >
                  <Layout size={19} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      Manajemen Halaman (Sistem)
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-surface-subtle)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <Lock size={10} />
                      {TEXT_PAGE_MANAGEMENT.STATUS.LOCKED}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--color-text-secondary)',
                      display: 'block',
                      marginTop: '2px',
                    }}
                  >
                    {TEXT_PAGE_MANAGEMENT.STATUS.LOCKED_DESC}
                  </span>
                </div>
              </div>

              {/* Locked Switch Indicator */}
              <div
                style={{
                  width: '46px',
                  height: '26px',
                  borderRadius: '13px',
                  backgroundColor: 'var(--color-success-fg, #10b981)',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
                title={TEXT_PAGE_MANAGEMENT.STATUS.LOCKED_DESC}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-surface-default)',
                    transform: 'translateX(20px)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Dynamic Controlled Pages */}
          {filteredSettings.map((setting) => {
            const isToggling = togglingKey === setting.page_key;
            const isEnabled = setting.is_enabled;
            const isSelected = selectedKeys.includes(setting.page_key);

            const allowedRoles = setting.allowed_roles || [];
            const whitelistCount = (setting.allowed_user_emails || []).length;
            const blacklistCount = (setting.denied_user_emails || []).length;

            return (
              <div
                key={setting.page_key}
                data-testid={`pm-card-${setting.page_key}`}
                onClick={() => isSelectMode && handleToggleSelectCard(setting.page_key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: isSelected
                    ? 'var(--color-surface-subtle)'
                    : isEnabled
                    ? 'var(--color-surface-default)'
                    : 'var(--color-warning-bg, rgba(245, 158, 11, 0.04))',
                  border: isSelected
                    ? '1.5px solid var(--color-action-primary-bg)'
                    : isEnabled
                    ? '1px solid var(--color-border-subtle)'
                    : '1px solid var(--color-warning-border, rgba(245, 158, 11, 0.2))',
                  cursor: isSelectMode ? 'pointer' : 'default',
                  transition: 'all 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: 0,
                  }}
                >
                  {/* Select Mode Checkbox */}
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      data-card-key={setting.page_key}
                      checked={isSelected}
                      onChange={() => handleToggleSelectCard(setting.page_key)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--color-action-primary-bg)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: isEnabled
                        ? 'var(--color-success-bg, rgba(16, 185, 129, 0.12))'
                        : 'var(--color-warning-bg, rgba(245, 158, 11, 0.12))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isEnabled
                        ? 'var(--color-success-fg, #10b981)'
                        : 'var(--color-warning-fg, #f59e0b)',
                      flexShrink: 0,
                    }}
                  >
                    {setting.category === 'page' && <Layout size={19} />}
                    {setting.category === 'tab' && <Layers size={19} />}
                    {setting.category === 'modal' && <Sliders size={19} />}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {setting.page_name}
                      </span>

                      {/* Status Active/Maintenance Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: isEnabled
                            ? 'var(--color-success-bg, rgba(16, 185, 129, 0.16))'
                            : 'var(--color-warning-bg, rgba(245, 158, 11, 0.16))',
                          color: isEnabled
                            ? 'var(--color-success-fg, #10b981)'
                            : 'var(--color-warning-fg, #fbbf24)',
                        }}
                      >
                        {isEnabled ? (
                          <>
                            <CheckCircle2 size={10} />
                            {TEXT_PAGE_MANAGEMENT.STATUS.ACTIVE}
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            {TEXT_PAGE_MANAGEMENT.STATUS.MAINTENANCE}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Role & Granular Permissions Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        marginTop: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>Akses:</span>
                        <b style={{ color: 'var(--color-text-primary)' }}>
                          {allowedRoles.length >= 5
                            ? 'Semua Peran'
                            : allowedRoles.map((r) => r.toUpperCase()).join(', ')}
                        </b>
                      </span>

                      {whitelistCount > 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-success-bg, rgba(16, 185, 129, 0.14))',
                            color: 'var(--color-success-fg, #10b981)',
                          }}
                        >
                          +{whitelistCount} Akun Khusus
                        </span>
                      )}

                      {blacklistCount > 0 && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-error-bg, rgba(239, 68, 68, 0.14))',
                            color: 'var(--color-error-fg, #ef4444)',
                          }}
                        >
                          -{blacklistCount} Dibatasi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action: Configure Access & Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {!isSelectMode && (
                    <button
                      type="button"
                      data-testid={`btn-config-access-${setting.page_key}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfigTarget(setting);
                      }}
                      title="Atur Hak Akses Peran & Akun"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                      }}
                    >
                      <SlidersHorizontal size={16} />
                    </button>
                  )}

                  {/* iOS-style Smooth Spring Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    disabled={isToggling || isSelectMode}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(setting);
                    }}
                    style={{
                      width: '48px',
                      height: '28px',
                      borderRadius: '14px',
                      backgroundColor: isEnabled
                        ? 'var(--color-success-fg, #10b981)'
                        : 'var(--color-surface-subtle)',
                      border: 'none',
                      position: 'relative',
                      cursor: isToggling || isSelectMode ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      flexShrink: 0,
                      opacity: isToggling || isSelectMode ? 0.6 : 1,
                      transition:
                        'background-color 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                    }}
                    title={
                      isEnabled
                        ? 'Klik untuk menonaktifkan (mode perbaikan)'
                        : 'Klik untuk mengaktifkan kembali'
                    }
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transform: isEnabled
                          ? 'translateX(20px)'
                          : 'translateX(0px)',
                        transition:
                          'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
                      }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <FloatingBulkActionBar
        selectedCount={selectedKeys.length}
        onEnableAll={handleBulkEnable}
        onDisableAll={handleBulkDisable}
        onSetRoles={() => setIsBulkRoleModalOpen(true)}
        onResetDefault={handleBulkReset}
        onDeselectAll={handleDeselectAll}
        isLoading={isBulkLoading}
      />

      {/* Modal Configure Access per Page */}
      <PageAccessConfigModal
        isOpen={!!configTarget}
        setting={configTarget}
        onClose={() => setConfigTarget(null)}
        onSave={handleSavePermissions}
      />

      {/* Bulk Role Config Modal */}
      <BulkRoleConfigModal
        isOpen={isBulkRoleModalOpen}
        selectedCount={selectedKeys.length}
        onClose={() => setIsBulkRoleModalOpen(false)}
        onSaveRoles={handleBulkSetRoles}
      />
    </div>
  );
};
