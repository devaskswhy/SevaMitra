'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

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
        const res = await axios.get(`${API}/incidents`);
        setIncidents(res.data.data || res.data);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityStyle = (severity: number) => {
    if (severity >= 4) return { background: '#B71C1C', color: '#fff' };
    if (severity >= 3) return { background: '#E65100', color: '#fff' };
    return { background: '#D4A017', color: '#fff' };
  };

  const unresolved = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Incident Management</h1>

          {/* Unresolved Incidents */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Active Incidents ({unresolved.length})
            </h2>
            <div className="space-y-4">
              {unresolved.map((incident) => {
                const sevStyle = getSeverityStyle(incident.severity);
                return (
                  <div key={incident.id} className="card rounded-lg p-6" style={{ borderLeft: '4px solid #B71C1C' }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{incident.type}</h3>
                      <span className="px-3 py-1 rounded text-xs font-semibold" style={sevStyle}>
                        Severity {incident.severity}
                      </span>
                    </div>
                    <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reported by: {incident.reportedBy}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolved Incidents */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Resolved Incidents ({resolved.length})
            </h2>
            <div className="space-y-4">
              {resolved.map((incident) => (
                <div key={incident.id} className="card rounded-lg p-6 opacity-75" style={{ borderLeft: '4px solid #2E7D32' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>{incident.type}</h3>
                    <span className="px-3 py-1 rounded text-xs font-semibold text-white" style={{ background: '#2E7D32' }}>
                      Resolved
                    </span>
                  </div>
                  <p className="mb-3" style={{ color: 'var(--text-muted)' }}>{incident.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
