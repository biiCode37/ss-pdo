import { useState, useMemo, memo } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  generateWaReportFormat3,
  openWhatsApp,
  type RouteWaData,
  type RegionTotals,
  type RouteFleetReportItem
} from '../utils/waReportGenerator';
import type { RegionalMonitoringResult } from '../services/allRouteMonitoringService';
import { showSuccessToast } from '../utils/alertUtils';
import { TEXT_WA_REPORT } from '../constants/texts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  regionalData: RegionalMonitoringResult;
  selectedDate: string;
}

function WaReportModalComponent({
  isOpen,
  onClose,
  regionalData,
  selectedDate
}: Props) {
  const [formatType, setFormatType] = useState<'format1' | 'format2' | 'format3'>('format1');
  const defaultShift: 1 | 2 = new Date().getHours() >= 14 ? 2 : 1;
  const [selectedShift, setSelectedShift] = useState<1 | 2>(defaultShift);
  const [supervisorFilter, setSupervisorFilter] = useState<'ALL' | 'RANTO' | 'ABDUL' | 'MOAMAR'>('ALL');
  const [copied, setCopied] = useState(false);

  // Filter routes based on selected supervisor
  const filteredRoutes = useMemo(() => {
    if (!regionalData?.routes) return [];
    if (supervisorFilter === 'ALL') return regionalData.routes;
    return regionalData.routes.filter((r) => {
      const name = r.supervisorName.toUpperCase();
      if (supervisorFilter === 'RANTO') return name.includes('RANTO');
      if (supervisorFilter === 'ABDUL') return name.includes('ABDUL');
      if (supervisorFilter === 'MOAMAR') return name.includes('MOAMAR');
      return true;
    });
  }, [regionalData, supervisorFilter]);

  // Check unconfirmed routes for Format 3 blocking (18 routes regional check)
  const unconfirmedRoutes = useMemo(() => {
    if (formatType !== 'format3') return [];
    const allRoutes = regionalData?.routes || [];
    return allRoutes.filter((r) =>
      selectedShift === 1 ? !r.isFleetConfirmedS1 : !r.isFleetConfirmedS2
    );
  }, [formatType, regionalData?.routes, selectedShift]);

  const isFormat3Blocked = formatType === 'format3' && unconfirmedRoutes.length > 0;

  // Convert to RouteWaData
  const waRouteItems: RouteWaData[] = useMemo(() => {
    return filteredRoutes.map((r, idx) => ({
      no: idx + 1,
      routeCode: r.routeCode.replace('.', ' '), // e.g. "JAK.01" -> "JAK 01"
      routeName: r.routeName,
      operatorName: r.operatorName,
      isLooping: r.isLooping,
      todayPassengers: r.todayPassengers,
      yesterdayPassengers: r.yesterdayPassengers,
      lastWeekPassengers: r.lastWeekPassengers,
      targetHk: r.targetHk,
      bestRecord: r.bestRecord,
      achievementKm: r.achievementKm,
      kmBaku: r.kmBaku,
      renops: r.totalRenops,
      realops: r.totalRealops,
      trafficJamSpots: r.trafficJamSpots,
      operationalIssues: r.operationalIssues,
      headwayFastest: r.headwayFastest,
      headwaySlowest: r.headwaySlowest,
      toaShift1: r.toaShift1,
      manualShift1: r.manualShift1,
      totalShift1: r.totalShift1,
      toaShift2: r.toaShift2,
      manualShift2: r.manualShift2,
      totalShift2: r.totalShift2
    }));
  }, [filteredRoutes]);

  // Calculate totals for Format 2
  const regionTotals: RegionTotals = useMemo(() => {
    if (supervisorFilter === 'ALL') {
      return {
        tomShift1: regionalData.tomShift1,
        manualShift1: regionalData.manualShift1,
        totalShift1: regionalData.totalShift1,
        yesterdayShift1: regionalData.yesterdayShift1,
        lastWeekShift1: regionalData.lastWeekShift1,
        tomShift2: regionalData.tomShift2,
        manualShift2: regionalData.manualShift2,
        totalShift2: regionalData.totalShift2,
        yesterdayShift2: regionalData.yesterdayShift2,
        lastWeekShift2: regionalData.lastWeekShift2,
        totalToday: regionalData.totalTodayPassengers,
        totalTarget: regionalData.totalTargetPassengers,
        totalYesterday: regionalData.totalYesterdayPassengers,
        totalLastWeek: regionalData.totalLastWeekPassengers
      };
    }
    // Subtotal for filtered supervisor
    const tomShift1 = waRouteItems.reduce((acc, r) => acc + r.toaShift1, 0);
    const manualShift1 = waRouteItems.reduce((acc, r) => acc + r.manualShift1, 0);
    const totalShift1 = tomShift1 + manualShift1;
    const tomShift2 = waRouteItems.reduce((acc, r) => acc + r.toaShift2, 0);
    const manualShift2 = waRouteItems.reduce((acc, r) => acc + r.manualShift2, 0);
    const totalShift2 = tomShift2 + manualShift2;
    const totalToday = waRouteItems.reduce((acc, r) => acc + r.todayPassengers, 0);
    const totalTarget = waRouteItems.reduce((acc, r) => acc + r.targetHk, 0);
    const totalYesterday = waRouteItems.reduce((acc, r) => acc + r.yesterdayPassengers, 0);
    const totalLastWeek = waRouteItems.reduce((acc, r) => acc + r.lastWeekPassengers, 0);

    return {
      tomShift1,
      manualShift1,
      totalShift1,
      yesterdayShift1: 0,
      lastWeekShift1: 0,
      tomShift2,
      manualShift2,
      totalShift2,
      yesterdayShift2: 0,
      lastWeekShift2: 0,
      totalToday,
      totalTarget,
      totalYesterday,
      totalLastWeek
    };
  }, [regionalData, supervisorFilter, waRouteItems]);

  // Generate WhatsApp Message Text
  const messageText = useMemo(() => {
    if (!selectedDate || filteredRoutes.length === 0) return '';
    if (formatType === 'format1') {
      return generateWaReportFormat1(selectedDate, waRouteItems);
    }
    if (formatType === 'format2') {
      return generateWaReportFormat2(selectedDate, waRouteItems, regionTotals);
    }
    if (formatType === 'format3') {
      const fleetItems: RouteFleetReportItem[] = filteredRoutes.map((r, idx) => ({
        no: idx + 1,
        routeCode: r.routeCode,
        routeName: r.routeName,
        operatorName: r.operatorName,
        renops: selectedShift === 1 ? r.renopsShift1 : r.renopsShift2,
        realops: selectedShift === 1 ? r.realopsShift1 : r.realopsShift2,
        nonSgoUnits: selectedShift === 1 ? r.fleetStatusShift1 : r.fleetStatusShift2,
      }));
      return generateWaReportFormat3(selectedDate, selectedShift, fleetItems);
    }
    return '';
  }, [formatType, selectedDate, filteredRoutes, waRouteItems, regionTotals, selectedShift]);

  // Missing reports count
  const unsubmittedCount = useMemo(() => {
    return filteredRoutes.filter((r) => r.status !== 'submitted' && r.status !== 'verified').length;
  }, [filteredRoutes]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (isFormat3Blocked) return;
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      showSuccessToast(TEXT_WA_REPORT.COPIED_TOAST);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Gagal salin teks:', err);
    }
  };

  const handleOpenWa = () => {
    if (isFormat3Blocked) return;
    openWhatsApp(messageText);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: 'min(92dvh, 780px)',
          background: 'var(--surface-color, #171717)',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
          borderBottom: 'none',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '18px 16px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.35)',
          animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(37, 211, 102, 0.12)',
                color: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: 700, color: 'var(--text-primary, #ededed)' }}>
                {TEXT_WA_REPORT.MODAL_TITLE}
              </h2>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary, #8b8b8b)' }}>
                {TEXT_WA_REPORT.MODAL_SUBTITLE}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #64748b)',
              padding: '6px'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Warning Banner if unsubmitted routes (Only for Format 1 & 2) */}
        {unsubmittedCount > 0 && formatType !== 'format3' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#d97706'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>
              {TEXT_WA_REPORT.WARNING_UNSUBMITTED(unsubmittedCount, filteredRoutes.length)}
            </span>
          </div>
        )}

        {/* Tab Format Selector - 3 Equal Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '10px'
          }}
        >
          <button
            type="button"
            onClick={() => setFormatType('format1')}
            style={{
              padding: '6px 4px',
              borderRadius: '8px',
              border: formatType === 'format1' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              background: formatType === 'format1' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: formatType === 'format1' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              boxShadow: formatType === 'format1' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700 }}>
              <FileText size={12} />
              <span>Format 1</span>
            </div>
            <span style={{ fontSize: '9.5px', opacity: 0.8, fontWeight: 500 }}>Pelanggan</span>
          </button>

          <button
            type="button"
            onClick={() => setFormatType('format2')}
            style={{
              padding: '6px 4px',
              borderRadius: '8px',
              border: formatType === 'format2' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              background: formatType === 'format2' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: formatType === 'format2' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              boxShadow: formatType === 'format2' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700 }}>
              <FileText size={12} />
              <span>Format 2</span>
            </div>
            <span style={{ fontSize: '9.5px', opacity: 0.8, fontWeight: 500 }}>Rincian Shift</span>
          </button>

          <button
            type="button"
            onClick={() => setFormatType('format3')}
            style={{
              padding: '6px 4px',
              borderRadius: '8px',
              border: formatType === 'format3' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              background: formatType === 'format3' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: formatType === 'format3' ? '#38bdf8' : 'var(--text-secondary, #94a3b8)',
              boxShadow: formatType === 'format3' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700 }}>
              <FileText size={12} />
              <span>Format 3</span>
            </div>
            <span style={{ fontSize: '9.5px', opacity: 0.8, fontWeight: 500 }}>Status Armada</span>
          </button>
        </div>

        {/* Sub-selector Shift for Format 3 - Adaptive Semantic Shift Colors */}
        {formatType === 'format3' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'var(--input-bg, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedShift(1)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: selectedShift === 1 ? '1px solid var(--shift1-color, #38bdf8)' : '1px solid transparent',
                background: selectedShift === 1 ? 'var(--shift1-bg, rgba(56, 189, 248, 0.18))' : 'transparent',
                color: selectedShift === 1 ? 'var(--shift1-color, #38bdf8)' : 'var(--text-secondary, #94a3b8)',
                fontSize: '12px',
                fontWeight: selectedShift === 1 ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>☀️</span>
              <span>Shift 1 (Pagi)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedShift(2)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: selectedShift === 2 ? '1px solid var(--shift2-color, #c084fc)' : '1px solid transparent',
                background: selectedShift === 2 ? 'var(--shift2-bg, rgba(192, 132, 252, 0.18))' : 'transparent',
                color: selectedShift === 2 ? 'var(--shift2-color, #c084fc)' : 'var(--text-secondary, #94a3b8)',
                fontSize: '12px',
                fontWeight: selectedShift === 2 ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🌙</span>
              <span>Shift 2 (Siang)</span>
            </button>
          </div>
        )}

        {/* Filter Lingkup Korlap - Only for Format 1 & 2 */}
        {formatType !== 'format3' && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }} className="no-scrollbar">
            {[
              { id: 'ALL', label: TEXT_WA_REPORT.SUPERVISOR_TABS.ALL(18) },
              { id: 'RANTO', label: TEXT_WA_REPORT.SUPERVISOR_TABS.RANTO(6) },
              { id: 'ABDUL', label: TEXT_WA_REPORT.SUPERVISOR_TABS.ABDUL(6) },
              { id: 'MOAMAR', label: TEXT_WA_REPORT.SUPERVISOR_TABS.MOAMAR(6) }
            ].map((item) => {
              const active = supervisorFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSupervisorFilter(item.id as any)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '16px',
                    border: active ? '1px solid #2563eb' : '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                    background: active ? '#2563eb' : 'var(--input-bg, rgba(255, 255, 255, 0.05))',
                    color: active ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
                    fontSize: '11px',
                    fontWeight: active ? 600 : 500,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Format 3 Blocking Alert - Compact, High Aesthetic */}
        {isFormat3Blocked && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '12px' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{TEXT_WA_REPORT.BLOCKING_TITLE(selectedShift)}</span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.35 }}>
              {TEXT_WA_REPORT.BLOCKING_DESC(unconfirmedRoutes.length)}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '2px',
                marginTop: '4px'
              }}
              className="no-scrollbar"
            >
              {unconfirmedRoutes.map((r) => (
                <span
                  key={r.id}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                  }}
                >
                  {r.routeCode}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Monospace Message Preview Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--bg-color, #0b0f19)',
            color: 'var(--text-primary, #e2e8f0)',
            padding: '12px 14px',
            borderRadius: '14px',
            fontFamily: 'monospace',
            fontSize: '11.5px',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            marginBottom: '14px',
            minHeight: '120px',
            maxHeight: 'min(36dvh, 260px)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))'
          }}
        >
          {messageText || TEXT_WA_REPORT.LOADING_PREVIEW}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            disabled={isFormat3Blocked}
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: copied ? 'var(--accent-color, #10b981)' : 'var(--input-bg, rgba(255, 255, 255, 0.06))',
              color: copied ? '#ffffff' : 'var(--text-primary, #ededed)',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isFormat3Blocked ? 'not-allowed' : 'pointer',
              opacity: isFormat3Blocked ? 0.4 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? TEXT_WA_REPORT.COPIED_BTN : TEXT_WA_REPORT.COPY_BTN}
          </button>

          <button
            type="button"
            disabled={isFormat3Blocked}
            onClick={handleOpenWa}
            style={{
              flex: 1.2,
              padding: '12px',
              borderRadius: '12px',
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isFormat3Blocked ? 'none' : '0 2px 10px rgba(37, 211, 102, 0.35)',
              cursor: isFormat3Blocked ? 'not-allowed' : 'pointer',
              opacity: isFormat3Blocked ? 0.4 : 1,
            }}
          >
            <Share2 size={16} />
            {TEXT_WA_REPORT.OPEN_WA_BTN}
          </button>
        </div>
      </div>
    </div>
  );
}

export const WaReportModal = memo(WaReportModalComponent);
