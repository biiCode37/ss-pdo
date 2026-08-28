import React from 'react';

interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export function SkeletonBox({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  style,
  className = '',
}: SkeletonBoxProps) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function BusCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="bus-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bus-card glass"
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Header Row: Unit Name Pill & Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width="110px" height="22px" borderRadius="10px" />
            <SkeletonBox width="80px" height="18px" borderRadius="12px" />
          </div>

          {/* Body Row: TOA Summary & KM Metrics */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width="150px" height="14px" borderRadius="6px" />
            <SkeletonBox width="90px" height="14px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DailyToaTrendSkeleton() {
  return (
    <div className="analytics-card glass" style={{ padding: '16px', borderRadius: '16px' }}>
      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <SkeletonBox width="160px" height="20px" borderRadius="8px" />
        <SkeletonBox width="80px" height="16px" borderRadius="12px" />
      </div>

      {/* 3-Column Executive Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <SkeletonBox height="52px" borderRadius="10px" />
        <SkeletonBox height="52px" borderRadius="10px" />
        <SkeletonBox height="52px" borderRadius="10px" />
      </div>

      {/* Bar Chart Pillars Skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '110px',
          gap: '3px',
          paddingTop: '10px',
        }}
      >
        {Array.from({ length: 24 }).map((_, idx) => {
          const randomHeight = Math.floor(20 + Math.sin(idx) * 35 + Math.cos(idx * 2) * 25);
          return (
            <SkeletonBox
              key={idx}
              width="100%"
              height={`${Math.max(15, Math.min(90, randomHeight))}%`}
              borderRadius="4px"
            />
          );
        })}
      </div>
    </div>
  );
}

export function UnitCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="card glass"
          style={{
            padding: '16px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width="100px" height="20px" borderRadius="8px" />
            <SkeletonBox width="60px" height="18px" borderRadius="12px" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <SkeletonBox width="120px" height="14px" borderRadius="6px" />
            <SkeletonBox width="70px" height="14px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditLogSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky Header Skeleton */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--card-bg, rgba(15, 23, 42, 0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SkeletonBox width="88px" height="36px" borderRadius="12px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBox width="170px" height="18px" borderRadius="6px" />
              <SkeletonBox width="110px" height="12px" borderRadius="4px" />
            </div>
          </div>
          <SkeletonBox width="90px" height="34px" borderRadius="10px" />
        </div>
      </header>

      {/* Body Container Skeleton */}
      <main
        style={{
          flex: 1,
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Search Bar & Tabs Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBox width="100%" height="42px" borderRadius="12px" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBox width="120px" height="32px" borderRadius="10px" />
            <SkeletonBox width="140px" height="32px" borderRadius="10px" />
            <SkeletonBox width="130px" height="32px" borderRadius="10px" />
            <SkeletonBox width="80px" height="32px" borderRadius="10px" />
          </div>
        </div>

        {/* Timeline Log Cards Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={idx}
              className="glass"
              style={{
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
              }}
            >
              <SkeletonBox width="40px" height="40px" borderRadius="12px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SkeletonBox width="180px" height="16px" borderRadius="6px" />
                  <SkeletonBox width="90px" height="12px" borderRadius="4px" />
                </div>
                <SkeletonBox width="90%" height="13px" borderRadius="4px" />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <SkeletonBox width="130px" height="12px" borderRadius="4px" />
                  <SkeletonBox width="60px" height="16px" borderRadius="6px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function UserManagementSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--card-bg, rgba(15, 23, 42, 0.92))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SkeletonBox width="88px" height="36px" borderRadius="12px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SkeletonBox width="160px" height="18px" borderRadius="6px" />
              <SkeletonBox width="100px" height="12px" borderRadius="4px" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBox width="36px" height="36px" borderRadius="10px" />
            <SkeletonBox width="110px" height="36px" borderRadius="10px" />
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SkeletonBox width="100%" height="42px" borderRadius="12px" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBox width="80px" height="32px" borderRadius="10px" />
            <SkeletonBox width="100px" height="32px" borderRadius="10px" />
            <SkeletonBox width="80px" height="32px" borderRadius="10px" />
            <SkeletonBox width="80px" height="32px" borderRadius="10px" />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px',
          }}
        >
          {Array.from({ length: count }).map((_, idx) => (
            <div
              key={idx}
              className="glass"
              style={{
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--card-border, rgba(255,255,255,0.08))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <SkeletonBox width="44px" height="44px" borderRadius="12px" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonBox width="120px" height="15px" borderRadius="6px" />
                  <SkeletonBox width="160px" height="12px" borderRadius="4px" />
                  <SkeletonBox width="70px" height="18px" borderRadius="6px" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                <SkeletonBox width="100px" height="12px" borderRadius="4px" />
                <SkeletonBox width="60px" height="12px" borderRadius="4px" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--card-border, rgba(255,255,255,0.05))' }}>
                <SkeletonBox width="70px" height="26px" borderRadius="8px" />
                <SkeletonBox width="90px" height="26px" borderRadius="8px" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

