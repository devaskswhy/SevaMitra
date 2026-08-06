'use client';

import dynamic from 'next/dynamic';
import FunctionPageShell from '@/components/FunctionPageShell';
import { MapIcon } from '@/components/icons';
import { useStaggerReveal } from '@/lib/scroll';

// MapSection uses react-leaflet, which touches window at import time —
// must stay client-only, same pattern used everywhere else Leaflet is
// loaded in this app.
const MapSection = dynamic(() => import('@/components/MapSection'), { ssr: false });

export default function MapPage() {
  useStaggerReveal('.map-reveal');

  return (
    <FunctionPageShell icon={MapIcon} title="Mahakumbh Zone Intelligence" description="Live density monitoring across all 12 sectors.">
      <div className="map-reveal">
        <MapSection />
      </div>
    </FunctionPageShell>
  );
}
