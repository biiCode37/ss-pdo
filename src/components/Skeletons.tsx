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
