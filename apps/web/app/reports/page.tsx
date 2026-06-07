'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import axios from 'axios';

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

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [volRes, zoneRes, incRes, assignRes] = await Promise.all([
          axios.get(`${API}/volunteers`),
          axios.get(`${API}/zones`),
          axios.get(`${API}/incidents`),
          axios.get(`${API}/assignments`),
        ]);
        setVolunteers(volRes.data);
        setZones(zoneRes.data);
        setIncidents(incRes.data);
        setAssignments(assignRes.data);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

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
    if (rank === 1) return { emoji: '🥇', color: '#D4A017', bg: 'rgba(212, 160, 23, 0.1)' };
    if (rank === 2) return { emoji: '🥈', color: '#78909C', bg: 'rgba(120, 144, 156, 0.1)' };
    if (rank === 3) return { emoji: '🥉', color: '#8B5E3C', bg: 'rgba(139, 94, 60, 0.1)' };
    return { emoji: `#${rank}`, color: 'var(--text-muted)', bg: 'rgba(160, 120, 90, 0.05)' };
  };

  const handleExport = () => {
    alert('Exporting...');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center lotus-pattern" style={{ background: 'var(--bg-primary)' }}>
        <div className="saffron-spinner"></div>
        <div className="loading-bar"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div style={{ marginLeft: '280px', paddingTop: '56px' }}>
        <div className="p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Reports & Analytics
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Event performance overview and volunteer insights
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                color: '#fff',
                border: 'none'
              }}
            >
              📥 Export Report
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard title="Total Volunteers" value={totalVolunteers} icon="👥" color="var(--accent-saffron)" />
            <SummaryCard title="Shifts Completed" value={totalShiftsCompleted} icon="✅" color="var(--success)" />
            <SummaryCard title="Incidents Resolved" value={totalIncidentsResolved} icon="🛡️" color="var(--accent-gold)" />
            <SummaryCard title="Avg Reliability Score" value={`${avgReliability}%`} icon="⭐" color="var(--accent-deep)" />
          </div>

          <hr className="rangoli-divider" />

          {/* Zone Performance Table */}
          <div className="card p-6 mb-8">
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
                        <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{
                          background: zone.incidents > 3 ? '#B71C1C' : '#2E7D32'
                        }}>
                          {zone.incidents}
                        </span>
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
          </div>

          {/* Volunteer Leaderboard */}
          <div className="card p-6">
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
                      {badge.emoji}
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
                    <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{
                      background: volunteer.status === 'ACTIVE' ? '#2E7D32' : '#B71C1C'
                    }}>
                      {volunteer.status}
                    </span>

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
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="card p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{icon}</span>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <h3 className="font-medium" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>{title}</h3>
    </div>
  );
}
