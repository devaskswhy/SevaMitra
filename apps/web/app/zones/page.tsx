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

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH': return { background: '#B71C1C', color: '#fff' };
      case 'MEDIUM': return { background: '#E65100', color: '#fff' };
      default: return { background: '#2E7D32', color: '#fff' };
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div style={{ marginLeft: '280px', paddingTop: '56px' }}>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Zones</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => {
              const priorityStyle = getPriorityStyle(zone.priority);
              return (
                <div key={zone.id} className="card rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{zone.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{zone.type}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={priorityStyle}>
                      {zone.priority}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {zone.currentLoad} / {zone.maxCapacity}
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-secondary)' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%`, background: 'linear-gradient(90deg, #FF6B00, #FFD700)' }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 rounded-lg transition-all hover:shadow-lg" style={{
                    background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '600'
                  }}>
                    Manage Zone
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}