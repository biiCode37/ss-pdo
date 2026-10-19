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
} from 'lucide-react';
import { usePageAccess } from '@/context/PageAccessContext';
import { PageCategory, PageKey, AppPageSetting } from '@/types/pageManagement';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import { showSuccessToast, showErrorToast } from '@/utils/alertUtils';

interface Props {
  onBack: () => void;
}

type FilterCategory = 'all' | PageCategory;

export const PageManagementPage: React.FC<Props> = ({ onBack }) => {
  const { pageSettings, togglePageStatus, isLoading } = usePageAccess();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const settingsList = useMemo(() => {
    return Object.values(pageSettings);
  }, [pageSettings]);

  const filteredSettings = useMemo(() => {
    if (activeCategory === 'all') return settingsList;
    return settingsList.filter((s) => s.category === activeCategory);
  }, [settingsList, activeCategory]);

  const handleToggle = async (setting: AppPageSetting) => {
    if (togglingKey) return;
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

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        paddingBottom: '80px',
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 800,
          background: 'var(--bg-glass, rgba(15, 23, 42, 0.88))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          padding: '16px 20px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                background: 'var(--bg-secondary, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--text-primary)',
                  }}
                >
                  {TEXT_PAGE_MANAGEMENT.TITLE}
                </h1>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary, #94a3b8)',
                  margin: '2px 0 0 0',
                }}
              >
                {TEXT_PAGE_MANAGEMENT.SUBTITLE}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
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
                    ? '1px solid #3b82f6'
                    : '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  background: isActive
                    ? '#2563eb'
                    : 'var(--bg-secondary, rgba(255, 255, 255, 0.04))',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
                border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                opacity: 0.85,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
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
                        color: 'var(--text-primary)',
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
                        backgroundColor: 'rgba(100, 116, 139, 0.2)',
                        color: 'var(--text-secondary, #94a3b8)',
                      }}
                    >
                      <Lock size={10} />
                      {TEXT_PAGE_MANAGEMENT.STATUS.LOCKED}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
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
                  backgroundColor: '#10b981',
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
                    backgroundColor: '#ffffff',
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

            return (
              <div
                key={setting.page_key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: isEnabled
                    ? 'var(--bg-secondary, rgba(255, 255, 255, 0.03))'
                    : 'rgba(245, 158, 11, 0.04)',
                  border: isEnabled
                    ? '1px solid var(--card-border, rgba(255, 255, 255, 0.08))'
                    : '1px solid rgba(245, 158, 11, 0.2)',
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
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: isEnabled
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(245, 158, 11, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isEnabled ? '#10b981' : '#f59e0b',
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
                          color: 'var(--text-primary)',
                        }}
                      >
                        {setting.page_name}
                      </span>

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
                            ? 'rgba(16, 185, 129, 0.16)'
                            : 'rgba(245, 158, 11, 0.16)',
                          color: isEnabled ? '#10b981' : '#fbbf24',
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

                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-secondary, #94a3b8)',
                        display: 'block',
                        marginTop: '2px',
                      }}
                    >
                      {isEnabled
                        ? TEXT_PAGE_MANAGEMENT.STATUS.ACTIVE_DESC
                        : TEXT_PAGE_MANAGEMENT.STATUS.MAINTENANCE_DESC}
                    </span>
                  </div>
                </div>

                {/* iOS-style Smooth Spring Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  disabled={isToggling}
                  onClick={() => handleToggle(setting)}
                  style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    backgroundColor: isEnabled ? '#10b981' : '#475569',
                    border: 'none',
                    position: 'relative',
                    cursor: isToggling ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    flexShrink: 0,
                    marginLeft: '12px',
                    opacity: isToggling ? 0.6 : 1,
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
            );
          })}
        </div>
      </div>
    </div>
  );
};
