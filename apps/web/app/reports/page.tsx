'use client';

import { useState, useEffect } from 'react';
import FunctionPageShell from '@/components/FunctionPageShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusToBadge } from '@/components/ui/Badge';
import axios from 'axios';
import { useStaggerReveal } from '@/lib/scroll';
import { DownloadIcon, UsersIcon, CheckCircleIcon, ShieldIcon, StarIcon, MedalIcon, ChartIcon, type IconProps } from '@/components/icons';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  reliabilityScore: number;
  status: string;
}

interface Zone {
  id: number;
  name: string;
  type: string;
  maxCapacity: number;
  currentLoad: number;
  priority: string;
}

interface Incident {
  id: number;
  zoneId: number;
  type: string;
  severity: number;
  description: string;
  reportedBy: string;
  resolvedAt: string | null;
  createdAt: string;
}

interface Assignment {
  id: number;
  volunteerId: number;
  taskId: number;
  shiftId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export default function ReportsPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const [volRes, zoneRes, incRes, assignRes] = await Promise.all([
        axios.get(`${API}/volunteers`),
        axios.get(`${API}/zones`),
        axios.get(`${API}/incidents`),
        axios.get(`${API}/assignments`),
      ]);
      const volunteersData = volRes.data.data || volRes.data;
      const zonesData = zoneRes.data.data || zoneRes.data;
      const incidentsData = incRes.data.data || incRes.data;
      const assignmentsData = assignRes.data.data || assignRes.data;

      setVolunteers(volunteersData);
      setZones(zonesData);
      setIncidents(incidentsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useStaggerReveal('.summary-card', !loading && !error && volunteers.length > 0);

  // Computed stats
  const totalVolunteers = volunteers.length;
  const totalShiftsCompleted = assignments.filter(a => a.checkInTime && a.checkOutTime).length;
  const totalIncidentsResolved = incidents.filter(i => i.resolvedAt).length;
  const avgReliability = volunteers.length > 0
    ? Math.round(volunteers.reduce((sum, v) => sum + v.reliabilityScore, 0) / volunteers.length)
    : 0;

  // Zone performance
  const zonePerformance = zones.map(zone => {
    const zoneIncidents = incidents.filter(i => i.zoneId === zone.id);
    const resolvedIncidents = zoneIncidents.filter(i => i.resolvedAt);
    const avgResponseTime = resolvedIncidents.length > 0
      ? Math.round(resolvedIncidents.reduce((sum, i) => {
          const created = new Date(i.createdAt).getTime();
          const resolved = new Date(i.resolvedAt!).getTime();
          return sum + (resolved - created) / 60000;
        }, 0) / resolvedIncidents.length)
      : 0;

    return {
      id: zone.id,
      name: zone.name,
      assignedVolunteers: zone.currentLoad,
      incidents: zoneIncidents.length,
      avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime} min` : 'N/A',
    };
  });

  // Top 10 volunteers by reliability score
  const leaderboard = [...volunteers]
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .slice(0, 10);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { isMedal: true, color: '#D4A017', bg: 'rgba(212, 160, 23, 0.1)' };
    if (rank === 2) return { isMedal: true, color: '#78909C', bg: 'rgba(120, 144, 156, 0.1)' };
    if (rank === 3) return { isMedal: true, color: '#8B5E3C', bg: 'rgba(139, 94, 60, 0.1)' };
    return { isMedal: false, label: `#${rank}`, color: 'var(--text-muted)', bg: 'rgba(160, 120, 90, 0.05)' };
  };

  const toCsvValue = (value: string | number) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const handleExport = () => {
    const zoneRows = [
      ['Zone Name', 'Assigned Volunteers', 'Incidents', 'Avg Response Time'],
      ...zonePerformance.map((z) => [z.name, z.assignedVolunteers, z.incidents, z.avgResponseTime]),
    ];

    const leaderboardRows = [
      ['Rank', 'Name', 'Skills', 'Status', 'Reliability Score'],
      ...leaderboard.map((v, i) => [i + 1, v.name, v.skills, v.status, `${v.reliabilityScore}%`]),
    ];

    const csv = [
      'Zone Performance',
      ...zoneRows.map((row) => row.map(toCsvValue).join(',')),
      '',
      'Volunteer Leaderboard',
      ...leaderboardRows.map((row) => row.map(toCsvValue).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sevamitra-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center lotus-pattern" style={{ background: 'var(--bg-primary)' }}>
        <div className="saffron-spinner"></div>
        <div className="loading-bar"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center lotus-pattern" style={{ background: 'var(--bg-primary)' }}>
        <Card padding="lg" className="text-center" style={{ maxWidth: '420px' }}>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load report data.</p>
          <Button onClick={fetchAll}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <FunctionPageShell
      icon={ChartIcon}
      title="Reports & Analytics"
      description="Event performance overview and volunteer insights."
      headerExtra={
        <Button onClick={handleExport} className="flex items-center gap-2">
          <DownloadIcon size={18} /> Export Report
        </Button>
      }
    >
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard title="Total Volunteers" value={totalVolunteers} icon={UsersIcon} color="var(--accent-saffron)" />
            <SummaryCard title="Shifts Completed" value={totalShiftsCompleted} icon={CheckCircleIcon} color="var(--success)" />
            <SummaryCard title="Incidents Resolved" value={totalIncidentsResolved} icon={ShieldIcon} color="var(--accent-gold)" />
            <SummaryCard title="Avg Reliability Score" value={`${avgReliability}%`} icon={StarIcon} color="var(--accent-deep)" />
          </div>

          <hr className="rangoli-divider" />

          {/* Zone Performance Table */}
          <Card padding="md" className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-gold)' }}>●</span> Zone Performance
            </h2>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full">
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Zone Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Assigned Volunteers</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Incidents</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {zonePerformance.map((zone, index) => (
                    <tr key={zone.id} style={{
                      background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{zone.name}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{zone.assignedVolunteers}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge tone={zone.incidents > 3 ? 'danger' : 'success'} variant="solid">
                          {zone.incidents}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--accent-saffron)' }}>{zone.avgResponseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {zonePerformance.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No zone data available.</div>
            )}
          </Card>

          {/* Volunteer Leaderboard */}
          <Card padding="md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-saffron)' }}>●</span> Volunteer Leaderboard — Top 10
            </h2>
            <div className="space-y-3">
              {leaderboard.map((volunteer, index) => {
                const rank = index + 1;
                const badge = getRankBadge(rank);
                return (
                  <div
                    key={volunteer.id}
                    className="flex items-center gap-4 p-4 rounded-lg transition-all"
                    style={{
                      background: badge.bg,
                      border: `1px solid ${rank <= 3 ? badge.color + '40' : 'var(--border)'}`,
                    }}
                  >
                    {/* Rank Badge */}
                    <div
                      className="flex items-center justify-center rounded-full font-bold"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: rank <= 3 ? `${badge.color}15` : 'var(--bg-secondary)',
                        border: `2px solid ${badge.color}`,
                        color: badge.color,
                        fontSize: rank <= 3 ? '20px' : '14px'
                      }}
                    >
                      {badge.isMedal ? <MedalIcon size={22} /> : badge.label}
                    </div>

                    {/* Volunteer Info */}
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {volunteer.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {volunteer.skills.split(',').slice(0, 3).join(', ')}
                      </p>
                    </div>

                    {/* Status */}
                    <Badge tone={statusToBadge(volunteer.status).tone} variant="solid">
                      {volunteer.status}
                    </Badge>

                    {/* Score */}
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
                        {volunteer.reliabilityScore}%
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>reliability</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {leaderboard.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No volunteer data available.</div>
            )}
          </Card>
    </FunctionPageShell>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: (props: IconProps) => React.JSX.Element; color: string }) {
  return (
    <Card padding="md" className="hover:shadow-xl transition-all summary-card">
      <div className="flex items-center justify-between mb-4">
        <span style={{ color }}><Icon size={32} /></span>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <h3 className="font-medium" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>{title}</h3>
    </Card>
  );
}

