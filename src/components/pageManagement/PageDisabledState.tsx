import React from 'react';
import { Wrench, ArrowLeft } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';

interface Props {
  message?: string;
  onBack?: () => void;
}

export const PageDisabledState: React.FC<Props> = ({ message, onBack }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '55vh',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-warning-fg)',
          marginBottom: '20px',
        }}
      >
        <Wrench size={32} />
      </div>

      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '10px',
        }}
      >
        {TEXT_PAGE_MANAGEMENT.MAINTENANCE.TITLE}
      </h2>

      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'var(--color-text-secondary)',
          maxWidth: '380px',
          marginBottom: '28px',
        }}
      >
        {message || TEXT_PAGE_MANAGEMENT.MAINTENANCE.DEFAULT_MESSAGE}
      </p>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '12px',
            background: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <ArrowLeft size={16} />
          {TEXT_PAGE_MANAGEMENT.MAINTENANCE.BACK_TO_HOME}
        </button>
      )}
    </div>
  );
};
