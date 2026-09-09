import { useState, useEffect, useCallback, memo, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  Bus,
  Plus,
  Send,
  Loader2,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { fetchDailyRouteReport, upsertDailyRouteReport } from '../services/dailyRouteReportService';
import type { DailyRouteReport } from '../types/supabase';
import { showSuccessToast, showErrorAlert } from '../utils/alertUtils';
import { TEXT_PDO_FORM, TEXT_ERRORS } from '../constants/texts';
import { useMobileBackHandler } from '../hooks/useMobileBackHandler';

const isTestEnv =
  import.meta.env?.MODE === 'test' ||
  Boolean((globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT);

interface Props {
  routeId: number;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  defaultTrafficJamSpots?: string[];
  defaultRenops?: number;
  userEmail?: string;
  onSaved?: () => void;
  onStatusChange?: (status: 'draft' | 'submitted' | 'verified') => void;
  asModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenFleetStatus?: () => void;
}

function RouteOperationalReportCardComponent({
  routeId,
  routeCode,
  selectedDate,
  defaultTrafficJamSpots = [],
  defaultRenops = 0,
  userEmail,
  onSaved,
  onStatusChange,
  asModal = false,
  isOpen = true,
  onClose,
  onOpenFleetStatus,
}: Props) {
  useMobileBackHandler({
    id: 'route_operational_report_sheet',
    isOpen: asModal && !!isOpen,
    onClose: onClose || (() => {}),
  });

  // Body scroll lock saat modal terbuka
  useEffect(() => {
    if (!asModal || !isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [asModal, isOpen]);

  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [renopsS1, setRenopsS1] = useState<number>(defaultRenops);
  const [realopsS1, setRealopsS1] = useState<number>(defaultRenops);
  const [renopsS2, setRenopsS2] = useState<number>(defaultRenops);
  const [realopsS2, setRealopsS2] = useState<number>(defaultRenops);
  const [headwayFastest, setHeadwayFastest] = useState<number>(3);
  const [headwaySlowest, setHeadwaySlowest] = useState<number>(10);
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [newSpotText, setNewSpotText] = useState('');
  const [operationalIssues, setOperationalIssues] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted' | 'verified'>('draft');

  // Load existing report
  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      if (!routeId || !selectedDate || (asModal && !isOpen)) return;
      setLoading(true);
      try {
        const report = await fetchDailyRouteReport(routeId, selectedDate);
        if (!isMounted) return;
        if (report) {
          setRenopsS1(report.renops_shift1 || defaultRenops);
          setRealopsS1(report.realops_shift1 || defaultRenops);
          setRenopsS2(report.renops_shift2 || defaultRenops);
          setRealopsS2(report.realops_shift2 || defaultRenops);
          setHeadwayFastest(report.headway_fastest || 3);
          setHeadwaySlowest(report.headway_slowest || 10);
          setSelectedSpots(report.traffic_jam_spots || []);
          setOperationalIssues(report.operational_issues || '');
          const nextStatus = report.status || 'draft';
          setStatus(nextStatus);
          onStatusChange?.(nextStatus);
        } else {
          setRenopsS1(defaultRenops);
          setRealopsS1(defaultRenops);
          setRenopsS2(defaultRenops);
          setRealopsS2(defaultRenops);
          setHeadwayFastest(3);
          setHeadwaySlowest(10);
          setSelectedSpots([]);
          setOperationalIssues('');
          setStatus('draft');
          onStatusChange?.('draft');
        }
      } catch (err) {
        console.warn('[RouteOperationalReportCard] Gagal memuat data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReport();
    return () => {
      isMounted = false;
    };
  }, [routeId, selectedDate, defaultRenops, onStatusChange, asModal, isOpen]);

  // Toggle Traffic Jam Chip
  const toggleSpot = useCallback((spot: string) => {
    setSelectedSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot]
    );
  }, []);

  // Add Custom Spot
  const handleAddCustomSpot = useCallback(() => {
    const trimmed = newSpotText.trim();
    if (!trimmed) return;
    if (!selectedSpots.includes(trimmed)) {
      setSelectedSpots((prev) => [...prev, trimmed]);
    }
    setNewSpotText('');
  }, [newSpotText, selectedSpots]);

  // Submit Handler
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<DailyRouteReport> & {
        route_id: number;
        route_code: string;
        date: string;
      } = {
        route_id: routeId,
        route_code: routeCode,
        date: selectedDate,
        renops_shift1: Number(renopsS1) || 0,
        realops_shift1: Number(realopsS1) || 0,
        renops_shift2: Number(renopsS2) || 0,
        realops_shift2: Number(realopsS2) || 0,
        headway_fastest: Number(headwayFastest) || 0,
        headway_slowest: Number(headwaySlowest) || 0,
        traffic_jam_spots: selectedSpots,
        operational_issues: operationalIssues.trim(),
        status: 'submitted',
        submitted_by: userEmail || 'Petugas PDO',
      };

      await upsertDailyRouteReport(payload);
      setStatus('submitted');
      onStatusChange?.('submitted');
      showSuccessToast(TEXT_PDO_FORM.TOAST_SUCCESS);
      if (onSaved) onSaved();
    } catch (err: any) {
      showErrorAlert('Gagal Menyimpan', err?.message || TEXT_ERRORS.DEFAULT_FALLBACK);
    } finally {
      setSaving(false);
    }
  };

  const allAvailableSpots = Array.from(
    new Set([...defaultTrafficJamSpots, ...selectedSpots])
  );

  const renderStatusBadge = () => (
    <>
      {status === 'verified' && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.14)',
            color: 'var(--success-color, #10b981)',
            padding: '3px 9px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          {TEXT_PDO_FORM.BADGES.VERIFIED}
        </span>
      )}
      {status === 'submitted' && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(14, 165, 233, 0.14)',
            color: 'var(--info-color, #38bdf8)',
            padding: '3px 9px',
            borderRadius: '8px',
            border: '1px solid rgba(14, 165, 233, 0.3)',
          }}
        >
          {TEXT_PDO_FORM.BADGES.SUBMITTED}
        </span>
      )}
      {status === 'draft' && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.14)',
            color: 'var(--warning-color, #f59e0b)',
            padding: '3px 9px',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          {TEXT_PDO_FORM.BADGES.DRAFT}
        </span>
      )}
    </>
  );

  const renderFormBody = () => (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          {/* Section 1: Armada Per Shift */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  margin: 0,
                }}
              >
                {TEXT_PDO_FORM.ARMADA_SECTION}
              </label>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              {/* Shift 1 */}
              <div
                style={{
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {TEXT_PDO_FORM.SHIFT_1.TITLE}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="renops-s1"
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {TEXT_PDO_FORM.SHIFT_1.RENOPS_LABEL}
                    </label>
                    <input
                      id="renops-s1"
                      type="number"
                      min={0}
                      className="input-field tabular-nums"
                      value={renopsS1}
                      onChange={(e) => setRenopsS1(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="realops-s1"
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {TEXT_PDO_FORM.SHIFT_1.REALOPS_LABEL}
                    </label>
                    <input
                      id="realops-s1"
                      type="number"
                      min={0}
                      className="input-field tabular-nums"
                      value={realopsS1}
                      onChange={(e) => setRealopsS1(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Shift 2 */}
              <div
                style={{
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.03))',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#a855f7',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {TEXT_PDO_FORM.SHIFT_2.TITLE}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="renops-s2"
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {TEXT_PDO_FORM.SHIFT_2.RENOPS_LABEL}
                    </label>
                    <input
                      id="renops-s2"
                      type="number"
                      min={0}
                      className="input-field tabular-nums"
                      value={renopsS2}
                      onChange={(e) => setRenopsS2(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="realops-s2"
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {TEXT_PDO_FORM.SHIFT_2.REALOPS_LABEL}
                    </label>
                    <input
                      id="realops-s2"
                      type="number"
                      min={0}
                      className="input-field tabular-nums"
                      value={realopsS2}
                      onChange={(e) => setRealopsS2(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Headway */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <Clock size={14} color="var(--accent-color, #3ECF8E)" />
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  margin: 0,
                }}
              >
                {TEXT_PDO_FORM.HEADWAY.SECTION_TITLE}
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label
                  htmlFor="headway-fastest"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  {TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL}
                </label>
                <input
                  id="headway-fastest"
                  type="number"
                  min={1}
                  className="input-field tabular-nums"
                  value={headwayFastest}
                  onChange={(e) => setHeadwayFastest(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="headway-slowest"
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  {TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL}
                </label>
                <input
                  id="headway-slowest"
                  type="number"
                  min={1}
                  className="input-field tabular-nums"
                  value={headwaySlowest}
                  onChange={(e) => setHeadwaySlowest(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Titik Kemacetan Chips */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <AlertTriangle size={14} color="var(--warning-color, #f59e0b)" />
              <label
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  margin: 0,
                }}
              >
                {TEXT_PDO_FORM.TRAFFIC_JAMS.SECTION_TITLE}
              </label>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '10px',
              }}
            >
              {allAvailableSpots.map((spot) => {
                const isSelected = selectedSpots.includes(spot);
                return (
                  <button
                    key={spot}
                    type="button"
                    onClick={() => toggleSpot(spot)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected
                        ? 'rgba(245, 158, 11, 0.18)'
                        : 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                      color: isSelected ? 'var(--warning-color, #f59e0b)' : 'var(--text-secondary)',
                      border: isSelected
                        ? '1px solid rgba(245, 158, 11, 0.45)'
                        : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--warning-color, #f59e0b)',
                        }}
                      />
                    )}
                    <span>{spot}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Tambah Titik Macet */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder={TEXT_PDO_FORM.TRAFFIC_JAMS.ADD_SPOT_PLACEHOLDER}
                value={newSpotText}
                onChange={(e) => setNewSpotText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSpot();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomSpot}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'var(--input-bg, rgba(255, 255, 255, 0.06))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.15s ease',
                }}
              >
                <Plus size={14} /> <span>{TEXT_PDO_FORM.TRAFFIC_JAMS.ADD_BTN}</span>
              </button>
            </div>
          </div>

          {/* Section 4: Catatan Kendala */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="kendala-text"
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              {TEXT_PDO_FORM.ISSUES.SECTION_TITLE}
            </label>
            <textarea
              id="kendala-text"
              rows={2}
              className="input-field"
              placeholder={TEXT_PDO_FORM.ISSUES.PLACEHOLDER}
              value={operationalIssues}
              onChange={(e) => setOperationalIssues(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || loading}
            className="btn"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: saving ? 0.75 : 1,
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {saving ? (
              <>
                <Loader2 className="spinner" size={16} />
                <span>{TEXT_PDO_FORM.BUTTONS.SUBMITTING}</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>{TEXT_PDO_FORM.BUTTONS.SUBMIT}</span>
              </>
            )}
          </button>
        </form>
  );

  if (asModal) {
    const modalContent = (
      <div
        className="modal-overlay operational-report-modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: isOpen ? 'flex' : 'none',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 99999,
          touchAction: 'none',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div
          className="glass pdo-operational-card"
          style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '16px 20px calc(28px + env(safe-area-inset-bottom, 16px)) 20px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: 'var(--bg-card, #171717)',
            border: '1px solid var(--border-color)',
            borderBottom: 'none',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Top Handle Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'var(--text-secondary)',
                opacity: 0.35,
              }}
            />
          </div>

          {/* Modal Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '12px',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(62, 207, 142, 0.12)',
                  color: 'var(--accent-color, #3ECF8E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bus size={18} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {TEXT_PDO_FORM.CARD_TITLE}
                </h3>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {TEXT_PDO_FORM.CARD_SUBTITLE(routeCode)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {renderStatusBadge()}
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Segmented Control: Status Armada vs Laporan Operasional */}
          {onOpenFleetStatus && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '4px',
                borderRadius: '12px',
                background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={onOpenFleetStatus}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Buka pengaturan unit armada"
              >
                <span>Status Armada</span>
              </button>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--bg-secondary, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                <span>Laporan Operasional</span>
              </button>
            </div>
          )}

          {renderFormBody()}
        </div>
      </div>
    );

    if (isTestEnv || !isOpen) {
      return modalContent;
    }

    return createPortal(modalContent, document.body);
  }

  return (
    <div
      className="glass pdo-operational-card"
      style={{
        borderRadius: '16px',
        padding: '16px 18px',
        marginBottom: '16px',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar Accordion */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          paddingBottom: isExpanded ? '12px' : '0',
          borderBottom: isExpanded ? '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' : 'none',
          transition: 'padding 0.2s ease',
        }}
        title={isExpanded ? 'Klik untuk menciutkan form' : 'Klik untuk membuka form'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(62, 207, 142, 0.12)',
              color: 'var(--accent-color, #3ECF8E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bus size={18} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.2px',
              }}
            >
              {TEXT_PDO_FORM.CARD_TITLE}
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {TEXT_PDO_FORM.CARD_SUBTITLE(routeCode)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {renderStatusBadge()}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
              color: 'var(--text-secondary)',
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expandable Form Body */}
      {isExpanded && renderFormBody()}
    </div>
  );
}

export const RouteOperationalReportCard = memo(RouteOperationalReportCardComponent);
