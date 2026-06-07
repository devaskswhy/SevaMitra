'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
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
    if (severity >= 4) return 'bg-red-500/20 text-red-400';
    if (severity >= 3) return 'bg-orange-500/20 text-orange-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const unresolved = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div className="flex h-screen" style={{ background: '#0D0A1A' }}>
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <TopBanner />
        <div className="p-8" style={{ marginTop: '56px' }}>
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Incident Management</h1>

          {/* Unresolved Incidents */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>
              Active Incidents ({unresolved.length})
            </h2>
            <div className="space-y-4">
              {unresolved.map((incident) => (
                <div key={incident.id} className="rounded-lg p-6" style={{ background: '#211835', border: '1px solid rgba(255, 165, 0, 0.25)', borderLeft: '4px solid #F44336' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>{incident.type}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                      Severity {incident.severity}
                    </span>
                  </div>
                  <p className="mb-3" style={{ color: '#C4B49A' }}>{incident.description}</p>
                  <p className="text-sm" style={{ color: '#C4B49A' }}>Reported by: {incident.reportedBy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolved Incidents */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>
              Resolved Incidents ({resolved.length})
            </h2>
            <div className="space-y-4">
              {resolved.map((incident) => (
                <div key={incident.id} className="rounded-lg p-6 opacity-75" style={{ background: '#1A1228', border: '1px solid rgba(255, 165, 0, 0.25)', borderLeft: '4px solid #4CAF50' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#C4B49A', fontFamily: 'Poppins, sans-serif' }}>{incident.type}</h3>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                      Resolved
                    </span>
                  </div>
                  <p className="mb-3" style={{ color: '#C4B49A' }}>{incident.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}