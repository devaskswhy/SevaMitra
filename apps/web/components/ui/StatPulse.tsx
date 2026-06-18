'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';

export interface StatPulseProps {
  /** Metric label */
  label: string;
  /** Optional label in Hindi */
  labelHi?: string;
  /** Target value to count up to */
  value: number;
  /** Optional prefix (e.g. "₹") */
  prefix?: string;
  /** Optional suffix (e.g. "%", "K") */
  suffix?: string;
  /** Accent color */
  accentColor?: string;
  /** Optional icon (emoji or SVG string) */
  icon?: string;
  /** Duration of count-up animation in ms */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
}

/**
 * Custom hook: counts from 0 to `end` over `duration` ms
 * using requestAnimationFrame for smooth 60fps animation.
 */
function useCountUp(
  end: number,
  duration: number = 1500,
  decimals: number = 0,
  shouldStart: boolean = true
): string {
  const [display, setDisplay] = useState('0');
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Ease-out cubic for a satisfying deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = easedProgress * end;

      setDisplay(
        current.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [end, duration, decimals]
  );

  useEffect(() => {
    if (!shouldStart) return;
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [shouldStart, animate]);

  return display;
}

export default function StatPulse({
  label,
  labelHi,
  value,
  prefix = '',
  suffix = '',
  accentColor = 'var(--saffron)',
  icon,
  duration = 1500,
  decimals = 0,
}: StatPulseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const displayValue = useCountUp(value, duration, decimals, isInView);

  return (
    <motion.div
      ref={ref}
      className="card p-5 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Subtle accent glow in corner ── */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
        style={{ background: accentColor }}
      />

      {/* ── Icon ── */}
      {icon && (
        <div className="text-2xl mb-2">{icon}</div>
      )}

      {/* ── Label ── */}
      <div className="mb-3">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        {labelHi && (
          <p
            className="text-xs opacity-40 mt-0.5"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {labelHi}
          </p>
        )}
      </div>

      {/* ── Number (counts up) ── */}
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span
            className="text-lg font-semibold"
            style={{ color: accentColor }}
          >
            {prefix}
          </span>
        )}
        <motion.span
          className="text-3xl font-bold tabular-nums tracking-tight"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {displayValue}
        </motion.span>
        {suffix && (
          <span
            className="text-base font-medium ml-0.5"
            style={{ color: accentColor }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* ── Bottom accent line ── */}
      <motion.div
        className="absolute bottom-0 left-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        initial={{ width: 0 }}
        animate={isInView ? { width: '60%' } : { width: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}
