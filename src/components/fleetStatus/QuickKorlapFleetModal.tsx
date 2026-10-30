import { useState, useEffect, memo } from 'react';
import { upsertDailyFleetShift } from '../../services/fleetStatusService';
import { fetchDailyRouteReport, upsertDailyRouteReport } from '../../services/dailyRouteReportService';
import { TEXT_FLEET_STATUS } from '../../constants/texts/text_fleet_status';
import { TEXT_COMMON } from '../../constants/texts/text_common';

/**
 * Parser cerdas untuk input teks bebas nomor bodi dan catatan unit oleh Korlap.
 * Mendukung format:
 * - "KWK 222177 OFF" -> unit: "KWK 222177", note: "OFF"
 * - "TS.02 Radiator bocor" -> unit: "TS.02", note: "Radiator bocor"
 * - "BA 01 - EVDAL" -> unit: "BA 01", note: "EVDAL"
 * - "SAF 05 : Mogok di lampu merah" -> unit: "SAF 05", note: "Mogok di lampu merah"
 * - "222180 Libur" -> unit: "222180", note: "Libur"
 */
export function parseKorlapUnitNote(p: string): {
  unit_body: string;
  status_id: number | null;
  status_code: string;
  note: string;
} {
  const trimmed = p.trim();
  // Regex: Tangkap kode operator Mikrotrans (KWK, KLM, TS, BA, SAF, TJ, BMP, dll) beserta nomor, atau nomor bodi murni
  const match = trimmed.match(/^([A-Z]{2,4}[\s.\-_]?\d+|\d+)\s*[:\-–]?\s*(.*)$/i);
  let unitBody = 'UNIT';
  let noteText = trimmed;

  if (match) {
    unitBody = match[1].trim().toUpperCase();
    noteText = match[2].trim() || 'TIDAK OPERASI';
  } else {
    // Fallback: split berdasarkan tanda titik dua, strip, atau spasi pertama
    const splitColon = trimmed.split(/[:\-–]/);
    if (splitColon.length > 1) {
      unitBody = splitColon[0].trim().toUpperCase();
      noteText = splitColon.slice(1).join('-').trim() || trimmed;
    } else {
      const splitSpace = trimmed.split(/\s+/);
      unitBody = (splitSpace[0] || 'UNIT').toUpperCase();
      noteText = splitSpace.slice(1).join(' ') || trimmed;
    }
  }

  const upperNote = noteText.toUpperCase();
  let statusId: number | null = null;
  let statusCode = 'CATATAN';

  const hasWord = (regex: RegExp) => regex.test(upperNote);

  if (hasWord(/(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/)) {
    statusId = 3;
    statusCode = 'OFF';
  } else if (
    hasWord(/(^|[^A-Z])(MOGOK|RUSAK|LAKA|TROUBLE|SERVICE|PERBAIKAN|BAP|BOCOR|RADIATOR|DEREK|STUT|BAN)([^A-Z]|$)/)
  ) {
    statusId = 2;
    statusCode = 'KENDALA';
  } else if (hasWord(/(^|[^A-Z])(TO|EVDAL|TUKAR)([^A-Z]|$)/)) {
    statusId = 2;
    statusCode = 'TO';
  } else if (hasWord(/(^|[^A-Z])(SO|STOP)([^A-Z]|$)/)) {
    statusId = 4;
    statusCode = 'SO';
  }

  return {
    unit_body: unitBody,
    status_id: statusId,
    status_code: statusCode,
    note: noteText,
  };
}

export interface QuickKorlapFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number;
  routeCode: string;
  selectedDate: string;
  shift: 1 | 2;
  defaultRenops?: number;
  initialRealops?: number;
  initialNotes?: string;
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
  initialNotes,
  onSaveSuccess,
}: QuickKorlapFleetModalProps) {
  const [currentShift, setCurrentShift] = useState<1 | 2>(shift);
  const [targetRenops, setTargetRenops] = useState<number>(defaultRenops);
  const [realops, setRealops] = useState<number>(initialRealops ?? defaultRenops);
  const [rawNotes, setRawNotes] = useState<string>(initialNotes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentShift(shift);
      setTargetRenops(defaultRenops);
      setRealops(initialRealops ?? defaultRenops);
      setRawNotes(initialNotes || '');
    }
  }, [isOpen, shift, defaultRenops, initialRealops, initialNotes]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Parsing catatan unit dengan parser cerdas
      const nonSgoUnitsPayload: Array<{
        unit_body: string;
        status_id?: number | null;
        status_code: string;
        note: string;
      }> = [];

      if (rawNotes.trim()) {
        const parts = rawNotes
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        parts.forEach((p) => {
          nonSgoUnitsPayload.push(parseKorlapUnitNote(p));
        });
      }

      const toCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'TO').length;
      const offCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'OFF').length;
      const soCount = nonSgoUnitsPayload.filter((u) => u.status_code === 'SO').length;
      const otherCount = nonSgoUnitsPayload.filter((u) => !['TO', 'OFF', 'SO'].includes(u.status_code)).length;

      // 1. Simpan ke daily_fleet_shifts & daily_fleet_non_sgo_units
      await upsertDailyFleetShift(
        {
          route_id: routeId,
          route_code: routeCode,
          date: selectedDate,
          shift: currentShift,
          target_renops: targetRenops,
          realops,
          total_units: targetRenops,
          sgo_count: realops,
          to_count: toCount,
          off_count: offCount,
          so_count: soCount,
          other_count: otherCount,
          source_type: 'korlap_manual',
          submitted_by_role: 'korlap',
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        },
        nonSgoUnitsPayload
      );

      // 2. Sinkronkan ke daily_route_reports agar monitoring 18 rute & generator WA report langsung konsisten
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
          ...(currentShift === 1
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
          data_source: existingReport?.data_source || 'app_input',
        });
      } catch (syncErr) {
        console.warn('[QuickKorlapFleetModal] Sinkronisasi ke daily_route_reports dilewati:', syncErr);
      }

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
              {TEXT_FLEET_STATUS.QUICK_KORLAP.SUBTITLE(routeCode, currentShift)}
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
          {/* Shift Segmented Tabs */}
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
              Pilih Shift:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCurrentShift(1)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: currentShift === 1 ? '1px solid var(--accent-color, #3ECF8E)' : '1px solid var(--color-border, #334155)',
                  background: currentShift === 1 ? 'rgba(62, 207, 142, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                  color: currentShift === 1 ? 'var(--accent-color, #3ECF8E)' : 'var(--color-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Shift 1 (Pagi)
              </button>
              <button
                type="button"
                onClick={() => setCurrentShift(2)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: currentShift === 2 ? '1px solid var(--accent-color, #3ECF8E)' : '1px solid var(--color-border, #334155)',
                  background: currentShift === 2 ? 'rgba(62, 207, 142, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                  color: currentShift === 2 ? 'var(--accent-color, #3ECF8E)' : 'var(--color-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Shift 2 (Siang)
              </button>
            </div>
          </div>

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
              rows={4}
              data-testid="korlap-notes-input"
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder={TEXT_FLEET_STATUS.QUICK_KORLAP.NOTES_PLACEHOLDER}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                resize: 'vertical',
                lineHeight: 1.4,
              }}
            />
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #94a3b8)',
              }}
            >
              Format: <em>Nomor Unit Catatan</em> (dipisah baris baru atau koma). Contoh: <code>TS.02 BA.01 Radiator</code>, <code>TS.05 EVDAL</code>, <code>KWK 222177 OFF</code>.
            </p>
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
              background: 'var(--accent-color, #3ECF8E)',
              color: '#000',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
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
