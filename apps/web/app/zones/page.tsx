'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

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
        const res = await axios.get(`${API_BASE}/zones`);
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
        return 'text-red-600 bg-red-50';
      case 'MEDIUM':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Zones</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(zone.priority)}`}>
                    {zone.priority}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-semibold text-gray-900">
                      {zone.currentLoad} / {zone.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
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