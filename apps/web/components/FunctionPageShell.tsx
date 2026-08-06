'use client';

import type { ReactNode } from 'react';
import GlowDock from '@/components/GlowDock';
import type { IconProps } from '@/components/icons';

interface FunctionPageShellProps {
  icon: (props: IconProps) => React.JSX.Element;
  title: string;
  description: string;
  /** Extra content rendered inline with the header (e.g. a live indicator, an action button). */
  headerExtra?: ReactNode;
  children: ReactNode;
}

/* ═══════════════════════════════════════════════════════════════
   FUNCTION PAGE SHELL — the sidebar+TopBanner replacement shared by
   every admin/coordinator page (dashboard, zones, incidents,
   volunteers, reports, register, shifts, map). Deliberately minimal:
   a faint warm tint anchored at the top (not a full glow wash), a
   plain saffron icon + serif heading for the page title — no gradient
   badge box, no drop-shadow glow. GlowDock (bottom-left) replaces the
   old fixed sidebar; SevaSahayak (bottom-right, global) is the only
   other persistent chrome.
   ═══════════════════════════════════════════════════════════════ */
export default function FunctionPageShell({
  icon: Icon,
  title,
  description,
  headerExtra,
  children,
}: FunctionPageShellProps) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(232,101,10,0.08) 0%, var(--bg-primary) 60%)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-10) var(--space-6) var(--space-24)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Icon size={26} style={{ color: 'var(--saffron)', flexShrink: 0 }} />
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  color: '#FFF8EE',
                  lineHeight: 1.15,
                }}
              >
                {title}
              </h1>
              <p style={{ color: 'rgba(255,248,238,0.6)', fontSize: 'var(--text-base)', marginTop: 'var(--space-1)' }}>
                {description}
              </p>
            </div>
          </div>
          {headerExtra}
        </div>

        {children}
      </div>

      <GlowDock />
    </div>
  );
}
