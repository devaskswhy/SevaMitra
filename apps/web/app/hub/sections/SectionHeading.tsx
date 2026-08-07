'use client';

import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  description: string;
  extra?: ReactNode;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING — the compact per-section header used throughout
   the single-scroll /hub page (components/FunctionPageShell's old
   per-page hero header, shrunk down to h2 scale since /hub now stacks
   seven of these on one page instead of one per route). Text-only —
   no leading icon, kept deliberately plain rather than decorative.
   ═══════════════════════════════════════════════════════════════ */
export default function SectionHeading({ title, description, extra }: SectionHeadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            color: '#FFF8EE',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        <p style={{ color: 'rgba(255,248,238,0.6)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
          {description}
        </p>
      </div>
      {extra}
    </div>
  );
}
