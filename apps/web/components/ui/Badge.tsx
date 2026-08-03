import { HTMLAttributes } from 'react';

export type BadgeTone = 'saffron' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral';
export type BadgeVariant = 'solid' | 'soft';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color family. Defaults to 'neutral'. */
  tone?: BadgeTone;
  /** 'solid' = filled background + inverse text (matches the old
   *  priority/severity pills). 'soft' = tinted background + colored
   *  text (matches the old status pills). Defaults to 'soft'. */
  variant?: BadgeVariant;
}

// solidText/softText are chosen per tone to clear 4.5:1 against their
// respective background (measured against this app's actual dark page
// background, not assumed) — plain white-on-tone or same-hue-on-tint
// text, which is what these used before, fails WCAG AA for several
// tones (e.g. white on solid gold measures ~2.4:1). Confirmed via an
// automated axe-core contrast scan across every page using Badge.
const toneColors: Record<
  BadgeTone,
  { solidBg: string; solidText: string; softBg: string; softText: string }
> = {
  saffron: { solidBg: 'var(--saffron)', solidText: '#0D0500', softBg: 'var(--saffron-tint)', softText: 'var(--saffron)' },
  gold: { solidBg: 'var(--gold)', solidText: '#0D0500', softBg: 'var(--gold-tint)', softText: 'var(--gold)' },
  success: { solidBg: 'var(--status-green)', solidText: '#0D0500', softBg: 'var(--success-tint)', softText: 'var(--status-green)' },
  warning: { solidBg: 'var(--status-amber)', solidText: '#0D0500', softBg: 'var(--warning-tint)', softText: '#FFA040' },
  danger: { solidBg: 'var(--status-red)', solidText: 'var(--text-inverse)', softBg: 'var(--danger-tint)', softText: '#FF5252' },
  neutral: { solidBg: 'rgba(255, 248, 238, 0.15)', solidText: 'var(--text-inverse)', softBg: 'rgba(255, 248, 238, 0.08)', softText: 'var(--text-secondary)' },
};

/**
 * Shared status-pill primitive. Consolidates the ~5 near-identical
 * hand-rolled badge implementations (priority pills, severity pills,
 * status pills, leaderboard rank pills) that existed across
 * page.tsx/dashboard/zones/incidents/reports into one component.
 */
export default function Badge({
  tone = 'neutral',
  variant = 'soft',
  className = '',
  style,
  children,
  ...rest
}: BadgeProps) {
  const colors = toneColors[tone];
  const isSolid = variant === 'solid';
  return (
    <span
      className={`inline-flex items-center ${className}`.trim()}
      style={{
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: '999px',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        background: isSolid ? colors.solidBg : colors.softBg,
        color: isSolid ? colors.solidText : colors.softText,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

/** Returns the solid `var(--x)` color for a tone — useful for things
 *  like a card's border-left accent that should match its badge. */
export function toneToColorVar(tone: BadgeTone): string {
  return toneColors[tone].solidBg;
}

/** Maps a 1-5 incident severity number to a Badge tone + label — the
 *  4-tier scheme page.tsx's getSeverityConfig already used, now the
 *  single shared source (incidents/page.tsx previously had its own
 *  3-tier variant that never distinguished LOW severity). */
export function severityToBadge(severity: number): { tone: BadgeTone; label: string } {
  if (severity >= 4) return { tone: 'danger', label: 'CRITICAL' };
  if (severity >= 3) return { tone: 'warning', label: 'HIGH' };
  if (severity >= 2) return { tone: 'gold', label: 'MEDIUM' };
  return { tone: 'success', label: 'LOW' };
}

/** Maps a zone HIGH/MEDIUM/LOW priority string to a Badge tone. */
export function priorityToBadge(priority: string): { tone: BadgeTone } {
  switch (priority) {
    case 'HIGH':
      return { tone: 'danger' };
    case 'MEDIUM':
      return { tone: 'warning' };
    default:
      return { tone: 'success' };
  }
}

/** Maps an ACTIVE/INACTIVE-style volunteer status to a Badge tone. */
export function statusToBadge(status: string): { tone: BadgeTone } {
  return status === 'ACTIVE' ? { tone: 'success' } : { tone: 'danger' };
}
