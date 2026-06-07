'use client';

import dynamic from 'next/dynamic';

const MapPlaceholder = () => (
  <div className="h-[500px] w-full bg-gray-50 rounded flex items-center justify-center">
    <p className="text-gray-500">Loading map...</p>
  </div>
);

const ZoneMapContent = dynamic(() => import('./ZoneMapContent'), {
  ssr: false,
  loading: () => MapPlaceholder(),
});

export default function ZoneMap() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Map - Prayagraj</h3>
      <ZoneMapContent />
    </div>
  );
}