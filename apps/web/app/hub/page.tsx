'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { gsap } from 'gsap';
import Card from '@/components/ui/Card';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

/* ═══════════════════════════════════════════════════════════════
   MINIATURE CONTENT PREVIEWS — abstracted, not real data.
   Each one is a tiny visual echo of its destination page's actual
   content shape, per the mobbin/portfolio-niti-kanoongo reference:
   floating tiles are content previews, not flat icon+label cards.
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

/* ═══════════════════════════════════════════════════════════════
   TILE DATA — position/rotation hand-tuned for an organic scatter
   (desktop only; mobile falls back to a simple stacked grid).
   ═══════════════════════════════════════════════════════════════ */

interface Tile {
  href: string;
  label: string;
  rotation: number;
  desktopPos: React.CSSProperties;
  delay: number;
  Preview: () => React.JSX.Element;
}

const TILES: Tile[] = [
  { href: '/dashboard', label: 'Dashboard', rotation: -5, desktopPos: { top: '6%', left: '6%' }, delay: 0, Preview: DashboardPreview },
  { href: '/map', label: 'Zone Map', rotation: 4, desktopPos: { top: '10%', right: '7%' }, delay: 0.6, Preview: MapPreview },
  { href: '/incidents', label: 'Incidents', rotation: 6, desktopPos: { top: '44%', left: '2%' }, delay: 1.2, Preview: IncidentsPreview },
  { href: '/volunteers', label: 'Volunteers', rotation: -4, desktopPos: { top: '48%', right: '3%' }, delay: 1.8, Preview: VolunteersPreview },
  { href: '/reports', label: 'Reports', rotation: 3, desktopPos: { bottom: '8%', left: '11%' }, delay: 2.4, Preview: ReportsPreview },
  { href: '/register', label: 'Register', rotation: -6, desktopPos: { bottom: '6%', right: '9%' }, delay: 3, Preview: RegisterPreview },
];

/* ═══════════════════════════════════════════════════════════════
   HUB PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function HubPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({ activeVolunteers: 0, openIncidents: 0 });

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
    const els = gsap.utils.toArray<HTMLElement>('.hub-tile');
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [volRes, incRes] = await Promise.all([
          axios.get(`${API}/volunteers`),
          axios.get(`${API}/incidents`),
        ]);
        const volunteers = volRes.data.data || volRes.data;
        const incidents = incRes.data.data || incRes.data;
        setStats({
          activeVolunteers: volunteers.filter((v: { status: string }) => v.status === 'ACTIVE').length,
          openIncidents: incidents.filter((i: { resolvedAt: string | null }) => !i.resolvedAt).length,
        });
      } catch (err) {
        console.error('Failed to fetch hub stats:', err);
      }
    };
    fetchStats();
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] || 'Sevadar';

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        // Deliberate exception to the app's flat --bg-base — matches the
        // portfolio-niti-kanoongo.vercel.app hero's black-to-saffron
        // gradient treatment (see PHASES.md Phase 5).
        background: 'radial-gradient(ellipse 120% 90% at 50% 100%, #E8650A 0%, #3D1A00 45%, #0D0500 80%)',
      }}
    >
      <div className="om-watermark" aria-hidden="true">ॐ</div>

      {/* ── Floating preview tiles (desktop: absolute scatter) ── */}
      {!isMobile &&
        TILES.map((tile) => (
          <div
            key={tile.href}
            className="hub-tile"
            role="link"
            tabIndex={0}
            onClick={() => router.push(tile.href)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(tile.href); }}
            style={{
              position: 'absolute',
              zIndex: 3,
              width: '160px',
              transform: `rotate(${tile.rotation}deg)`,
              ...tile.desktopPos,
            }}
          >
            <div style={{ animation: `hub-tile-float 6s var(--ease-sacred) infinite`, animationDelay: `${tile.delay}s` }}>
              <Card padding="sm">
                <tile.Preview />
                <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {tile.label}
                </p>
              </Card>
            </div>
          </div>
        ))}

      {/* ── Central content ── */}
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
        <h1
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 800,
            fontSize: 'var(--text-display)',
            color: '#FFF8EE',
            lineHeight: 1.1,
            marginBottom: 'var(--space-3)',
            textShadow: '0 4px 40px rgba(0,0,0,0.4)',
          }}
        >
          Namaste, {firstName}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            color: 'rgba(255,248,238,0.85)',
            marginBottom: 'var(--space-10)',
          }}
        >
          🙏 सेवा के लिए तैयार
        </p>

        {/* ── At-a-glance stat tiles ── */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div
            style={{
              background: 'rgba(13,5,0,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-5) var(--space-7)',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#FFF8EE' }}>{stats.activeVolunteers}+</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,248,238,0.6)' }}>Active Volunteers</div>
          </div>
          <div
            style={{
              background: 'rgba(13,5,0,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-5) var(--space-7)',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: '#FFF8EE' }}>{stats.openIncidents}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,248,238,0.6)' }}>Open Incidents</div>
          </div>
        </div>

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
                onClick={() => router.push(tile.href)}
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
