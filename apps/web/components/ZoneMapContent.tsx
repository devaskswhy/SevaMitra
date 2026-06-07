'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PRAYAGRAJ_POSITION: [number, number] = [25.4358, 81.8463];

// Fix for default marker icons in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function ZoneMapContent() {
  return (
    <div className="h-[500px] w-full">
      <MapContainer
        center={PRAYAGRAJ_POSITION}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={PRAYAGRAJ_POSITION}>
          <Popup>
            <strong>Mahakumbh Mela Ground</strong>
            <br />
            Prayagraj, Uttar Pradesh
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}