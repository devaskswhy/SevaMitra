'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge, { severityToBadge, toneToColorVar } from '@/components/ui/Badge';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/incidents`);
      setIncidents(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const unresolved = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Incident Management</h1>

          {error && (
            <Card padding="md" className="text-center mb-6">
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load incidents.</p>
              <Button onClick={fetchIncidents} size="sm">
                Retry
              </Button>
            </Card>
          )}

          {!error && loading && (
            <div className="card rounded-lg p-8 text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Loading incidents...
            </div>
          )}

          {/* Unresolved Incidents */}
          {!error && !loading && (
          <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Active Incidents ({unresolved.length})
            </h2>
            <div className="space-y-4">
              {unresolved.map((incident) => {
                const sev = severityToBadge(incident.severity);
                return (
                  <Card key={incident.id} padding="md" style={{ borderLeft: `4px solid ${toneToColorVar(sev.tone)}` }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{incident.type}</h3>
                      <Badge tone={sev.tone} variant="solid">
                        Severity {incident.severity}
                      </Badge>
                    </div>
                    <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reported by: {incident.reportedBy}</p>
                  </Card>
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
                <Card key={incident.id} padding="md" className="opacity-75" style={{ borderLeft: '4px solid var(--status-green)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>{incident.type}</h3>
                    <Badge tone="success" variant="solid">
                      Resolved
                    </Badge>
                  </div>
                  <p className="mb-3" style={{ color: 'var(--text-muted)' }}>{incident.description}</p>
                </Card>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
