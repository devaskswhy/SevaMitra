'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Zone {
  id: number;
  name: string;
  type: string;
  maxCapacity: number;
  currentLoad: number;
  priority: string;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get(`${API}/zones`);
        setZones(res.data);
      } catch (error) {
        console.error('Failed to fetch zones:', error);
      }
    };

    fetchZones();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-400 bg-red-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/20';
      default:
        return 'text-green-400 bg-green-500/20';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0D0A1A' }}>
      <TopBanner />
      <Sidebar />
      <div style={{ marginLeft: '280px', paddingTop: '56px' }}>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Zones</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-lg p-6" style={{ background: '#211835', border: '1px solid rgba(255, 165, 0, 0.25)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>{zone.name}</h3>
                    <p className="text-sm" style={{ color: '#C4B49A' }}>{zone.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(zone.priority)}`}>
                    {zone.priority}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#C4B49A' }}>Capacity</span>
                    <span className="font-semibold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>
                      {zone.currentLoad} / {zone.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: '#1A1228' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%`, background: 'linear-gradient(90deg, #FF6B00, #FFD700)' }}
                    ></div>
                  </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 rounded-lg transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #FF6B00, #FFD700)', color: '#0D0A1A', fontFamily: 'Poppins, sans-serif', fontWeight: '600' }}>
                  Manage Zone
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}