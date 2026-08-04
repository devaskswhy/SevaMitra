'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { HandsPrayingIcon } from '@/components/icons';
import FloatingTileField from '@/components/FloatingTileField';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

/* ═══════════════════════════════════════════════════════════════
   HUB PAGE — greeting + at-a-glance stats sit inside the floating
   tile field's centered hero slot (see components/FloatingTileField
   for the scatter/scroll-converge tile behavior, shared with the
   landing page).
   ═══════════════════════════════════════════════════════════════ */

export default function HubPage() {
  const { data: session } = useSession();
  const router = useRouter();
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

  const firstName = session?.user?.name?.split(' ')[0] || 'Sevadar';

  return (
    <>
      <div className="om-watermark" aria-hidden="true">ॐ</div>
      <FloatingTileField
        onTileClick={(href) => router.push(href)}
        heroContent={
          <>
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
          </>
        }
      />
    </>
  );
}
