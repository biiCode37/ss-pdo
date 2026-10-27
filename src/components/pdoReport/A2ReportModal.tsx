import { useState, useEffect, useMemo, memo } from 'react';
import { Trash2, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import type { BusData } from '../../services/googleSheets';
import { parseIndonesianNumber } from '../../utils/numberUtils';
import { upsertDailyFleetShift, fetchDailyFleetShift } from '../../services/fleetStatusService';
import { fetchDailyRouteReport, upsertDailyRouteReport } from '../../services/dailyRouteReportService';
import { TEXT_PDO_FORM } from '../../constants/texts/text_pdo_form';
import { TEXT_COMMON } from '../../constants/texts/text_common';
import { TEXT_ERRORS } from '../../constants/texts/text_errors';
import { showSuccessToast, showErrorAlert, showSuccessAlert } from '../../utils/alertUtils';
import { useMobileBackHandler } from '@/hooks/useMobileBackHandler';

export interface A2ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number;
  routeCode: string;
  selectedDate: string;
  defaultRenops: number;
  buses: BusData[] | null;
  initialShift?: 1 | 2;
  onSaveSuccess?: (shift: 1 | 2) => void;
  onSaveFailure?: () => void;
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
  const hasWord = (regex: RegExp) => regex.test(upper);

  if (hasWord(/(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/)) {
    return { status_id: 3, status_code: 'OFF' };
  }
  if (
    hasWord(/(^|[^A-Z])(MOGOK|RUSAK|LAKA|TROUBLE|SERVICE|PERBAIKAN|BAP|BOCOR|RADIATOR|DEREK|STUT|BAN)([^A-Z]|$)/)
  ) {
    return { status_id: 2, status_code: 'KENDALA' };
  }
  if (hasWord(/(^|[^A-Z])(TO|EVDAL|TUKAR)([^A-Z]|$)/)) {
    return { status_id: 2, status_code: 'TO' };
  }
  if (hasWord(/(^|[^A-Z])(SO|STOP)([^A-Z]|$)/)) {
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
  onSaveFailure,
}: A2ReportModalProps) {
  useMobileBackHandler({
    id: 'a2_report_modal',
    isOpen,
    onClose,
  });

  const [shift, setShift] = useState<1 | 2>(initialShift);
  const [targetRenops, setTargetRenops] = useState<number>(defaultRenops || 30);
  const [realops, setRealops] = useState<number>(defaultRenops || 30);
  const [notes, setNotes] = useState<UnitNoteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState<boolean>(false);
  const [savedAtTime, setSavedAtTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);

  // Daftar nomor body bus terdaftar dari spreadsheet rute aktif
  const busOptions = useMemo(() => {
    if (!buses || buses.length === 0) return [];
    const units = buses
      .map((b) => (b.unit || '').trim())
      .filter((u) => u.length > 0);
    return Array.from(new Set(units));
  }, [buses]);

  // Inisialisasi & prefill tangguh: Cek data tersimpan di DB lebih dulu, lalu fallback ke spreadsheet
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingSaved(true);
    setErrorMessage(null);

    fetchDailyFleetShift(routeId, selectedDate, shift)
      .then((savedShift) => {
        if (!isMounted) return;

        if (
          savedShift &&
          (savedShift.is_confirmed || (savedShift.realops !== undefined && savedShift.realops > 0))
        ) {
          setTargetRenops(savedShift.target_renops || defaultRenops || 30);
          setRealops(savedShift.realops ?? (defaultRenops || 30));

          if (savedShift.non_sgo_units && savedShift.non_sgo_units.length > 0) {
            setNotes(
              savedShift.non_sgo_units.map((u, idx) => ({
                id: `saved-${u.id || idx}-${Date.now()}`,
                unit_body: u.unit_body,
                note: u.note || u.status_code,
                isCustom: !busOptions.includes(u.unit_body),
              }))
            );
          } else {
            setNotes([]);
          }

          setIsAlreadySaved(true);
          if (savedShift.confirmed_at) {
            try {
              const d = new Date(savedShift.confirmed_at);
              setSavedAtTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            } catch {
              setSavedAtTime(null);
            }
          }
        } else {
          setIsAlreadySaved(false);
          setSavedAtTime(null);
          setTargetRenops(defaultRenops || 30);

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
        }
      })
      .catch((err) => {
        console.warn('[A2ReportModal] Gagal memuat data tersimpan dari DB:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSaved(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, routeId, selectedDate, shift, defaultRenops, buses, busOptions]);

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
      setErrorMessage(null);

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

      // 1. Simpan ke daily_fleet_shifts & daily_fleet_non_sgo_units (SSOT status armada per shift)
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

      // 2. Sinkronkan ke daily_route_reports agar monitoring 18 rute & WA report langsung ter-update
      try {
        const existingReport = await fetchDailyRouteReport(routeId, selectedDate);
        const nonSgoFleetDetails = nonSgoUnitsPayload.map((u) => ({
          unit: u.unit_body,
          note: u.note,
          isOff: u.status_code === 'OFF',
        }));

        const nowIso = new Date().toISOString();
        await upsertDailyRouteReport({
          ...(existingReport || {}),
          route_id: routeId,
          route_code: routeCode,
          date: selectedDate,
          ...(shift === 1
            ? {
                renops_shift1: targetRenops,
                realops_shift1: realops,
                is_fleet_confirmed_s1: true,
                fleet_confirmed_s1_at: nowIso,
                fleet_status_shift1: nonSgoFleetDetails,
              }
            : {
                renops_shift2: targetRenops,
                realops_shift2: realops,
                is_fleet_confirmed_s2: true,
                fleet_confirmed_s2_at: nowIso,
                fleet_status_shift2: nonSgoFleetDetails,
              }),
          status: existingReport?.status === 'verified' ? 'verified' : 'submitted',
          data_source: 'app_input',
        });
      } catch (syncErr) {
        console.warn('[A2ReportModal] Sinkronisasi ke daily_route_reports dilewati:', syncErr);
      }

      showSuccessToast(TEXT_PDO_FORM.A2_REPORT.TOAST_SUCCESS(shift));
      await showSuccessAlert(
        TEXT_PDO_FORM.A2_REPORT.ALERT_SUCCESS_TITLE,
        TEXT_PDO_FORM.A2_REPORT.ALERT_SUCCESS_DETAIL(shift, routeCode)
      );

      if (onSaveSuccess) {
        onSaveSuccess(shift);
      }
      onClose();
    } catch (err) {
      console.warn('[A2ReportModal] Gagal menyimpan laporan A2:', err);
      setErrorMessage(TEXT_PDO_FORM.A2_REPORT.ERROR_SUBMIT);
      showErrorAlert(TEXT_ERRORS.SAVE_REPORT_FAILED, TEXT_PDO_FORM.A2_REPORT.ERROR_SUBMIT);
      if (onSaveFailure) {
        onSaveFailure();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
        WebkitBackdropFilter: 'blur(8px)',
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(90vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-elevated, #1e293b)',
          color: 'var(--color-text-main, #f8fafc)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border, #334155)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              {TEXT_PDO_FORM.A2_REPORT.MODAL_TITLE}
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.82rem',
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
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: '16px 14px',
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Shift Segmented Control */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShift(1)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                backgroundColor: shift === 1 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            >
              {TEXT_PDO_FORM.A2_REPORT.SHIFT_1_TAB}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShift(2)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                backgroundColor: shift === 2 ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            >
              {TEXT_PDO_FORM.A2_REPORT.SHIFT_2_TAB}
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
                disabled={isSubmitting}
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
                  opacity: isSubmitting ? 0.7 : 1,
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
                disabled={isSubmitting}
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
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              />
            </div>
          </div>

          {/* Banner Status Prefill / Tersimpan di Server */}
          {isLoadingSaved ? (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Loader2 size={14} className="animate-spin" />
              <span>Memeriksa status laporan di server...</span>
            </div>
          ) : isAlreadySaved ? (
            <div
              data-testid="a2-saved-banner"
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={15} style={{ flexShrink: 0, color: '#34d399' }} />
              <span>{TEXT_PDO_FORM.A2_REPORT.SAVED_BANNER(shift, savedAtTime || undefined)}</span>
            </div>
          ) : (
            <div
              data-testid="a2-prefill-banner"
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
          )}

          {/* In-Modal Error Banner with Retry Button */}
          {errorMessage && (
            <div
              data-testid="a2-error-banner"
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#fca5a5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {TEXT_PDO_FORM.A2_REPORT.RETRY_BTN}
              </button>
            </div>
          )}

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
                disabled={isSubmitting}
                onClick={handleAddNote}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isSubmitting ? '#64748b' : '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '4px',
                }}
              >
                {TEXT_PDO_FORM.A2_REPORT.ADD_UNIT_BTN}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {notes.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #334155)',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {item.isCustom || busOptions.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <input
                        type="text"
                        data-testid="a2-unit-input"
                        disabled={isSubmitting}
                        value={item.unit_body}
                        placeholder={TEXT_PDO_FORM.A2_REPORT.UNIT_BODY_PLACEHOLDER}
                        onChange={(e) => handleUpdateNote(item.id, 'unit_body', e.target.value)}
                        style={{
                          width: busOptions.length > 0 ? '85px' : '105px',
                          minWidth: 0,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border, #475569)',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          color: '#fff',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                          opacity: isSubmitting ? 0.7 : 1,
                        }}
                      />
                      {busOptions.length > 0 && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          title={TEXT_PDO_FORM.A2_REPORT.SWITCH_TO_DROPDOWN_BTN}
                          onClick={() => handleSetCustomNote(item.id, false)}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            padding: '6px 7px',
                            fontSize: '0.75rem',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            flexShrink: 0,
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
                      disabled={isSubmitting}
                      aria-label={TEXT_PDO_FORM.A2_REPORT.UNIT_SELECT_ARIA}
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
                        width: '115px',
                        maxWidth: '120px',
                        minWidth: '95px',
                        flexShrink: 0,
                        padding: '6px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border, #475569)',
                        backgroundColor: 'var(--color-bg-elevated, #1e293b)',
                        color: item.unit_body ? 'var(--color-text-main, #f8fafc)' : 'var(--color-text-muted, #94a3b8)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxSizing: 'border-box',
                        opacity: isSubmitting ? 0.7 : 1,
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
                    disabled={isSubmitting}
                    value={item.note}
                    placeholder={TEXT_PDO_FORM.A2_REPORT.NOTE_PLACEHOLDER}
                    onChange={(e) => handleUpdateNote(item.id, 'note', e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #475569)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-label={TEXT_PDO_FORM.A2_REPORT.REMOVE_UNIT_BTN}
                    title={TEXT_PDO_FORM.A2_REPORT.REMOVE_UNIT_BTN}
                    onClick={() => handleRemoveNote(item.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: '6px',
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      opacity: isSubmitting ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border, #334155)',
            backgroundColor: 'var(--color-bg-elevated, #1e293b)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #475569)',
              background: 'transparent',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              opacity: isSubmitting ? 0.5 : 1,
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
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              flexShrink: 0,
              opacity: isSubmitting ? 0.8 : 1,
              transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{TEXT_PDO_FORM.A2_REPORT.SAVING_BTN}</span>
              </>
            ) : (
              <span>{TEXT_PDO_FORM.A2_REPORT.SUBMIT_BTN(shift)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export const A2ReportModal = memo(A2ReportModalComponent);
export default A2ReportModal;
