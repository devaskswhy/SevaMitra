'use client';

import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge, { severityToBadge, toneToColorVar } from '@/components/ui/Badge';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Volunteer {
  id: number;
  name: string;
}

interface Incident {
  id: number;
  type: string;
  severity: number;
  description: string;
  reportedBy: string;
  status?: string;
  volunteersDeployed?: Volunteer[];
  resolvedAt: string | null;
  createdAt?: string;
}

interface DeployIncidentResponse {
  success: boolean;
  data: {
    assignedVolunteer: {
      name: string;
      phone: string;
      skills: string;
    };
    estimatedResolution: string;
    incident: Incident;
  };
}

function getResolvedDurationLabel(incident: Incident): string {
  if (!incident.createdAt || !incident.resolvedAt) return 'N/A';
  const created = new Date(incident.createdAt).getTime();
  const resolved = new Date(incident.resolvedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(resolved) || resolved <= created) return 'N/A';

  const totalMinutes = Math.round((resolved - created) / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes} minutes`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

// KNOWN LIMITATION (ported as-is from the old page.tsx incident tracker):
// a DEPLOYED incident already has `resolvedAt` set to an *estimated*
// future timestamp (see apps/api/src/routes/incidents.ts's /:id/deploy
// route), so the unresolved/resolved split below (based on
// `!incident.resolvedAt`) moves an incident into the "Resolved" list the
// moment it's deployed, not when it actually resolves. This matches the
// original page.tsx behavior exactly — not something this port changes.
export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deployingIncidentIds, setDeployingIncidentIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedIncidentIds, setHighlightedIncidentIds] = useState<number[]>([]);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [incidentsRes, resolvedRes] = await Promise.all([
        axios.get(`${API}/incidents`),
        axios.get(`${API}/incidents/resolved`),
      ]);
      const incidentsData: Incident[] = incidentsRes.data.data || incidentsRes.data;
      const resolvedData: Incident[] = resolvedRes.data.data || resolvedRes.data;
      const resolvedById = new Map<number, Incident>(resolvedData.map((i) => [i.id, i]));
      const merged = [
        ...incidentsData.filter((i) => !resolvedById.has(i.id)),
        ...Array.from(resolvedById.values()),
      ];
      setIncidents(merged);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  // Real-time incident lifecycle events — same socket contract page.tsx
  // used to handle (this page is now the only place that does).
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : 'http://localhost:4000';
    const socketInstance = io(socketUrl);

    socketInstance.on('assignment:updated', () => fetchIncidents());
    socketInstance.on('incident:reported', () => fetchIncidents());

    socketInstance.on('incident:deployed', (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item.id !== incident.id)]);
      const volunteerName = incident.volunteersDeployed?.[0]?.name || 'Volunteer';
      setToastMessage(`✅ Deployed! ${volunteerName} assigned.`);
    });

    socketInstance.on('incident:resolved', (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item.id !== incident.id)]);
    });

    socketInstance.on('incident:new', (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item.id !== incident.id)]);
      setHighlightedIncidentIds((prev) => (prev.includes(incident.id) ? prev : [incident.id, ...prev]));
      window.setTimeout(() => {
        setHighlightedIncidentIds((prev) => prev.filter((id) => id !== incident.id));
      }, 4500);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [fetchIncidents]);

  const handleDeployVolunteers = async (incidentId: number) => {
    setDeployingIncidentIds((prev) => (prev.includes(incidentId) ? prev : [...prev, incidentId]));
    try {
      const response = await axios.post<DeployIncidentResponse>(`${API}/incidents/${incidentId}/deploy`);
      const data = response.data.data;
      setIncidents((prev) => {
        const withoutIncident = prev.filter((incident) => incident.id !== incidentId);
        return data?.incident ? [data.incident, ...withoutIncident] : withoutIncident;
      });
      if (data?.assignedVolunteer) {
        setToastMessage(
          `✅ Deployed! ${data.assignedVolunteer.name} assigned. Est. resolution: ${data.estimatedResolution}`
        );
      }
    } catch (err) {
      console.error('Failed to deploy volunteers:', err);
      window.alert('Deployment failed. Please try again.');
    } finally {
      setDeployingIncidentIds((prev) => prev.filter((id) => id !== incidentId));
    }
  };

  const unresolved = incidents.filter((i) => !i.resolvedAt);
  const resolved = incidents.filter((i) => i.resolvedAt);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            right: '20px',
            zIndex: 1200,
            background: 'rgba(17, 34, 17, 0.95)',
            border: '1px solid rgba(29,185,84,0.5)',
            color: '#D6FFE0',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: '12px',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            maxWidth: '360px',
          }}
        >
          {toastMessage}
        </div>
      )}
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

          {!error && !loading && (
          <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Active Incidents ({unresolved.length})
            </h2>
            {unresolved.length === 0 ? (
              <Card padding="lg" className="text-center" style={{ color: 'var(--text-muted)' }}>
                No active incidents
              </Card>
            ) : (
              <div className="space-y-4">
                {unresolved.map((incident) => {
                  const sev = severityToBadge(incident.severity);
                  const isDeploying = deployingIncidentIds.includes(incident.id);
                  const isHighlighted = highlightedIncidentIds.includes(incident.id);
                  return (
                    <Card
                      key={incident.id}
                      padding="md"
                      style={{
                        borderLeft: `4px solid ${toneToColorVar(sev.tone)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--space-4)',
                        animation: isHighlighted ? 'sacred-pulse 1.25s ease-in-out 3' : 'none',
                      }}
                    >
                      <div style={{ flex: '1 1 300px' }}>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge tone={sev.tone} variant="solid">
                            {sev.label}
                          </Badge>
                          {incident.severity >= 5 && (
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#ff2d2d',
                                animation: 'sacred-pulse 1s ease-in-out infinite',
                                boxShadow: '0 0 0 4px rgba(255,45,45,0.2)',
                              }}
                            />
                          )}
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{incident.type}</h3>
                        </div>
                        <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                        {incident.reportedBy && (
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reported by: {incident.reportedBy}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeployVolunteers(incident.id)}
                        disabled={isDeploying}
                        style={{ whiteSpace: 'nowrap', minWidth: '140px' }}
                      >
                        {isDeploying ? '⏳ Deploying...' : '🔥 Deploy'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Resolved Incidents ({resolved.length})
            </h2>
            <div className="space-y-3">
              {resolved.map((incident) => {
                const resolverName = incident.volunteersDeployed?.[0]?.name || 'Unassigned';
                const resolvedIn = getResolvedDurationLabel(incident);
                return (
                  <Card key={incident.id} padding="md" className="opacity-75" style={{ borderLeft: '4px solid var(--status-green)' }}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{incident.type}</h3>
                        <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>{incident.description}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resolved by: {resolverName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resolved in: {resolvedIn}</p>
                      </div>
                      <Badge tone="success" variant="solid">
                        Resolved
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
