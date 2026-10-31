import React, { useState } from 'react';
import { X, Users, Lock, Check } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import { RoleBadge } from '@/components/userManagement/RoleBadge';

interface Props {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onSaveRoles: (roles: string[]) => Promise<void> | void;
}

const ROLES_LIST = [
  { code: 'superadmin', label: 'Superadmin', required: true },
  { code: 'admin', label: 'Admin', required: false },
  { code: 'korwil', label: 'Korwil', required: false },
  { code: 'korlap', label: 'Korlap', required: false },
  { code: 'pdo', label: 'PDO (Petugas)', required: false },
] as const;

export const BulkRoleConfigModal: React.FC<Props> = ({
  isOpen,
  selectedCount,
  onClose,
  onSaveRoles,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    'superadmin',
    'admin',
    'korwil',
    'korlap',
    'pdo',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleRole = (code: string) => {
    if (code === 'superadmin') return; // Guard
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalRoles = selectedRoles.includes('superadmin')
        ? selectedRoles
        : ['superadmin', ...selectedRoles];
      await onSaveRoles(finalRoles);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'var(--color-overlay, rgba(0, 0, 0, 0.65))',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={TEXT_PAGE_MANAGEMENT.BULK_ACTION.BULK_ROLE_MODAL_TITLE}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--color-surface-default)',
          borderRadius: '20px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 20px 40px var(--color-shadow, rgba(0, 0, 0, 0.3))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'pmSpringUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--color-action-primary-bg)' }} />
            <h3
              style={{
                margin: 0,
                fontSize: '15.5px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {TEXT_PAGE_MANAGEMENT.BULK_ACTION.BULK_ROLE_MODAL_TITLE}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{
              width: '34px',
              height: '34px',
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
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <p
            style={{
              fontSize: '12.5px',
              color: 'var(--color-text-secondary)',
              margin: '0 0 16px',
              lineHeight: 1.5,
            }}
          >
            {TEXT_PAGE_MANAGEMENT.BULK_ACTION.BULK_ROLE_MODAL_DESC(selectedCount)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    padding: '10px 14px',
                    borderRadius: '12px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
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
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {role.label}
                    </span>
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
                        fontSize: '10px',
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
        </div>

        {/* Footer */}
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
              padding: '9px 16px',
              borderRadius: '10px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {TEXT_PAGE_MANAGEMENT.CONFIG_MODAL.BTN_CANCEL}
          </button>

          <button
            type="button"
            data-testid="btn-bulk-save-roles"
            disabled={isSaving}
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'var(--color-action-primary-bg)',
              border: 'none',
              color: 'var(--color-action-primary-fg)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <Check size={14} />
            {TEXT_PAGE_MANAGEMENT.BULK_ACTION.SAVE_ROLES_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};
