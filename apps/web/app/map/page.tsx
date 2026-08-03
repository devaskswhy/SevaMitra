'use client';

import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import { useStaggerReveal } from '@/lib/scroll';

// MapSection uses react-leaflet, which touches window at import time —
// must stay client-only, same pattern used everywhere else Leaflet is
// loaded in this app.
const MapSection = dynamic(() => import('@/components/MapSection'), { ssr: false });

export default function MapPage() {
  useStaggerReveal('.map-reveal');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <div className="map-reveal">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Mahakumbh Zone Intelligence
            </h1>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Live density monitoring across all 12 sectors
            </p>
          </div>
          <div className="map-reveal">
            <MapSection />
          </div>
        </div>
      </div>
    </div>
  );
}
