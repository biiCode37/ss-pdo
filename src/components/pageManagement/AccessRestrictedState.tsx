import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import { usePageAccess } from '@/context/PageAccessContext';

interface Props {
  message?: string;
  onBack?: () => void;
  superadmins?: { email: string; full_name: string }[];
}

export const AccessRestrictedState: React.FC<Props> = ({
  message,
  onBack,
  superadmins: propSuperadmins,
}) => {
  const { activeSuperadmins } = usePageAccess();
  const superadminsList = propSuperadmins || activeSuperadmins || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '20px',
          background: 'var(--color-role-superadmin-bg)',
          border: '1px solid var(--color-role-superadmin-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-role-superadmin-fg)',
          marginBottom: '20px',
        }}
      >
        <ShieldAlert size={34} />
      </div>

      {/* Main Title & Subtitle */}
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
      >
        {TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.TITLE}
      </h2>

      <p
        style={{
          fontSize: '13.5px',
          lineHeight: '1.5',
          color: 'var(--color-text-secondary)',
          maxWidth: '380px',
          marginBottom: '24px',
        }}
      >
        {message || TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.SUBTITLE}
      </p>

      {/* Superadmin Contact List Section */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '16px',
          borderRadius: '14px',
          background: 'var(--color-surface-subtle)',
          border: '1px solid var(--color-border-subtle)',
          marginBottom: '28px',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            display: 'block',
            marginBottom: '10px',
          }}
        >
          {TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.SUPERADMIN_CONTACT_LABEL}
        </span>

        {superadminsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {superadminsList.map((admin) => (
              <div
                key={admin.email}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--color-surface-default)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--color-role-superadmin-bg)',
                    color: 'var(--color-role-superadmin-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UserCheck size={15} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {admin.full_name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {admin.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            {TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.NO_SUPERADMIN_CONTACT}
          </p>
        )}
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 22px',
            borderRadius: '12px',
            background: 'var(--color-action-primary-bg)',
            border: 'none',
            color: 'var(--color-action-primary-fg)',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '44px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <ArrowLeft size={16} />
          {TEXT_PAGE_MANAGEMENT.ACCESS_DENIED.BTN_BACK_TO_DASHBOARD}
        </button>
      )}
    </div>
  );
};

