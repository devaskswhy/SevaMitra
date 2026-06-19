'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { PathOptions } from 'leaflet';

/* ═══════════════════════════════════════════════════════════════
   DYNAMIC IMPORTS — avoid SSR issues with Leaflet
   ═══════════════════════════════════════════════════════════════ */

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((m) => m.Polygon),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((m) => m.Tooltip),
  { ssr: false }
);

/* ═══════════════════════════════════════════════════════════════
   ZONE DATA
   ═══════════════════════════════════════════════════════════════ */

interface MapZone {
  id: string;
  name: string;
  coords: [number, number][];
  capacity: number;
  volunteers: number;
  incidents: number;
}

const ZONES_DATA: MapZone[] = [
  {
    id: 'z1', name: 'Triveni Sangam',
    coords: [[25.4272,81.8842],[25.4298,81.8901],[25.4251,81.8923],[25.4225,81.8864]],
    capacity: 88, volunteers: 14, incidents: 2,
  },
  {
    id: 'z2', name: 'Sector 1 Ghat',
    coords: [[25.4310,81.8780],[25.4340,81.8830],[25.4315,81.8855],[25.4285,81.8805]],
    capacity: 45, volunteers: 8, incidents: 0,
  },
  {
    id: 'z3', name: 'Sector 2 Ghat',
    coords: [[25.4355,81.8740],[25.4385,81.8790],[25.4360,81.8815],[25.4330,81.8765]],
    capacity: 62, volunteers: 10, incidents: 1,
  },
  {
    id: 'z4', name: 'Sector 3 Ghat',
    coords: [[25.4400,81.8700],[25.4430,81.8750],[25.4405,81.8775],[25.4375,81.8725]],
    capacity: 71, volunteers: 9, incidents: 1,
  },
  {
    id: 'z5', name: 'Medical Camp North',
    coords: [[25.4450,81.8650],[25.4470,81.8690],[25.4450,81.8710],[25.4430,81.8670]],
    capacity: 28, volunteers: 5, incidents: 0,
  },
  {
    id: 'z6', name: 'Medical Camp South',
    coords: [[25.4220,81.8800],[25.4240,81.8840],[25.4220,81.8860],[25.4200,81.8820]],
    capacity: 35, volunteers: 4, incidents: 1,
  },
  {
    id: 'z7', name: 'Parking Zone A',
    coords: [[25.4480,81.8580],[25.4510,81.8630],[25.4490,81.8650],[25.4460,81.8600]],
    capacity: 74, volunteers: 6, incidents: 0,
  },
  {
    id: 'z8', name: 'Parking Zone B',
    coords: [[25.4180,81.8750],[25.4205,81.8790],[25.4185,81.8810],[25.4160,81.8770]],
    capacity: 55, volunteers: 5, incidents: 0,
  },
  {
    id: 'z9', name: 'VIP Enclosure',
    coords: [[25.4320,81.8840],[25.4345,81.8880],[25.4325,81.8900],[25.4300,81.8860]],
    capacity: 40, volunteers: 7, incidents: 0,
  },
  {
    id: 'z10', name: 'Food Court Zone',
    coords: [[25.4260,81.8700],[25.4285,81.8745],[25.4265,81.8765],[25.4240,81.8720]],
    capacity: 58, volunteers: 6, incidents: 1,
  },
  {
    id: 'z11', name: 'Gate 2 Entry',
    coords: [[25.4380,81.8660],[25.4405,81.8700],[25.4385,81.8720],[25.4360,81.8680]],
    capacity: 93, volunteers: 11, incidents: 3,
  },
  {
    id: 'z12', name: 'Lost & Found Center',
    coords: [[25.4300,81.8760],[25.4320,81.8795],[25.4302,81.8812],[25.4282,81.8778]],
    capacity: 20, volunteers: 3, incidents: 0,
  },
];

/* ═══════════════════════════════════════════════════════════════
   COLOR LOGIC
   ═══════════════════════════════════════════════════════════════ */

function getZoneColor(capacity: number): { fill: string; stroke: string } {
  if (capacity >= 80) return { fill: '#E8650A', stroke: '#FF4500' };
  if (capacity >= 50) return { fill: '#D4A017', stroke: '#F5A623' };
  return { fill: '#1DB954', stroke: '#17A844' };
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MapSection() {
  const [zones, setZones] = useState<MapZone[]>(ZONES_DATA);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  /* ── Responsive check ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── URL param deep-link on mount ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zoneParam = params.get('zone');
    if (zoneParam) {
      const found = ZONES_DATA.find((z) => z.id === zoneParam);
      if (found) setSelectedZone(found);
    }
  }, []);

  /* ── Listen for zone-select events from StickyHeader search ── */
  useEffect(() => {
    const handleZoneSelect = (e: Event) => {
      const zoneId = (e as CustomEvent).detail;
      const found = zones.find((z) => z.id === zoneId);
      if (found) setSelectedZone(found);
    };
    window.addEventListener('zone-select', handleZoneSelect);
    return () => window.removeEventListener('zone-select', handleZoneSelect);
  }, [zones]);

  /* ── Simulated live updates every 30 seconds ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          capacity: Math.round(
            Math.min(100, Math.max(10, z.capacity + (Math.random() * 6 - 3)))
          ),
        }))
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Keep selectedZone in sync with live updates ── */
  useEffect(() => {
    if (selectedZone) {
      const updated = zones.find((z) => z.id === selectedZone.id);
      if (updated) setSelectedZone(updated);
    }
  }, [zones]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Build path options (memoised per zone) ── */
  const getPathOptions = useCallback(
    (capacity: number): PathOptions => {
      const colors = getZoneColor(capacity);
      return {
        fillColor: colors.fill,
        fillOpacity: 0.35,
        color: colors.stroke,
        weight: 2,
      };
    },
    []
  );

  const mapHeight = isMobile ? 360 : 520;

  /* ── Legend data ── */
  const legendItems = useMemo(
    () => [
      { color: '#1DB954', label: 'Low (0–49%)' },
      { color: '#D4A017', label: 'Medium (50–79%)' },
      { color: '#E8650A', label: 'High (80–100%)' },
    ],
    []
  );

  return (
    <div>
      {/* ── Density Legend ── */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: item.color,
              }}
            />
            <span style={{ color: 'rgba(255,248,238,0.6)', fontSize: '13px' }}>
              {item.label}
            </span>
          </div>
        ))}
        <span
          style={{
            color: 'rgba(255,248,238,0.3)',
            fontSize: '13px',
            marginLeft: 'auto',
          }}
        >
          Click any zone for details
        </span>
      </div>

      {/* ── Map ── */}
      <div
        style={{
          width: '100%',
          height: `${mapHeight}px`,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(232,101,10,0.2)',
        }}
      >
        <MapContainer
          center={[25.4358, 81.8463] as [number, number]}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {zones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coords}
              pathOptions={getPathOptions(zone.capacity)}
              eventHandlers={{
                click: () => setSelectedZone(zone),
              }}
            >
              <Tooltip direction="top" sticky>
                <span style={{ fontWeight: 600 }}>{zone.name}</span>
                <br />
                <span>Capacity: {zone.capacity}%</span>
              </Tooltip>
            </Polygon>
          ))}
        </MapContainer>
      </div>

      {/* ── Zone Info Panel (below map) ── */}
      <div
        style={{
          marginTop: '16px',
          padding: '20px 24px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(232,101,10,0.2)',
          borderRadius: '16px',
          color: '#FFF8EE',
          display: selectedZone ? 'block' : 'none',
          animation: selectedZone ? 'fade-in-up 0.3s ease-out' : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              color: '#FFF8EE',
              fontSize: '18px',
              fontWeight: '500',
            }}
          >
            {selectedZone?.name}
          </h3>
          <button
            onClick={() => setSelectedZone(null)}
            style={{
              color: 'rgba(255,248,238,0.6)',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          {/* Capacity */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '500',
                color: getZoneColor(selectedZone?.capacity ?? 0).fill,
              }}
            >
              {selectedZone?.capacity}%
            </div>
            <div
              style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}
            >
              Capacity
            </div>
          </div>

          {/* Volunteers */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '500',
                color: '#E8650A',
              }}
            >
              {selectedZone?.volunteers}
            </div>
            <div
              style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}
            >
              Volunteers
            </div>
          </div>

          {/* Incidents */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '500',
                color:
                  (selectedZone?.incidents ?? 0) > 0 ? '#E8650A' : '#1DB954',
              }}
            >
              {selectedZone?.incidents}
            </div>
            <div
              style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}
            >
              Incidents
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span
              style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}
            >
              Crowd density
            </span>
            <span style={{ color: '#FFF8EE', fontSize: '13px' }}>
              {selectedZone?.capacity}%
            </span>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              height: '8px',
            }}
          >
            <div
              style={{
                width: (selectedZone?.capacity ?? 0) + '%',
                height: '100%',
                borderRadius: '4px',
                background: getZoneColor(selectedZone?.capacity ?? 0).fill,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
