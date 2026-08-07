'use client';

import dynamic from 'next/dynamic';
import SectionHeading from './SectionHeading';
import { useStaggerReveal } from '@/lib/scroll';

// components/MapSection uses react-leaflet, which touches window at
// import time — must stay client-only, same pattern used everywhere
// else Leaflet is loaded in this app. (Named LeafletMap here to avoid
// clashing with this very file's own "section" naming.)
const LeafletMap = dynamic(() => import('@/components/MapSection'), { ssr: false });

export default function ZoneMapSection() {
  useStaggerReveal('.map-reveal');

  return (
    <>
      <SectionHeading title="Zone Map" description="Live density monitoring across all 12 sectors." />
      <div className="map-reveal">
        <LeafletMap />
      </div>
    </>
  );
}
