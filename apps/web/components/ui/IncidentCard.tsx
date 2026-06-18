'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'in-progress' | 'resolved';

export interface IncidentCardProps {
  /** Unique incident ID */
  id: string;
  /** Incident title */
  title: string;
  /** Short description */
  description: string;
  /** Severity level */
  severity: IncidentSeverity;
  /** Current status */
  status: IncidentStatus;
  /** Zone where incident occurred */
  zone: string;
  /** ISO timestamp when the incident was reported */
  reportedAt: string;
  /** Handler for acknowledge action */
  onAcknowledge?: (id: string) => void;
  /** Handler for resolve action */
  onResolve?: (id: string) => void;
  /** Handler for escalate action */
  onEscalate?: (id: string) => void;
}

const severityConfig: Record<IncidentSeverity, {
  color: string;
  bg: string;
  label: string;
  borderColor: string;
}> = {
  critical: {
    color: '#B71C1C',
    bg: 'rgba(183, 28, 28, 0.08)',
    label: 'Critical',
    borderColor: '#B71C1C',
  },
  high: {
    color: '#E65100',
    bg: 'rgba(230, 81, 0, 0.08)',
    label: 'High',
    borderColor: '#E65100',
  },
  medium: {
    color: '#D4A017',
    bg: 'rgba(212, 160, 23, 0.08)',
    label: 'Medium',
    borderColor: '#D4A017',
  },
  low: {
    color: '#2E7D32',
    bg: 'rgba(46, 125, 50, 0.08)',
    label: 'Low',
    borderColor: '#2E7D32',
  },
};

const statusLabels: Record<IncidentStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export default function IncidentCard({
  id,
  title,
  description,
  severity,
  status,
  zone,
  reportedAt,
  onAcknowledge,
  onResolve,
  onEscalate,
}: IncidentCardProps) {
  const cfg = severityConfig[severity];
  const [elapsed, setElapsed] = useState<string>('');
  const isOpen = status === 'open' || status === 'in-progress';
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  const updateElapsed = useCallback(() => {
    const diff = Date.now() - new Date(reportedAt).getTime();
    setElapsed(formatElapsed(Math.max(0, diff)));
  }, [reportedAt]);

  useEffect(() => {
    if (!isOpen) return;
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [isOpen, updateElapsed]);

  return (
    <motion.div
      ref={ref}
      id={`incident-card-${id}`}
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderLeft: `4px solid ${cfg.borderColor}`,
      }}
    >
      {/* ── Header ── */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Severity badge */}
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {severity === 'critical' && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ●
                  </motion.span>
                )}
                {cfg.label}
              </span>

              {/* Status */}
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  color: status === 'resolved' ? '#2E7D32' : 'var(--text-muted)',
                  background: status === 'resolved' ? 'rgba(46,125,50,0.1)' : 'rgba(160,120,90,0.1)',
                }}
              >
                {statusLabels[status]}
              </span>
            </div>

            <h4
              className="text-base font-semibold leading-tight"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
            >
              {title}
            </h4>
            <p
              className="text-sm mt-1 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Meta Row ── */}
      <div
        className="flex items-center gap-4 px-5 py-2.5 text-xs"
        style={{
          color: 'var(--text-muted)',
          background: 'rgba(245, 166, 35, 0.03)',
          borderTop: '1px solid var(--border-card)',
          borderBottom: isOpen ? '1px solid var(--border-card)' : 'none',
        }}
      >
        {/* Zone */}
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="font-medium">{zone}</span>
        </div>

        {/* Elapsed timer for open incidents */}
        {isOpen && elapsed && (
          <div className="flex items-center gap-1 ml-auto">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-mono font-semibold tabular-nums" style={{ color: cfg.color }}>
              {elapsed}
            </span>
          </div>
        )}
      </div>

      {/* ── Action Buttons (only for non-resolved) ── */}
      {status !== 'resolved' && (
        <div className="flex items-center gap-2 p-4">
          {status === 'open' && onAcknowledge && (
            <button
              className="btn-sacred btn-sacred-primary flex-1 text-xs py-2 min-h-[36px] min-w-0 rounded-lg"
              onClick={() => onAcknowledge(id)}
            >
              Acknowledge
            </button>
          )}
          {onResolve && (
            <button
              className="btn-sacred btn-sacred-outline flex-1 text-xs py-2 min-h-[36px] min-w-0 rounded-lg"
              onClick={() => onResolve(id)}
            >
              Resolve
            </button>
          )}
          {severity === 'critical' && onEscalate && (
            <button
              className="btn-sacred btn-sacred-danger flex-1 text-xs py-2 min-h-[36px] min-w-0 rounded-lg"
              onClick={() => onEscalate(id)}
            >
              Escalate
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
