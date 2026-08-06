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
   volunteers, reports, register, shifts, map). Same glow-hero
   language as the hub/landing floating showcase (om watermark, warm
   radial glow, serif heading) anchored to the TOP of the page only —
   unlike hub's full-bleed gradient, it fades out to the flat
   `--bg-primary` by ~70% down so dense table/card content underneath
   stays readable. GlowDock (bottom-left) replaces the old fixed
   sidebar entirely; SevaSahayak (bottom-right, global) is the only
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
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232,101,10,0.22) 0%, rgba(61,26,0,0.12) 35%, var(--bg-primary) 70%)',
      }}
    >
      <div className="om-watermark" aria-hidden="true">ॐ</div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--space-10) var(--space-6) var(--space-24)',
        }}
      >
        {/* ── Hero header ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'linear-gradient(135deg, var(--saffron), var(--gold))',
                color: '#0D0500',
                boxShadow: '0 0 24px rgba(232,101,10,0.35)',
              }}
            >
              <Icon size={28} />
            </div>
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
