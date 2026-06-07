'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:4000/api';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    initSocket();
  }, []);

  const fetchData = async () => {
    try {
      const [volunteersRes, zonesRes, incidentsRes, tasksRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_BASE}/volunteers`),
        axios.get(`${API_BASE}/zones`),
        axios.get(`${API_BASE}/incidents`),
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/assignments`),
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
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to socket');
    });

    socketInstance.on('activity', (data: Activity) => {
      setActivities((prev) => [
        { id: Date.now().toString(), ...data },
        ...prev.slice(0, 49),
      ]);
    });

    socketInstance.on('assignment:updated', (data: any) => {
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Assignment updated: ${data}`, timestamp: new Date(), type: 'info' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socketInstance.on('incident:reported', (data: any) => {
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
      await axios.post(`${API_BASE}/incidents/${incidentId}/deploy`);
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
      const response = await axios.get(`${API_BASE}/allocate/recommend`, {
        params: { taskId: selectedTask },
      });
      setRecommendations(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
  };

  const getCapacityColor = (zone: Zone) => {
    const ratio = zone.currentLoad / zone.maxCapacity;
    if (ratio > 0.8) return 'bg-red-500';
    if (ratio > 0.5) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) return 'bg-red-600 text-white';
    if (severity >= 3) return 'bg-orange-500 text-white';
    if (severity >= 2) return 'bg-amber-400 text-black';
    return 'bg-green-500 text-white';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 4) return 'CRITICAL';
    if (severity >= 3) return 'HIGH';
    if (severity >= 2) return 'MEDIUM';
    return 'LOW';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Operations Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-[#1a1a2e] border-b border-gray-700 px-8 py-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-3 h-3 bg-[#FF6B35] rounded-full animate-pulse"></span>
          SevaMitra Operations Center
        </h1>
        <p className="text-gray-400 mt-1">Real-time Volunteer Management System</p>
      </div>

      <div className="p-8">
        {/* Top Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Active Volunteers"
            value={stats.totalActiveVolunteers}
            color="#FF6B35"
            icon="👥"
          />
          <MetricCard
            title="Zones >80% Capacity"
            value={stats.zonesOverCapacity}
            color="#FFA500"
            icon="📍"
          />
          <MetricCard
            title="Open Incidents"
            value={stats.openIncidents}
            color="#FF6B35"
            icon="⚠️"
          />
          <MetricCard
            title="Pending Assignments"
            value={stats.pendingAssignments}
            color="#FFA500"
            icon="📋"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Zone Status and Incidents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Zone Status Grid */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#FFA500]">●</span> Zone Status Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-[#FF6B35] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{zone.name}</h3>
                        <p className="text-gray-400 text-sm">{zone.type}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getCapacityColor(zone)}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Capacity</span>
                        <span className="text-white">
                          {zone.currentLoad} / {zone.maxCapacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getCapacityColor(zone)}`}
                          style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Priority</span>
                        <span className={`font-medium ${
                          zone.priority === 'HIGH' ? 'text-red-400' :
                          zone.priority === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'
                        }`}>
                          {zone.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident List */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#FF6B35]">●</span> Active Incidents
              </h2>
              <div className="space-y-3">
                {incidents.filter(i => !i.resolvedAt).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No active incidents</p>
                ) : (
                  incidents.filter(i => !i.resolvedAt).map((incident) => (
                    <div
                      key={incident.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityBadge(incident.severity)}`}>
                            {getSeverityLabel(incident.severity)}
                          </span>
                          <span className="text-white font-medium">{incident.type}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{incident.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeployVolunteers(incident.id)}
                        className="ml-4 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg font-medium transition-colors"
                      >
                        Deploy Volunteers
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Allocation Panel */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#FFA500]">●</span> Quick Volunteer Allocation
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Task</label>
                  <select
                    value={selectedTask || ''}
                    onChange={(e) => setSelectedTask(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="">Choose a task...</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleFindBestVolunteers}
                  disabled={!selectedTask}
                  className="w-full px-4 py-3 bg-[#FFA500] hover:bg-[#e69500] text-black rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Find Best Volunteers
                </button>
                {recommendations.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="text-white font-semibold">Top 5 Recommendations</h3>
                    {recommendations.map((rec) => (
                      <div
                        key={rec.volunteerId}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{rec.name}</span>
                          <span className="text-[#FF6B35] font-bold">{rec.score}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Skill:</span>
                            <span className="text-white ml-1">{rec.skillMatch}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Available:</span>
                            <span className="text-white ml-1">{rec.availability}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Distance:</span>
                            <span className="text-white ml-1">{rec.distance}km</span>
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
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700 h-fit">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Activity Feed
            </h2>
            <div className="space-y-3 h-[600px] overflow-y-auto pr-2">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-4">📡</p>
                  <p>Waiting for live updates...</p>
                  <p className="text-sm mt-2">Connected to Socket.io</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`border-l-4 pl-4 py-2 rounded-r ${
                      activity.type === 'warning' ? 'border-orange-500 bg-orange-500/10' :
                      activity.type === 'success' ? 'border-green-500 bg-green-500/10' :
                      'border-blue-500 bg-blue-500/10'
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      activity.type === 'warning' ? 'text-orange-400' :
                      activity.type === 'success' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Zone Capacity Chart */}
        <div className="mt-6 bg-[#1a1a2e] rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-[#FFA500]">●</span> Zone Capacity Overview
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.map(z => ({
                name: z.name,
                current: z.currentLoad,
                max: z.maxCapacity,
                percentage: Math.round((z.currentLoad / z.maxCapacity) * 100)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #374151' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="current" fill="#FF6B35" name="Current Load" />
                <Bar dataKey="max" fill="#FFA500" name="Max Capacity" />
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
    <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    </div>
  );
}