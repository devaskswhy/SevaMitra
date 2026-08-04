'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Card from '@/components/ui/Card';

/* ═══════════════════════════════════════════════════════════════
   MINIATURE CONTENT PREVIEWS — abstracted, not real data.
   Each one is a tiny visual echo of its destination page's actual
   content shape, per the portfolio-niti-kanoongo reference: floating
   tiles are content previews, not flat icon+label cards.
   ═══════════════════════════════════════════════════════════════ */

function DashboardPreview() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
      {['#E8650A', '#D4A017', '#1DB954', '#B71C1C'].map((c, i) => (
        <div key={i} style={{ height: '18px', borderRadius: '4px', background: `${c}33`, border: `1px solid ${c}66` }} />
      ))}
    </div>
  );
}

function MapPreview() {
  const dots = [
    { top: '20%', left: '30%', c: '#1DB954' },
    { top: '55%', left: '60%', c: '#D4A017' },
    { top: '35%', left: '75%', c: '#E8650A' },
    { top: '70%', left: '25%', c: '#1DB954' },
  ];
  return (
    <div style={{ position: 'relative', height: '44px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,101,10,0.15)' }}>
      {dots.map((d, i) => (
        <span key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: '6px', height: '6px', borderRadius: '50%', background: d.c }} />
      ))}
    </div>
  );
}

function IncidentsPreview() {
  const rows = [{ c: '#B71C1C', w: '80%' }, { c: '#E65100', w: '60%' }, { c: '#D4A017', w: '70%' }];
  return (
    <div style={{ display: 'grid', gap: '4px' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ height: '8px', width: r.w, borderRadius: '2px', background: 'rgba(255,255,255,0.06)', borderLeft: `2px solid ${r.c}` }} />
      ))}
    </div>
  );
}

function VolunteersPreview() {
  return (
    <div style={{ display: 'grid', gap: '5px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--saffron), var(--gold))', flexShrink: 0 }} />
          <span style={{ flex: 1, height: '5px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }} />
        </div>
      ))}
    </div>
  );
}

function ReportsPreview() {
  const bars = [14, 26, 18, 32, 22];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '36px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: '8px', height: `${h}px`, borderRadius: '2px', background: 'linear-gradient(180deg, var(--gold), var(--saffron))' }} />
      ))}
    </div>
  );
}

function RegisterPreview() {
  return (
    <div style={{ display: 'grid', gap: '5px' }}>
      <span style={{ height: '7px', width: '90%', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ height: '7px', width: '70%', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ height: '10px', width: '45%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--saffron), var(--gold))', marginTop: '2px' }} />
    </div>
  );
}

function ShiftsPreview() {
  const blocks = [{ c: '#1DB954', w: '30%' }, { c: '#D4A017', w: '45%' }, { c: '#E8650A', w: '25%' }];
  return (
    <div style={{ display: 'flex', gap: '3px', height: '20px' }}>
      {blocks.map((b, i) => (
        <div key={i} style={{ width: b.w, borderRadius: '3px', background: `${b.c}33`, border: `1px solid ${b.c}66` }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TILE DATA — each tile has a scattered "hero" resting position
   (organic scatter around the centered content) and a settled
   position further down. Both expressed in vh/vw so they're plain
   document-flow coordinates GSAP can scrub between on scroll.
   Shared between /hub and the landing page.
   ═══════════════════════════════════════════════════════════════ */

interface Pos {
  top: number;
  left: number;
}

interface Tile {
  href: string;
  label: string;
  rotation: number;
  scatterPos: Pos;
  settledPos: Pos;
  delay: number;
  Preview: () => React.JSX.Element;
}

export const TILES: Tile[] = [
  { href: '/dashboard', label: 'Dashboard', rotation: -5, scatterPos: { top: 8, left: 4 }, settledPos: { top: 128, left: 8 }, delay: 0, Preview: DashboardPreview },
  { href: '/map', label: 'Zone Map', rotation: 4, scatterPos: { top: 11, left: 78 }, settledPos: { top: 128, left: 30 }, delay: 0.6, Preview: MapPreview },
  { href: '/incidents', label: 'Incidents', rotation: 6, scatterPos: { top: 46, left: 2 }, settledPos: { top: 128, left: 52 }, delay: 1.2, Preview: IncidentsPreview },
  { href: '/volunteers', label: 'Volunteers', rotation: -4, scatterPos: { top: 50, left: 80 }, settledPos: { top: 128, left: 74 }, delay: 1.8, Preview: VolunteersPreview },
  { href: '/reports', label: 'Reports', rotation: 3, scatterPos: { top: 80, left: 10 }, settledPos: { top: 152, left: 19 }, delay: 2.4, Preview: ReportsPreview },
  { href: '/register', label: 'Register', rotation: -6, scatterPos: { top: 78, left: 75 }, settledPos: { top: 152, left: 41 }, delay: 3, Preview: RegisterPreview },
  { href: '/shifts', label: 'Shifts', rotation: -3, scatterPos: { top: 84, left: 42 }, settledPos: { top: 152, left: 63 }, delay: 3.6, Preview: ShiftsPreview },
];

/* ═══════════════════════════════════════════════════════════════
   FLOATING TILE FIELD — scattered preview tiles around a centered
   hero slot that converge into a settled, aligned row as the field
   is scrolled through (the floating-card behavior referenced from
   portfolio-niti-kanoongo.vercel.app). Self-contained: owns its own
   mobile breakpoint, mount-entrance stagger, and scroll-linked
   convergence tween. Used by both /hub and the landing page, so the
   click behavior (navigate vs. sign-in) is left to the caller.
   ═══════════════════════════════════════════════════════════════ */

interface FloatingTileFieldProps {
  heroContent: ReactNode;
  onTileClick: (href: string) => void;
  settledLabel?: string;
  background?: string;
}

export default function FloatingTileField({
  heroContent,
  onTileClick,
  settledLabel = 'Everything you need, in one place',
  background = 'radial-gradient(ellipse 120% 70% at 50% 60%, #E8650A 0%, #3D1A00 45%, #0D0500 80%)',
}: FloatingTileFieldProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Tiles float/settle into their scattered resting position+rotation on
  // first mount, staggered per tile — instead of just appearing already
  // in place. Mobile skips this (stacked grid, no scatter to settle into).
  useEffect(() => {
    if (isMobile) return;
    const els = gsap.utils.toArray<HTMLElement>('.floating-tile');
    if (els.length === 0) return;

    const tween = gsap.fromTo(
      els,
      {
        opacity: 0,
        scale: 0.5,
        y: 50,
        rotation: (i: number) => TILES[i].rotation * 3,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotation: (i: number) => TILES[i].rotation,
        duration: 0.9,
        ease: 'back.out(1.4)',
        stagger: 0.15,
      }
    );

    return () => {
      tween.kill();
    };
  }, [isMobile]);

  // Scroll-linked convergence: tiles scatter loosely around the hero
  // content on load, then gather into a settled, aligned row as the
  // field is scrolled. Driven by top/left (plain document-flow
  // coordinates in vh/vw), not transforms, so it composes cleanly with
  // the mount entrance animation above and the idle bob.
  useEffect(() => {
    if (isMobile) return;
    gsap.registerPlugin(ScrollTrigger);
    const els = gsap.utils.toArray<HTMLElement>('.floating-tile');
    if (els.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.floating-tile-field',
        start: 'top top',
        // "+=100%" would resolve against the trigger element's own
        // (much taller) height, not one viewport — use an explicit
        // pixel amount so the convergence completes within one scroll.
        end: () => `+=${window.innerHeight}`,
        scrub: 1,
      },
    });

    els.forEach((el, i) => {
      tl.to(el, {
        top: `${TILES[i].settledPos.top}vh`,
        left: `${TILES[i].settledPos.left}vw`,
        rotation: 0,
        ease: 'none',
      }, 0);
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [isMobile]);

  return (
    <div
      className="floating-tile-field"
      style={{
        position: 'relative',
        // Desktop needs room for: the 100vh hero + a full extra viewport of
        // scroll to drive the convergence tween to completion (end is
        // `window.innerHeight` px) + buffer so the settled row isn't flush
        // against the field's bottom edge.
        minHeight: isMobile ? '100vh' : '240vh',
        width: '100%',
        overflow: 'hidden',
        background,
      }}
    >
      {/* ── Floating preview tiles (desktop: scatter -> scroll-settle) ── */}
      {!isMobile &&
        TILES.map((tile) => (
          <div
            key={tile.href}
            className="floating-tile hub-tile"
            role="link"
            tabIndex={0}
            onClick={() => onTileClick(tile.href)}
            onKeyDown={(e) => { if (e.key === 'Enter') onTileClick(tile.href); }}
            style={{
              position: 'absolute',
              zIndex: 3,
              width: '160px',
              top: `${tile.scatterPos.top}vh`,
              left: `${tile.scatterPos.left}vw`,
              transform: `rotate(${tile.rotation}deg)`,
            }}
          >
            <div className="hub-tile-bob" style={{ animationDelay: `${tile.delay}s` }}>
              <Card padding="sm">
                <tile.Preview />
                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tile.label}
                </p>
              </Card>
            </div>
          </div>
        ))}

      {/* ── Settled-zone label — sits where the tiles converge, only
           relevant once scrolled to (desktop only, matches the tile
           convergence zone at ~120vh) ── */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            top: '112vh',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 2,
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,248,238,0.35)',
          }}
        >
          {settledLabel}
        </div>
      )}

      {/* ── Centered hero slot ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-8) var(--space-6)',
        }}
      >
        {heroContent}

        {/* ── Mobile: simple stacked grid instead of absolute scatter ── */}
        {isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-10)',
              width: '100%',
              maxWidth: '420px',
            }}
          >
            {TILES.map((tile) => (
              <Card
                key={tile.href}
                padding="sm"
                onClick={() => onTileClick(tile.href)}
                style={{ cursor: 'pointer' }}
              >
                <tile.Preview />
                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tile.label}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
