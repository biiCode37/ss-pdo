import { useState, useMemo, memo } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  openWhatsApp,
  type RouteWaData,
  type RegionTotals
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
  const [formatType, setFormatType] = useState<'format1' | 'format2'>('format1');
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
    if (!selectedDate || waRouteItems.length === 0) return '';
    if (formatType === 'format1') {
      return generateWaReportFormat1(selectedDate, waRouteItems);
    }
    return generateWaReportFormat2(selectedDate, waRouteItems, regionTotals);
  }, [formatType, selectedDate, waRouteItems, regionTotals]);

  // Missing reports count
  const unsubmittedCount = useMemo(() => {
    return filteredRoutes.filter((r) => r.status !== 'submitted' && r.status !== 'verified').length;
  }, [filteredRoutes]);

  if (!isOpen) return null;

  const handleCopy = async () => {
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
          maxHeight: 'min(90dvh, 760px)',
          background: 'var(--card-bg, #ffffff)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '20px 16px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
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
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                {TEXT_WA_REPORT.MODAL_TITLE}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
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

        {/* Warning Banner if unsubmitted routes */}
        {unsubmittedCount > 0 && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '14px',
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

        {/* Tab Format Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary, #f1f5f9)',
            borderRadius: '12px',
            padding: '3px',
            marginBottom: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => setFormatType('format1')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              background: formatType === 'format1' ? 'var(--card-bg, #ffffff)' : 'transparent',
              color: formatType === 'format1' ? '#2563eb' : 'var(--text-secondary, #64748b)',
              boxShadow: formatType === 'format1' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* ponytail: clean segmented button label without redundant FileText icon */}
            {TEXT_WA_REPORT.FORMAT_1_BTN}
          </button>
          <button
            type="button"
            onClick={() => setFormatType('format2')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              background: formatType === 'format2' ? 'var(--card-bg, #ffffff)' : 'transparent',
              color: formatType === 'format2' ? '#2563eb' : 'var(--text-secondary, #64748b)',
              boxShadow: formatType === 'format2' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* ponytail: clean segmented button label without redundant FileText icon */}
            {TEXT_WA_REPORT.FORMAT_2_BTN}
          </button>
        </div>

        {/* Filter Lingkup Korlap */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
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
                  border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: active ? '#2563eb' : 'var(--bg-secondary, #f8fafc)',
                  color: active ? '#ffffff' : 'var(--text-primary, #475569)',
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

        {/* Monospace Message Preview Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '14px',
            borderRadius: '14px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            marginBottom: '16px',
            maxHeight: '340px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {messageText || TEXT_WA_REPORT.LOADING_PREVIEW}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              background: copied ? '#16a34a' : 'var(--bg-secondary, #f1f5f9)',
              color: copied ? '#ffffff' : 'var(--text-primary, #1e293b)',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? TEXT_WA_REPORT.COPIED_BTN : TEXT_WA_REPORT.COPY_BTN}
          </button>

          <button
            type="button"
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
              boxShadow: '0 2px 10px rgba(37, 211, 102, 0.35)',
              cursor: 'pointer'
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
