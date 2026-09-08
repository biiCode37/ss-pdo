import { useState, useEffect, useCallback, memo, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Bus,
  Plus,
  Send,
} from 'lucide-react';
import { fetchDailyRouteReport, upsertDailyRouteReport } from '../services/dailyRouteReportService';
import type { DailyRouteReport } from '../types/supabase';
import { showSuccessToast, showErrorAlert } from '../utils/alertUtils';
import { TEXT_PDO_FORM, TEXT_ERRORS } from '../constants/texts';

interface Props {
  routeId: number;
  routeCode: string;
  selectedDate: string; // YYYY-MM-DD
  defaultTrafficJamSpots?: string[];
  defaultRenops?: number;
  userEmail?: string;
  onSaved?: () => void;
}

function RouteOperationalReportCardComponent({
  routeId,
  routeCode,
  selectedDate,
  defaultTrafficJamSpots = [],
  defaultRenops = 0,
  userEmail,
  onSaved
}: Props) {
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
      if (!routeId || !selectedDate) return;
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
          setStatus(report.status || 'draft');
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
  }, [routeId, selectedDate, defaultRenops]);

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
        submitted_by: userEmail || 'Petugas PDO'
      };

      await upsertDailyRouteReport(payload);
      setStatus('submitted');
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

  return (
    <div
      style={{
        background: 'var(--card-bg, #ffffff)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
        transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
      }}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bus size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
              {TEXT_PDO_FORM.CARD_TITLE}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
              {TEXT_PDO_FORM.CARD_SUBTITLE(routeCode)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status === 'verified' && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                padding: '3px 8px',
                borderRadius: '8px'
              }}
            >
              {TEXT_PDO_FORM.BADGES.VERIFIED}
            </span>
          )}
          {status === 'submitted' && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                padding: '3px 8px',
                borderRadius: '8px'
              }}
            >
              {TEXT_PDO_FORM.BADGES.SUBMITTED}
            </span>
          )}
          {status === 'draft' && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(234, 179, 8, 0.12)',
                color: '#ca8a04',
                padding: '3px 8px',
                borderRadius: '8px'
              }}
            >
              {TEXT_PDO_FORM.BADGES.DRAFT}
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expandable Form Body */}
      {isExpanded && (
        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          {/* Section 1: Armada Per Shift */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {TEXT_PDO_FORM.ARMADA_SECTION}
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              {/* Shift 1 */}
              <div
                style={{
                  background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.06))'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#3b82f6',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  {TEXT_PDO_FORM.SHIFT_1.TITLE}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="renops-s1"
                      style={{ fontSize: '10px', color: '#64748b', display: 'block' }}
                    >
                      {TEXT_PDO_FORM.SHIFT_1.RENOPS_LABEL}
                    </label>
                    <input
                      id="renops-s1"
                      type="number"
                      min={0}
                      value={renopsS1}
                      onChange={(e) => setRenopsS1(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="realops-s1"
                      style={{ fontSize: '10px', color: '#64748b', display: 'block' }}
                    >
                      {TEXT_PDO_FORM.SHIFT_1.REALOPS_LABEL}
                    </label>
                    <input
                      id="realops-s1"
                      type="number"
                      min={0}
                      value={realopsS1}
                      onChange={(e) => setRealopsS1(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Shift 2 */}
              <div
                style={{
                  background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, rgba(0,0,0,0.06))'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  {TEXT_PDO_FORM.SHIFT_2.TITLE}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="renops-s2"
                      style={{ fontSize: '10px', color: '#64748b', display: 'block' }}
                    >
                      {TEXT_PDO_FORM.SHIFT_2.RENOPS_LABEL}
                    </label>
                    <input
                      id="renops-s2"
                      type="number"
                      min={0}
                      value={renopsS2}
                      onChange={(e) => setRenopsS2(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="realops-s2"
                      style={{ fontSize: '10px', color: '#64748b', display: 'block' }}
                    >
                      {TEXT_PDO_FORM.SHIFT_2.REALOPS_LABEL}
                    </label>
                    <input
                      id="realops-s2"
                      type="number"
                      min={0}
                      value={realopsS2}
                      onChange={(e) => setRealopsS2(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Headway */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {TEXT_PDO_FORM.HEADWAY.SECTION_TITLE}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label
                  htmlFor="headway-fastest"
                  style={{ fontSize: '11px', color: '#64748b', display: 'block' }}
                >
                  {TEXT_PDO_FORM.HEADWAY.FASTEST_LABEL}
                </label>
                <input
                  id="headway-fastest"
                  type="number"
                  min={1}
                  value={headwayFastest}
                  onChange={(e) => setHeadwayFastest(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="headway-slowest"
                  style={{ fontSize: '11px', color: '#64748b', display: 'block' }}
                >
                  {TEXT_PDO_FORM.HEADWAY.SLOWEST_LABEL}
                </label>
                <input
                  id="headway-slowest"
                  type="number"
                  min={1}
                  value={headwaySlowest}
                  onChange={(e) => setHeadwaySlowest(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Titik Kemacetan Chips */}
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '8px'
              }}
            >
              {TEXT_PDO_FORM.TRAFFIC_JAMS.SECTION_TITLE}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
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
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? '#ef4444' : 'var(--bg-secondary, #f1f5f9)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary, #334155)',
                      border: isSelected ? '1px solid #dc2626' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {spot}
                  </button>
                );
              })}
            </div>

            {/* Input Tambah Titik Macet */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
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
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px'
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomSpot}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} /> {TEXT_PDO_FORM.TRAFFIC_JAMS.ADD_BTN}
              </button>
            </div>
          </div>

          {/* Section 4: Catatan Kendala */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="kendala-text"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748b)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: '6px'
              }}
            >
              {TEXT_PDO_FORM.ISSUES.SECTION_TITLE}
            </label>
            <textarea
              id="kendala-text"
              rows={2}
              placeholder={TEXT_PDO_FORM.ISSUES.PLACEHOLDER}
              value={operationalIssues}
              onChange={(e) => setOperationalIssues(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={16} />
            {saving ? TEXT_PDO_FORM.BUTTONS.SUBMITTING : TEXT_PDO_FORM.BUTTONS.SUBMIT}
          </button>
        </form>
      )}
    </div>
  );
}

export const RouteOperationalReportCard = memo(RouteOperationalReportCardComponent);
