'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

interface Incident {
  id: number;
  type: string;
  severity: number;
  description: string;
  reportedBy: string;
  resolvedAt: string | null;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await axios.get(`${API_BASE}/incidents`);
        setIncidents(res.data);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-100 text-red-800';
    if (severity >= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const unresolved = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Incident Management</h1>

          {/* Unresolved Incidents */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Incidents ({unresolved.length})
            </h2>
            <div className="space-y-4">
              {unresolved.map((incident) => (
                <div key={incident.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{incident.type}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                      Severity {incident.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{incident.description}</p>
                  <p className="text-sm text-gray-500">Reported by: {incident.reportedBy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved Incidents */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resolved Incidents ({resolved.length})
            </h2>
            <div className="space-y-4">
              {resolved.map((incident) => (
                <div key={incident.id} className="bg-gray-50 rounded-lg shadow p-6 border-l-4 border-green-500 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">{incident.type}</h3>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      Resolved
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{incident.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}