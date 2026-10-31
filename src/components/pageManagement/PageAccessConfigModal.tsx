import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Trash2,
  Check,
  Lock,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import type { AppPageSetting, PageKey } from '@/types/pageManagement';
import type { UserProfile } from '@/types/supabase';
import { UserPickerModal } from './UserPickerModal';
import {
  confirmWhitelistOverride,
  confirmBlacklistOverride,
} from '@/utils/modals/pageAccessSafetyDialog';
import { RoleBadge } from '@/components/userManagement/RoleBadge';

interface Props {
  isOpen: boolean;
  setting: AppPageSetting | null;
  onClose: () => void;
  onSave: (
    pageKey: PageKey,
    allowedRoles: string[],
    allowedUserEmails: string[],
    deniedUserEmails: string[]
  ) => Promise<boolean>;
}

type TabType = 'roles' | 'whitelist' | 'blacklist';

const ROLES_LIST = [
  { code: 'superadmin', label: 'Superadmin', required: true },
  { code: 'admin', label: 'Admin', required: false },
  { code: 'korwil', label: 'Korwil', required: false },
  { code: 'korlap', label: 'Korlap', required: false },
  { code: 'pdo', label: 'PDO (Petugas)', required: false },
] as const;

export const PageAccessConfigModal: React.FC<Props> = ({
  isOpen,
  setting,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [whitelistEmails, setWhitelistEmails] = useState<string[]>([]);
  const [blacklistEmails, setBlacklistEmails] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (setting) {
      const roles = Array.isArray(setting.allowed_roles) && setting.allowed_roles.length > 0
        ? [...setting.allowed_roles]
        : ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'];
      if (!roles.includes('superadmin')) {
        roles.unshift('superadmin');
      }
      setSelectedRoles(roles);
      setWhitelistEmails(Array.isArray(setting.allowed_user_emails) ? [...setting.allowed_user_emails] : []);
      setBlacklistEmails(Array.isArray(setting.denied_user_emails) ? [...setting.denied_user_emails] : []);
      setActiveTab('roles');
    }
  }, [setting, isOpen]);

  if (!isOpen || !setting) return null;

  const toggleRole = (code: string) => {
    if (code === 'superadmin') return; // Locked guard
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    );
  };

  const handleOpenPicker = (target: 'whitelist' | 'blacklist') => {
    setPickerTarget(target);
    setIsPickerOpen(true);
  };

  const handleSelectUser = async (user: UserProfile) => {
    const email = user.email.toLowerCase().trim();
    const userRole = (user.role || 'pdo').toLowerCase();

    if (pickerTarget === 'whitelist') {
      const isRoleAllowed = selectedRoles.includes(userRole);
      if (!isRoleAllowed) {
        const confirmed = await confirmWhitelistOverride(
          { email: user.email, full_name: user.full_name, role: userRole },
          setting.page_name
        );
        if (!confirmed) return;
      }

      setWhitelistEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
      setBlacklistEmails((prev) => prev.filter((e) => e !== email));
    } else {
      const isRoleAllowed = selectedRoles.includes(userRole);
      if (isRoleAllowed) {
        const confirmed = await confirmBlacklistOverride(
          { email: user.email, full_name: user.full_name, role: userRole },
          setting.page_name
        );
        if (!confirmed) return;
      }

      setBlacklistEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
      setWhitelistEmails((prev) => prev.filter((e) => e !== email));
    }
  };

  const handleRemoveEmail = (email: string, target: 'whitelist' | 'blacklist') => {
    if (target === 'whitelist') {
      setWhitelistEmails((prev) => prev.filter((e) => e !== email));
    } else {
      setBlacklistEmails((prev) => prev.filter((e) => e !== email));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ok = await onSave(
        setting.page_key,
        selectedRoles,
        whitelistEmails,
        blacklistEmails
      );
      if (ok) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'var(--color-overlay, rgba(0, 0, 0, 0.65))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.TITLE}
          style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            backgroundColor: 'var(--color-surface-default)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: '0 -10px 40px var(--color-shadow, rgba(0, 0, 0, 0.35))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'pmSheetSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-action-primary-bg)' }} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.TITLE}
                </h3>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  display: 'block',
                  marginTop: '2px',
                }}
              >
                {setting.page_name}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Segmented Control Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '10px 20px',
              gap: '6px',
              backgroundColor: 'var(--color-surface-subtle)',
              borderBottom: '1px solid var(--color-border-subtle)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {[
              {
                id: 'roles' as const,
                label: TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.ROLE_TAB,
                badge: selectedRoles.length,
                testId: 'tab-roles',
              },
              {
                id: 'whitelist' as const,
                label: TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.WHITELIST_TAB,
                badge: whitelistEmails.length,
                testId: 'tab-whitelist',
              },
              {
                id: 'blacklist' as const,
                label: TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BLACKLIST_TAB,
                badge: blacklistEmails.length,
                testId: 'tab-blacklist',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={tab.testId}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isActive
                      ? 'var(--color-surface-default)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 2px 6px var(--color-shadow, rgba(0,0,0,0.08))' : 'none',
                    transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor: isActive
                          ? 'var(--color-action-primary-bg)'
                          : 'var(--color-border-subtle)',
                        color: isActive
                          ? 'var(--color-action-primary-fg)'
                          : 'var(--color-text-primary)',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: '20px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '52vh',
            }}
          >
            {/* TAB 1: ROLES */}
            {activeTab === 'roles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 10px',
                  }}
                >
                  {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.ROLE_SECTION_DESC}
                </p>

                {ROLES_LIST.map((role) => {
                  const isChecked = selectedRoles.includes(role.code);
                  const isLocked = role.required;

                  return (
                    <label
                      key={role.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        backgroundColor: isChecked
                          ? 'var(--color-surface-subtle)'
                          : 'var(--color-surface-default)',
                        border: isChecked
                          ? '1.5px solid var(--color-action-primary-bg)'
                          : '1px solid var(--color-border-subtle)',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          data-role={role.code}
                          checked={isChecked}
                          disabled={isLocked}
                          onChange={() => !isLocked && toggleRole(role.code)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: 'var(--color-action-primary-bg)',
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                          }}
                        />
                        <div>
                          <span
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--color-text-primary)',
                              display: 'block',
                            }}
                          >
                            {role.label}
                          </span>
                        </div>
                      </div>

                      {isLocked ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-role-superadmin-bg)',
                            color: 'var(--color-role-superadmin-fg)',
                            fontSize: '10.5px',
                            fontWeight: 700,
                          }}
                        >
                          <Lock size={10} />
                          {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.SUPERADMIN_REQUIRED}
                        </span>
                      ) : (
                        <RoleBadge role={role.code} size="xs" />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {/* TAB 2: WHITELIST */}
            {activeTab === 'whitelist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                      maxWidth: '75%',
                    }}
                  >
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.WHITELIST_DESC}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleOpenPicker('whitelist')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'var(--color-action-primary-bg)',
                      border: 'none',
                      color: 'var(--color-action-primary-fg)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <UserPlus size={14} />
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BTN_ADD_ACCOUNT}
                  </button>
                </div>

                {whitelistEmails.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {whitelistEmails.map((email) => (
                      <div
                        key={email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--color-surface-subtle)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {email}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email, 'whitelist')}
                          aria-label={`Hapus ${email}`}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '36px 0',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.NO_WHITELIST}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BLACKLIST */}
            {activeTab === 'blacklist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                      maxWidth: '75%',
                    }}
                  >
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BLACKLIST_DESC}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleOpenPicker('blacklist')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'var(--color-danger-bg)',
                      border: 'none',
                      color: 'var(--color-danger-fg)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Ban size={14} />
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BTN_ADD_ACCOUNT}
                  </button>
                </div>

                {blacklistEmails.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {blacklistEmails.map((email) => (
                      <div
                        key={email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--color-surface-subtle)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {email}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email, 'blacklist')}
                          aria-label={`Hapus ${email}`}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '36px 0',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.NO_BLACKLIST}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BTN_CANCEL}
            </button>

            <button
              type="button"
              data-testid="btn-save-permissions"
              disabled={isSaving}
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                background: 'var(--color-action-primary-bg)',
                border: 'none',
                color: 'var(--color-action-primary-fg)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSaving ? 'wait' : 'pointer',
                minHeight: '44px',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BTN_SAVE}
            </button>
          </div>
        </div>
      </div>

      {/* User Picker Modal */}
      <UserPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectUser={handleSelectUser}
        excludedEmails={pickerTarget === 'whitelist' ? whitelistEmails : blacklistEmails}
        title={
          pickerTarget === 'whitelist'
            ? TEXT_PAGE_MANAGEMENT.USER_PICKER.TITLE_WHITELIST
            : TEXT_PAGE_MANAGEMENT.USER_PICKER.TITLE_BLACKLIST
        }
      />
    </>
  );
};
