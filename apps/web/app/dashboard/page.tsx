/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import TopBanner from '@/components/TopBanner';
import Sidebar from '@/components/Sidebar';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Volunteer {
  id: number;
  name: string;
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
  resolvedAt: string | null;
}

interface Task {
  id: number;
  title: string;
  zoneId: number;
  skillsRequired: string;
}

interface Assignment {
  id: number;
  volunteerId: number;
  taskId: number;
  shiftId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface VolunteerRecommendation {
  volunteerId: number;
  name: string;
  score: number;
  skillMatch: number;
  availability: number;
  distance: number;
}

interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success';
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalActiveVolunteers: 0,
    zonesOverCapacity: 0,
    openIncidents: 0,
    pendingAssignments: 0,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<VolunteerRecommendation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const cleanup = initSocket();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [volunteersRes, zonesRes, incidentsRes, tasksRes, assignmentsRes] = await Promise.all([
        axios.get(`${API}/volunteers`),
        axios.get(`${API}/zones`),
        axios.get(`${API}/incidents`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/assignments`),
      ]);

      const volunteers = volunteersRes.data;
      const zonesData = zonesRes.data;
      const incidentsData = incidentsRes.data;
      const tasksData = tasksRes.data;
      const assignmentsData = assignmentsRes.data;

      const activeVolunteers = volunteers.filter((v: Volunteer) => v.status === 'ACTIVE').length;
      const zonesOver80 = zonesData.filter((z: Zone) => (z.currentLoad / z.maxCapacity) > 0.8).length;
      const openIncidents = incidentsData.filter((i: Incident) => !i.resolvedAt).length;
      const pendingAssignments = assignmentsData.filter((a: Assignment) => !a.checkInTime).length;

      setStats({
        totalActiveVolunteers: activeVolunteers,
        zonesOverCapacity: zonesOver80,
        openIncidents,
        pendingAssignments,
      });

      setZones(zonesData);
      setIncidents(incidentsData);
      setTasks(tasksData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const initSocket = () => {
    const socketInstance = io('http://localhost:4000');

    socketInstance.on('connect', () => {
      console.log('Connected to socket');
    });

    socketInstance.on('activity', (data: Activity) => {
      setActivities((prev) => [
        { ...data, id: data.id || Date.now().toString() },
        ...prev.slice(0, 49),
      ]);
    });

    socketInstance.on('assignment:updated', (data: string) => {
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Assignment updated: ${data}`, timestamp: new Date(), type: 'info' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socketInstance.on('incident:reported', (data: string) => {
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Incident reported: ${data}`, timestamp: new Date(), type: 'warning' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    return () => {
      socketInstance.disconnect();
    };
  };

  const handleDeployVolunteers = async (incidentId: number) => {
    try {
      await axios.post(`${API}/incidents/${incidentId}/deploy`);
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Volunteers deployed for incident #${incidentId}`, timestamp: new Date(), type: 'success' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    } catch (error) {
      console.error('Failed to deploy volunteers:', error);
    }
  };

  const handleFindBestVolunteers = async () => {
    if (!selectedTask) return;
    try {
      const response = await axios.get(`${API}/allocate/recommend`, {
        params: { taskId: selectedTask },
      });
      setRecommendations(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
  };

  const getCapacityColor = (zone: Zone) => {
    const ratio = zone.currentLoad / zone.maxCapacity;
    if (ratio > 0.8) return '#B71C1C';
    if (ratio > 0.5) return '#E65100';
    return '#2E7D32';
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) return { bg: '#B71C1C', color: '#fff', label: 'CRITICAL' };
    if (severity >= 3) return { bg: '#E65100', color: '#fff', label: 'HIGH' };
    if (severity >= 2) return { bg: '#E65100', color: '#fff', label: 'MEDIUM' };
    return { bg: '#2E7D32', color: '#fff', label: 'LOW' };
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
    <div className="min-h-screen lotus-pattern" style={{ background: 'var(--bg-primary)' }}>
      <div className="loading-bar"></div>
      <TopBanner />
      <Sidebar />
      
      {/* OM Watermark */}
      <div className="om-watermark">ॐ</div>

      {/* Main Content */}
      <div className="p-8" style={{ marginLeft: '280px', paddingTop: '56px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Operations Center
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Real-time Volunteer Management System
          </p>
        </div>

        {/* Top Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Total Active Volunteers" value={stats.totalActiveVolunteers} color="var(--accent-saffron)" icon="👥" />
          <MetricCard title="Zones >80% Capacity" value={stats.zonesOverCapacity} color="var(--accent-gold)" icon="📍" />
          <MetricCard title="Open Incidents" value={stats.openIncidents} color="var(--accent-deep)" icon="⚠️" />
          <MetricCard title="Pending Assignments" value={stats.pendingAssignments} color="var(--accent-gold)" icon="📋" />
        </div>

        {/* Sacred Moments Image Strip */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Sacred Moments
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[
              { src: '/im1.webp', alt: 'Triveni Sangam Aerial View', caption: 'Crowds at the sacred confluence' },
              { src: '/im2.webp', alt: 'Evening Aarti', caption: 'Devotional ceremonies at ghats' },
              { src: '/im3.webp', alt: 'Sunrise Bathing', caption: 'Holy dip at dawn' },
            ].map((img) => (
              <div key={img.src} className="flex-shrink-0 w-80">
                <div className="rounded-xl overflow-hidden relative" style={{ height: '160px', transition: 'transform 0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img src={img.src} alt={img.alt} style={{width:'100%', height:'160px', objectFit:'cover', borderRadius:'12px'}} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-semibold">{img.alt}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{img.caption}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="rangoli-divider" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Zone Status Grid */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-gold)' }}>●</span> Zone Status Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="card p-4 hover:border-orange-400 transition-all overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          <span className="text-xl flex-shrink-0">{getZoneIcon(zone.type)}</span>
                          <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{zone.name}</h3>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{zone.type}</p>
                      </div>
                      <div className="w-3 h-3 rounded-full" style={{ background: getCapacityColor(zone) }} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                        <span style={{ color: 'var(--text-primary)' }}>{zone.currentLoad} / {zone.maxCapacity}</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-2 rounded-full" style={{
                          width: `${(zone.currentLoad / zone.maxCapacity) * 100}%`,
                          background: 'linear-gradient(90deg, #FF6B00, #FFD700)'
                        }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                        <span className="font-medium px-2 py-0.5 rounded text-xs text-white" style={{
                          background: zone.priority === 'HIGH' ? '#B71C1C' : zone.priority === 'MEDIUM' ? '#E65100' : '#2E7D32'
                        }}>
                          {zone.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident List */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-saffron)' }}>●</span> Active Incidents
              </h2>
              <div className="space-y-3">
                {incidents.filter(i => !i.resolvedAt).length === 0 ? (
                  <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No active incidents</p>
                ) : (
                  incidents.filter(i => !i.resolvedAt).map((incident) => {
                    const badge = getSeverityBadge(incident.severity);
                    return (
                      <div key={incident.id} className="card p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded text-sm font-bold" style={{ background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{incident.type}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{incident.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeployVolunteers(incident.id)}
                          className="ml-4 px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg flex items-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                            color: '#fff',
                            border: 'none'
                          }}
                        >
                          🔥 Deploy Volunteers
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Allocation Panel */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-gold)' }}>●</span> Quick Volunteer Allocation
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2" style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Select Task</label>
                  <select
                    value={selectedTask || ''}
                    onChange={(e) => setSelectedTask(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Choose a task...</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleFindBestVolunteers}
                  disabled={!selectedTask}
                  className="w-full px-6 py-4 rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                    color: '#fff',
                    border: 'none'
                  }}
                >
                  Find Best Volunteers
                </button>
                {recommendations.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Top 5 Recommendations</h3>
                    {recommendations.map((rec) => (
                      <div key={rec.volunteerId} className="card p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{rec.name}</span>
                          <span className="font-bold" style={{ color: 'var(--accent-gold)' }}>{rec.score}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Skill:</span>
                            <span className="ml-1" style={{ color: 'var(--text-primary)' }}>{rec.skillMatch}%</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Available:</span>
                            <span className="ml-1" style={{ color: 'var(--text-primary)' }}>{rec.availability}%</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Distance:</span>
                            <span className="ml-1" style={{ color: 'var(--text-primary)' }}>{rec.distance}km</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="card p-6 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#2E7D32' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--accent-saffron)' }}>LIVE</span>
              </div>
              Activity Feed
            </h2>
            <div className="space-y-3 h-[600px] overflow-y-auto pr-2">
              {activities.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-4xl mb-4">📡</p>
                  <p>Waiting for live updates...</p>
                  <p className="text-sm mt-2">Connected to Socket.io</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="pl-4 py-2 rounded-r transition-all"
                    style={{
                      borderLeft: `4px solid ${activity.type === 'warning' ? '#E65100' : activity.type === 'success' ? '#2E7D32' : '#1565C0'}`,
                      background: activity.type === 'warning' ? 'rgba(230, 81, 0, 0.08)' : activity.type === 'success' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(21, 101, 192, 0.08)'
                    }}
                  >
                    <p className="text-sm font-medium" style={{
                      color: activity.type === 'warning' ? '#E65100' : activity.type === 'success' ? '#2E7D32' : '#1565C0'
                    }}>
                      {activity.message}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <hr className="rangoli-divider" />

        {/* Zone Capacity Chart */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-gold)' }}>●</span> Zone Capacity Overview
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.map(z => ({
                name: z.name,
                current: z.currentLoad,
                max: z.maxCapacity,
                percentage: Math.round((z.currentLoad / z.maxCapacity) * 100)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="current" fill="var(--accent-saffron)" name="Current Load" />
                <Bar dataKey="max" fill="var(--accent-gold)" name="Max Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) {
  return (
    <div className="card p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{icon}</span>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <span className="text-4xl font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <h3 className="font-medium" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>{title}</h3>
    </div>
  );
}

function getZoneIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'GHAT': '🏊',
    'CAMP': '🏕',
    'MEDICAL': '🏥',
    'TRAFFIC': '🚦',
    'ENTRY_EXIT': '🚪',
    'CROWD_CONTROL': '👥',
  };
  return icons[type] || '📍';
}