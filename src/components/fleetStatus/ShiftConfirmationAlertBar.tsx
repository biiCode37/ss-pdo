import { memo } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { TEXT_FLEET_STATUS } from '../../constants/texts';

export interface ShiftConfirmationAlertBarProps {
  isOpen: boolean;
  shift: 1 | 2;
  routeCode: string;
  onOpenModal: () => void;
  onDismiss?: () => void;
}

function ShiftConfirmationAlertBarComponent({
  isOpen,
  shift,
  routeCode: _routeCode,
  onOpenModal,
}: ShiftConfirmationAlertBarProps) {
  if (!isOpen) return null;

  const message =
    shift === 1
      ? TEXT_FLEET_STATUS.ALERT_BAR.SHIFT_1_UNCONFIRMED
      : TEXT_FLEET_STATUS.ALERT_BAR.SHIFT_2_UNCONFIRMED;

  return (
    <div
      className="shift-confirmation-alert-bar-wrapper"
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 0 10px 0',
        animation: 'slideDownAlert 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div
        className="shift-confirmation-alert-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '7px 12px',
          borderRadius: '12px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: 'var(--warning-text, #f59e0b)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={16} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#f59e0b',
                animation: 'pulseGlow 1.5s infinite',
              }}
            />
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {message}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.22)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: 'inherit',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            transition: 'all 0.18s ease',
          }}
        >
          <span>{TEXT_FLEET_STATUS.ALERT_BAR.ACTION_BTN}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

export const ShiftConfirmationAlertBar = memo(ShiftConfirmationAlertBarComponent);
