import { useState, useEffect, memo } from 'react';
import { upsertDailyFleetShift } from '../../services/fleetStatusService';
import { TEXT_FLEET_STATUS } from '../../constants/texts/text_fleet_status';
import { TEXT_COMMON } from '../../constants/texts/text_common';

export interface QuickKorlapFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number;
  routeCode: string;
  selectedDate: string;
  shift: 1 | 2;
  defaultRenops?: number;
  initialRealops?: number;
  onSaveSuccess: () => void;
}

function QuickKorlapFleetModalComponent({
  isOpen,
  onClose,
  routeId,
  routeCode,
  selectedDate,
  shift,
  defaultRenops = 30,
  initialRealops,
  onSaveSuccess,
}: QuickKorlapFleetModalProps) {
  const [targetRenops, setTargetRenops] = useState<number>(defaultRenops);
  const [realops, setRealops] = useState<number>(initialRealops ?? defaultRenops);
  const [rawNotes, setRawNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setTargetRenops(defaultRenops);
      setRealops(initialRealops ?? defaultRenops);
      setRawNotes('');
    }
  }, [isOpen, defaultRenops, initialRealops]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Parsing catatan unit jika dimasukkan teks bebas (cth: "TS.02 BA.01 Radiator, TS.05 EVDAL")
      const nonSgoUnitsPayload: Array<{
        unit_body: string;
        status_id: number;
        status_code: string;
        note: string;
      }> = [];

      if (rawNotes.trim()) {
        const parts = rawNotes
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        parts.forEach((p) => {
          const splitSpace = p.split(/\s+/);
          const unitBody = splitSpace[0] || 'UNIT';
          const noteText = splitSpace.slice(1).join(' ') || p;
          nonSgoUnitsPayload.push({
            unit_body: unitBody,
            status_id: 0,
            status_code: 'CATATAN',
            note: noteText,
          });
        });
      }

      await upsertDailyFleetShift(
        {
          route_id: routeId,
          route_code: routeCode,
          date: selectedDate,
          shift,
          target_renops: targetRenops,
          realops,
          total_units: targetRenops,
          sgo_count: realops,
          to_count: 0,
          off_count: 0,
          so_count: 0,
          other_count: 0,
          source_type: 'korlap_manual',
          submitted_by_role: 'korlap',
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        },
        nonSgoUnitsPayload
      );

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.warn('[QuickKorlapFleetModal] Gagal menyimpan status korlap:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--color-bg-elevated, #1e293b)',
          color: 'var(--color-text-main, #f8fafc)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--color-border, #334155)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {TEXT_FLEET_STATUS.QUICK_KORLAP.MODAL_TITLE}
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted, #94a3b8)',
              }}
            >
              {TEXT_FLEET_STATUS.QUICK_KORLAP.SUBTITLE(routeCode, shift)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '1.4rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--color-text-muted, #94a3b8)',
                }}
              >
                {TEXT_FLEET_STATUS.QUICK_KORLAP.RENOPS_LABEL}
              </label>
              <input
                type="number"
                min={0}
                data-testid="korlap-renops-input"
                value={targetRenops}
                onChange={(e) => setTargetRenops(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--color-text-muted, #94a3b8)',
                }}
              >
                {TEXT_FLEET_STATUS.QUICK_KORLAP.REALOPS_LABEL}
              </label>
              <input
                type="number"
                min={0}
                data-testid="korlap-realops-input"
                value={realops}
                onChange={(e) => setRealops(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'var(--color-text-muted, #94a3b8)',
              }}
            >
              {TEXT_FLEET_STATUS.QUICK_KORLAP.NOTES_LABEL}
            </label>
            <textarea
              rows={3}
              data-testid="korlap-notes-input"
              value={rawNotes}
              placeholder={TEXT_FLEET_STATUS.QUICK_KORLAP.NOTES_PLACEHOLDER}
              onChange={(e) => setRawNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border, #334155)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #475569)',
              background: 'transparent',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {TEXT_COMMON.BUTTONS.CANCEL}
          </button>
          <button
            type="button"
            data-testid="korlap-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isSubmitting
              ? TEXT_FLEET_STATUS.QUICK_KORLAP.BTN_SAVING
              : TEXT_FLEET_STATUS.QUICK_KORLAP.BTN_SUBMIT}
          </button>
        </div>
      </div>
    </div>
  );
}

export const QuickKorlapFleetModal = memo(QuickKorlapFleetModalComponent);
export default QuickKorlapFleetModal;
