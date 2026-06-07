'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MetricCard from '@/components/MetricCard';
import ZoneMap from '@/components/ZoneMap';
import ActivityFeed from '@/components/ActivityFeed';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

interface Stats {
  volunteers: number;
  zones: number;
  activeShifts: number;
  incidents: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    volunteers: 0,
    zones: 0,
    activeShifts: 0,
    incidents: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [volunteersRes, zonesRes, tasksRes, incidentsRes] = await Promise.all([
          axios.get(`${API_BASE}/volunteers`),
          axios.get(`${API_BASE}/zones`),
          axios.get(`${API_BASE}/tasks`),
          axios.get(`${API_BASE}/incidents`),
        ]);

        setStats({
          volunteers: volunteersRes.data.length,
          zones: zonesRes.data.length,
          activeShifts: tasksRes.data.length,
          incidents: incidentsRes.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mahakumbh Dashboard</h1>
          <p className="text-gray-600 mb-8">Real-time volunteer and operations management</p>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard label="Active Volunteers" value={stats.volunteers} color="orange" />
            <MetricCard label="Zones" value={stats.zones} color="saffron" />
            <MetricCard label="Tasks" value={stats.activeShifts} color="amber" />
            <MetricCard label="Incidents" value={stats.incidents} color="red" />
          </div>

          {/* Map and Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ZoneMap />
            </div>
            <div>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}