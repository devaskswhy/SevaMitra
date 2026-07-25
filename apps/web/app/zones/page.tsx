'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge, { priorityToBadge } from '@/components/ui/Badge';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/zones`);
      setZones(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Zones</h1>

          {error && (
            <Card padding="md" className="text-center mb-6">
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load zones.</p>
              <Button onClick={fetchZones} size="sm">
                Retry
              </Button>
            </Card>
          )}

          {!error && loading && (
            <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Loading zones...
            </div>
          )}

          {!error && !loading && zones.length === 0 && (
            <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              No zones found.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} padding="md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{zone.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{zone.type}</p>
                  </div>
                  <Badge tone={priorityToBadge(zone.priority).tone} variant="solid">
                    {zone.priority}
                  </Badge>
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
                      style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%`, background: 'linear-gradient(90deg, var(--saffron), var(--gold))' }}
                    ></div>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  Manage Zone
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
