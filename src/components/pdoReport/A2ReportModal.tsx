import { useState, useEffect, useMemo, memo } from 'react';
import type { BusData } from '../../services/googleSheets';
import { parseIndonesianNumber } from '../../utils/numberUtils';
import { upsertDailyFleetShift } from '../../services/fleetStatusService';
import { TEXT_PDO_FORM } from '../../constants/texts/text_pdo_form';
import { TEXT_COMMON } from '../../constants/texts/text_common';
import { TEXT_ERRORS } from '../../constants/texts/text_errors';
import { showSuccessToast, showErrorAlert } from '../../utils/alertUtils';

export interface A2ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number;
  routeCode: string;
  selectedDate: string;
  defaultRenops: number;
  buses: BusData[] | null;
  initialShift?: 1 | 2;
  onSaveSuccess?: () => void;
}

interface UnitNoteItem {
  id: string;
  unit_body: string;
  note: string;
  isCustom?: boolean;
}

// ponytail: inferensi status dari teks catatan agar selaras dengan master fleet_statuses (1=SGO, 2=TO, 3=OFF, 4=SO)
const resolveStatusFromNote = (noteText: string): { status_id: number | null; status_code: string } => {
  const upper = noteText.toUpperCase().trim();
  if (upper.includes('OFF') || upper.includes('LIBUR')) {
    return { status_id: 3, status_code: 'OFF' };
  }
  if (upper.includes('TO') || upper.includes('EVDAL') || upper.includes('TUKAR')) {
    return { status_id: 2, status_code: 'TO' };
  }
  if (upper.includes('SO') || upper.includes('STOP')) {
    return { status_id: 4, status_code: 'SO' };
  }
  return { status_id: null, status_code: 'CATATAN' };
};

function A2ReportModalComponent({
  isOpen,
  onClose,
  routeId,
  routeCode,
  selectedDate,
  defaultRenops,
  buses,
  initialShift = 1,
  onSaveSuccess,
}: A2ReportModalProps) {
  const [shift, setShift] = useState<1 | 2>(initialShift);
  const [targetRenops, setTargetRenops] = useState<number>(defaultRenops || 30);
  const [realops, setRealops] = useState<number>(defaultRenops || 30);
  const [notes, setNotes] = useState<UnitNoteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Daftar nomor body bus terdaftar dari spreadsheet rute aktif
  const busOptions = useMemo(() => {
    if (!buses || buses.length === 0) return [];
    const units = buses
      .map((b) => (b.unit || '').trim())
      .filter((u) => u.length > 0);
    return Array.from(new Set(units));
  }, [buses]);

  // Inisialisasi & prefill otomatis dari data keterangan spreadsheet (Opsi C)
  useEffect(() => {
    if (!isOpen) return;

    setTargetRenops(defaultRenops || 30);

    // Hitung realops awal dari bus yang memiliki trip > 0 jika ada
    let operatingCount = 0;
    const initialNotes: UnitNoteItem[] = [];

    if (buses && buses.length > 0) {
      buses.forEach((bus, idx) => {
        const tripPergi = parseIndonesianNumber(bus.tripPergi || '');
        const tripPulang = parseIndonesianNumber(bus.tripPulang || '');
        if (tripPergi > 0 || tripPulang > 0) {
          operatingCount++;
        }

        const rawNote = (bus.keterangan || '').trim();
        if (rawNote && rawNote !== '-' && rawNote !== '') {
          initialNotes.push({
            id: `note-${idx}-${Date.now()}`,
            unit_body: bus.unit,
            note: rawNote,
            isCustom: false,
          });
        }
      });
    }

    setNotes(initialNotes);

    if (operatingCount > 0) {
      setRealops(operatingCount);
    } else {
      setRealops(Math.max(0, (defaultRenops || 30) - initialNotes.length));
    }
  }, [isOpen, buses, defaultRenops, shift]);

  if (!isOpen) return null;

  const handleAddNote = () => {
    setNotes((prev) => [
      ...prev,
      {
        id: `note-new-${Date.now()}-${Math.random()}`,
        unit_body: '',
        note: '',
        isCustom: busOptions.length === 0,
      },
    ]);
  };

  const handleRemoveNote = (id: string) => {
    setNotes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSetCustomNote = (id: string, isCustom: boolean) => {
    setNotes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCustom } : item))
    );
  };

  const handleUpdateNote = (id: string, field: 'unit_body' | 'note', val: string) => {
    setNotes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const nonSgoUnitsPayload = notes
        .filter((n) => n.unit_body.trim() !== '')
        .map((n) => {
          const resolved = resolveStatusFromNote(n.note);
          return {
            unit_body: n.unit_body.trim(),
            status_id: resolved.status_id,
            status_code: resolved.status_code,
            note: n.note.trim(),
          };
        });

      const toCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'TO').length;
      const offCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'OFF').length;
      const soCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'SO').length;
      const otherCount = nonSgoUnitsPayload.filter((u) => !['TO', 'OFF', 'SO'].includes(u.status_code)).length;

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
          to_count: toCount,
          off_count: offCount,
          so_count: soCount,
          other_count: otherCount,
          source_type: 'pdo_a2',
          submitted_by_role: 'pdo',
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        },
        nonSgoUnitsPayload
      );

      showSuccessToast(TEXT_PDO_FORM.A2_REPORT.TOAST_SUCCESS(shift));

      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    } catch (err) {
      console.warn('[A2ReportModal] Gagal menyimpan laporan A2:', err);
      showErrorAlert(TEXT_ERRORS.SAVE_REPORT_FAILED, TEXT_PDO_FORM.A2_REPORT.ERROR_SUBMIT);
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
        zIndex: 9999,
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
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-elevated, #1e293b)',
          color: 'var(--color-text-main, #f8fafc)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--color-border, #334155)',
          overflow: 'hidden',
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {TEXT_PDO_FORM.A2_REPORT.MODAL_TITLE}
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted, #94a3b8)',
              }}
            >
              {TEXT_PDO_FORM.A2_REPORT.SUBTITLE(routeCode, selectedDate, shift)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Shift Segmented Control */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShift(1)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: shift === 1 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            >
              Shift 1 (Pagi)
            </button>
            <button
              type="button"
              onClick={() => setShift(2)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                backgroundColor: shift === 2 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            >
              Shift 2 (Siang/Sore)
            </button>
          </div>

          {/* Numeric Inputs: Renops & Realops */}
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
                {TEXT_PDO_FORM.A2_REPORT.RENOPS_TARGET_LABEL}
              </label>
              <input
                type="number"
                min={0}
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
                {TEXT_PDO_FORM.A2_REPORT.REALOPS_LABEL}
              </label>
              <input
                type="number"
                min={0}
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

          {/* Banner Prefill Info */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>ℹ️</span>
            <span>{TEXT_PDO_FORM.A2_REPORT.PREFILL_BANNER}</span>
          </div>

          {/* Unit Notes Section */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted, #94a3b8)',
                }}
              >
                {TEXT_PDO_FORM.A2_REPORT.NOTES_SECTION_TITLE}
              </span>
              <button
                type="button"
                data-testid="a2-add-unit-btn"
                onClick={handleAddNote}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {TEXT_PDO_FORM.A2_REPORT.ADD_UNIT_BTN}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notes.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #334155)',
                  }}
                >
                  {item.isCustom || busOptions.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        data-testid="a2-unit-input"
                        value={item.unit_body}
                        placeholder={TEXT_PDO_FORM.A2_REPORT.UNIT_BODY_PLACEHOLDER}
                        onChange={(e) => handleUpdateNote(item.id, 'unit_body', e.target.value)}
                        style={{
                          width: busOptions.length > 0 ? '95px' : '110px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border, #475569)',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          color: '#fff',
                          fontSize: '0.85rem',
                        }}
                      />
                      {busOptions.length > 0 && (
                        <button
                          type="button"
                          title={TEXT_PDO_FORM.A2_REPORT.SWITCH_TO_DROPDOWN_BTN}
                          onClick={() => handleSetCustomNote(item.id, false)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '6px 7px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          ▼
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      data-testid="a2-unit-input"
                      data-unit-select="true"
                      aria-label="Pilih Nomor Body Unit"
                      value={item.unit_body}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__manual__') {
                          handleUpdateNote(item.id, 'unit_body', '');
                          handleSetCustomNote(item.id, true);
                        } else {
                          handleUpdateNote(item.id, 'unit_body', val);
                        }
                      }}
                      style={{
                        width: '135px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border, #475569)',
                        backgroundColor: 'var(--color-bg-elevated, #1e293b)',
                        color: item.unit_body ? 'var(--color-text-main, #f8fafc)' : 'var(--color-text-muted, #94a3b8)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="" disabled style={{ background: '#1e293b', color: '#94a3b8' }}>
                        {TEXT_PDO_FORM.A2_REPORT.SELECT_UNIT_PLACEHOLDER}
                      </option>
                      {item.unit_body && !busOptions.includes(item.unit_body) && (
                        <option value={item.unit_body} style={{ background: '#1e293b', color: '#f8fafc' }}>
                          {item.unit_body}
                        </option>
                      )}
                      {busOptions.map((unit) => (
                        <option key={unit} value={unit} style={{ background: '#1e293b', color: '#f8fafc' }}>
                          {unit}
                        </option>
                      ))}
                      <option
                        value="__manual__"
                        style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 600 }}
                      >
                        {TEXT_PDO_FORM.A2_REPORT.CUSTOM_UNIT_OPTION}
                      </option>
                    </select>
                  )}
                  <input
                    type="text"
                    data-testid="a2-note-input"
                    value={item.note}
                    placeholder={TEXT_PDO_FORM.A2_REPORT.NOTE_PLACEHOLDER}
                    onChange={(e) => handleUpdateNote(item.id, 'note', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #475569)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(item.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {TEXT_PDO_FORM.A2_REPORT.REMOVE_UNIT_BTN}
                  </button>
                </div>
              ))}
            </div>
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
            data-testid="a2-submit-btn"
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isSubmitting
              ? TEXT_PDO_FORM.A2_REPORT.SAVING_BTN
              : TEXT_PDO_FORM.A2_REPORT.SUBMIT_BTN(shift)}
          </button>
        </div>
      </div>
    </div>
  );
}

export const A2ReportModal = memo(A2ReportModalComponent);
export default A2ReportModal;
