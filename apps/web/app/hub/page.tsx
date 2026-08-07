'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { HandsPrayingIcon } from '@/components/icons';
import ScrollDock from '@/components/ScrollDock';
import ZonesSection from './sections/ZonesSection';
import ZoneMapSection from './sections/ZoneMapSection';
import IncidentsSection from './sections/IncidentsSection';
import VolunteersSection from './sections/VolunteersSection';
import ReportsSection from './sections/ReportsSection';
import ShiftsSection from './sections/ShiftsSection';
import RegisterSection from './sections/RegisterSection';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

const TINT_A = 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(232,101,10,0.08) 0%, #0D0500 60%)';
const TINT_B = 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(232,101,10,0.08) 0%, #100600 60%)';

const CONTAINER_STYLE: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto' };
const SECTION_STYLE: React.CSSProperties = { width: '100%', padding: 'var(--space-14) var(--space-6)' };

/* ═══════════════════════════════════════════════════════════════
   HUB PAGE — single continuous scroll containing every function,
   in place of the old floating-tile hub + 8 separately routed
   pages. Same idea and pacing as the pre-Phase-5 single-scroll
   site (git show 9294b86:apps/web/app/page.tsx), rebuilt on top of
   today's real section components — each one an untouched extract
   of its old routed page's data-fetching, handlers, and JSX (see
   app/hub/sections/*). Navigation is ScrollDock (bottom-left,
   scrollIntoView + IntersectionObserver) instead of GlowDock's
   route-jumping.
   ═══════════════════════════════════════════════════════════════ */

export default function HubPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ activeVolunteers: 0, openIncidents: 0 });

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

  // Deep-link support for the old routes' now-redirected paths
  // (e.g. /shifts -> /hub#shifts): a plain browser hash-scroll can land
  // short since each section's own data fetch shifts layout after the
  // initial jump, so re-assert the target position once content settles.
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] || 'Sevadar';

  return (
    <>
      <div className="om-watermark" aria-hidden="true">ॐ</div>

      {/* ── Hero ── */}
      <section
        id="top"
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-8) var(--space-6)',
          background: 'radial-gradient(ellipse 120% 70% at 50% 60%, #E8650A 0%, #3D1A00 45%, #0D0500 80%)',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <HandsPrayingIcon size={22} /> सेवा के लिए तैयार
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
      </section>

      <section id="zones" style={{ ...SECTION_STYLE, background: TINT_A, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><ZonesSection /></div>
      </section>

      <section id="zone-map" style={{ ...SECTION_STYLE, background: TINT_B, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><ZoneMapSection /></div>
      </section>

      <section id="incidents" style={{ ...SECTION_STYLE, background: TINT_A, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><IncidentsSection /></div>
      </section>

      <section id="volunteers" style={{ ...SECTION_STYLE, background: TINT_B, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><VolunteersSection /></div>
      </section>

      <section id="reports" style={{ ...SECTION_STYLE, background: TINT_A, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><ReportsSection /></div>
      </section>

      <section id="shifts" style={{ ...SECTION_STYLE, background: TINT_B, position: 'relative', zIndex: 2 }}>
        <div style={CONTAINER_STYLE}><ShiftsSection /></div>
      </section>

      <section id="register" style={{ ...SECTION_STYLE, background: TINT_A, position: 'relative', zIndex: 2, paddingBottom: 'var(--space-24)' }}>
        <div style={CONTAINER_STYLE}><RegisterSection /></div>
      </section>

      <ScrollDock />
    </>
  );
}
