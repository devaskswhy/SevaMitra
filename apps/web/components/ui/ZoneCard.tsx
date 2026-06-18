'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export interface ZoneCardProps {
  /** Unique zone identifier */
  id: string;
  /** Zone display name */
  name: string;
  /** Optional zone name in Hindi */
  nameHi?: string;
  /** Current crowd count */
  currentCount: number;
  /** Maximum capacity */
  capacity: number;
  /** Number of active volunteers in this zone */
  volunteerCount?: number;
  /** Number of open incidents */
  incidentCount?: number;
  /** Optional click handler */
  onClick?: () => void;
}

type ZoneStatus = 'green' | 'amber' | 'red';

function getZoneStatus(currentCount: number, capacity: number): ZoneStatus {
  const pct = capacity > 0 ? (currentCount / capacity) * 100 : 0;
  if (pct < 60) return 'green';
  if (pct < 85) return 'amber';
  return 'red';
}

const statusConfig: Record<ZoneStatus, { color: string; bg: string; label: string; glow: string }> = {
  green: {
    color: '#2E7D32',
    bg: 'rgba(46, 125, 50, 0.12)',
    label: 'Normal',
    glow: 'rgba(46, 125, 50, 0.3)',
  },
  amber: {
    color: '#E65100',
    bg: 'rgba(230, 81, 0, 0.12)',
    label: 'Filling Up',
    glow: 'rgba(230, 81, 0, 0.3)',
  },
  red: {
    color: '#B71C1C',
    bg: 'rgba(183, 28, 28, 0.12)',
    label: 'Critical',
    glow: 'rgba(183, 28, 28, 0.3)',
  },
};

export default function ZoneCard({
  id,
  name,
  nameHi,
  currentCount,
  capacity,
  volunteerCount = 0,
  incidentCount = 0,
  onClick,
}: ZoneCardProps) {
  const pct = capacity > 0 ? Math.min((currentCount / capacity) * 100, 100) : 0;
  const status = getZoneStatus(currentCount, capacity);
  const cfg = statusConfig[status];
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      id={`zone-card-${id}`}
      className="card cursor-pointer group"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01 }}
      style={{ overflow: 'hidden' }}
    >
      {/* ── Header Row ── */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
          >
            {name}
          </h3>
          {nameHi && (
            <span
              className="text-xs opacity-50"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {nameHi}
            </span>
          )}
        </div>

        {/* Status Chip */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            color: cfg.color,
            background: cfg.bg,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: cfg.color,
              boxShadow: `0 0 6px ${cfg.glow}`,
              animation: status === 'red' ? 'sacred-pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {cfg.label}
        </span>
      </div>

      {/* ── Capacity Bar ── */}
      <div className="px-5 pb-3">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Capacity
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: cfg.color }}>
            {currentCount.toLocaleString()} / {capacity.toLocaleString()}
          </span>
        </div>

        {/* Track */}
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: 'var(--cream-dark)' }}
        >
          {/* Animated Fill */}
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}dd)`,
              boxShadow: `0 0 8px ${cfg.glow}`,
            }}
            initial={{ width: 0 }}
            animate={isInView ? { width: `${pct}%` } : { width: 0 }}
            transition={{
              duration: 1,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs font-semibold tabular-nums" style={{ color: cfg.color }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* ── Footer Stats ── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          borderTop: '1px solid var(--border-card)',
          background: 'rgba(245, 166, 35, 0.03)',
        }}
      >
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="font-medium">{volunteerCount}</span>
          <span className="text-xs">volunteers</span>
        </div>
        {incidentCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--status-red)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="font-semibold">{incidentCount}</span>
            <span className="text-xs">incidents</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
