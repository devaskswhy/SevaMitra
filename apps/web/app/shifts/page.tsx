'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useStaggerReveal } from '@/lib/scroll';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Zone {
  id: number;
  name: string;
}

interface TaskAssignment {
  id: number;
  volunteerId: number;
  taskId: number;
  shiftId: number;
  checkOutTime: string | null;
}

interface Task {
  id: number;
  title: string;
  zoneId: number;
  zone: Zone;
  minVolunteers: number;
  maxVolunteers: number;
  assignments: TaskAssignment[];
}

interface Shift {
  id: number;
  startTime: string;
  endTime: string;
}

interface Volunteer {
  id: number;
  name: string;
  status: string;
  reliabilityScore: number;
}

interface Recommendation {
  volunteerId: number;
  score: number;
  skills_match: number;
  reliability_score: number;
  availability: number;
  location_proximity: number;
  workload_balance: number;
}

interface ConflictItem {
  shiftId: number;
  startTime: string;
  endTime: string;
  taskTitle: string;
}

function getShiftBreakdown(shiftId: number, tasks: Task[]) {
  return tasks
    .map((task) => ({
      task,
      assignedCount: task.assignments.filter((a) => a.shiftId === shiftId).length,
    }))
    .filter((row) => row.assignedCount > 0)
    .sort((a, b) => b.assignedCount - a.assignedCount);
}

function formatShiftDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatShiftTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const [shiftsRes, tasksRes, volunteersRes] = await Promise.all([
        axios.get(`${API}/shifts`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/volunteers`),
      ]);
      setShifts(shiftsRes.data.data || shiftsRes.data);
      setTasks(tasksRes.data.data || tasksRes.data);
      setVolunteers(volunteersRes.data.data || volunteersRes.data);
    } catch (err) {
      console.error('Failed to fetch shift data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useStaggerReveal('.shift-card', !loading && !error && shifts.length > 0);

  /* ── Create shift ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const openCreateModal = () => {
    setNewStart('');
    setNewEnd('');
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) return;
    if (new Date(newEnd) <= new Date(newStart)) {
      setCreateError('End time must be after start time.');
      return;
    }
    setCreateSubmitting(true);
    setCreateError('');
    try {
      await axios.post(`${API}/shifts`, {
        startTime: new Date(newStart).toISOString(),
        endTime: new Date(newEnd).toISOString(),
      });
      setCreateOpen(false);
      await fetchAll();
    } catch (err) {
      console.error('Failed to create shift:', err);
      setCreateError('Failed to create shift. Please try again.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  /* ── Assign volunteer ── */
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [assignTaskId, setAssignTaskId] = useState<number | ''>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [manualVolunteerId, setManualVolunteerId] = useState<number | ''>('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [conflictInfo, setConflictInfo] = useState<{ volunteerId: number; conflicts: ConflictItem[] } | null>(null);

  const openAssignModal = (shift: Shift) => {
    setAssignShift(shift);
    setAssignTaskId('');
    setRecommendations([]);
    setManualVolunteerId('');
    setAssignError('');
    setAssignSuccess('');
    setConflictInfo(null);
  };

  const closeAssignModal = () => setAssignShift(null);

  useEffect(() => {
    if (!assignShift || !assignTaskId) {
      setRecommendations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setRecLoading(true);
      try {
        const res = await axios.post(`${API}/allocation/recommendations`, {
          taskId: assignTaskId,
          shiftId: assignShift.id,
          limit: 5,
        });
        if (!cancelled) setRecommendations(res.data.data?.recommendations || []);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        if (!cancelled) setRecommendations([]);
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignShift, assignTaskId]);

  const handleAssign = async (volunteerId: number, force = false) => {
    if (!assignShift || !assignTaskId) return;
    setAssigning(true);
    setAssignError('');
    setAssignSuccess('');
    try {
      await axios.post(`${API}/assignments`, {
        volunteerId,
        taskId: assignTaskId,
        shiftId: assignShift.id,
        force,
      });
      setConflictInfo(null);
      setAssignSuccess('Volunteer assigned.');
      await fetchAll();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.conflicts) {
        setConflictInfo({ volunteerId, conflicts: err.response.data.conflicts });
      } else if (axios.isAxiosError(err)) {
        setAssignError(err.response?.data?.error || 'Failed to assign volunteer.');
      } else {
        setAssignError('Failed to assign volunteer.');
      }
    } finally {
      setAssigning(false);
    }
  };

  const activeVolunteers = volunteers.filter((v) => v.status === 'ACTIVE');
  const selectedTask = tasks.find((t) => t.id === assignTaskId);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Shifts</h1>
            <Button onClick={openCreateModal}>+ New Shift</Button>
          </div>

          {error && (
            <Card padding="md" className="text-center mb-6">
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load shift data.</p>
              <Button onClick={fetchAll} size="sm">Retry</Button>
            </Card>
          )}

          {!error && loading && (
            <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Loading shifts...
            </div>
          )}

          {!error && !loading && shifts.length === 0 && (
            <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              No shifts yet — create one to get started.
            </div>
          )}

          {!error && !loading && shifts.map((shift) => {
            const breakdown = getShiftBreakdown(shift.id, tasks);
            const totalAssigned = breakdown.reduce((sum, b) => sum + b.assignedCount, 0);
            return (
              <Card key={shift.id} padding="md" className="mb-4 shift-card">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatShiftDate(shift.startTime)}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatShiftTime(shift.startTime)} – {formatShiftTime(shift.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={totalAssigned > 0 ? 'saffron' : 'neutral'}>
                      {totalAssigned} volunteer{totalAssigned === 1 ? '' : 's'} assigned
                    </Badge>
                    <Button size="sm" onClick={() => openAssignModal(shift)}>Assign Volunteer</Button>
                  </div>
                </div>

                {breakdown.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {breakdown.map(({ task, assignedCount }) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center text-sm px-3 py-2 rounded-lg"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>{task.title} — {task.zone.name}</span>
                        <Badge
                          tone={assignedCount < task.minVolunteers ? 'danger' : assignedCount > task.maxVolunteers ? 'warning' : 'success'}
                          variant="solid"
                        >
                          {assignedCount}/{task.minVolunteers}-{task.maxVolunteers}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Create Shift Modal ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Shift">
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div>
            <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Start Time
            </label>
            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              End Time
            </label>
            <input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          {createError && (
            <p style={{ color: 'var(--status-red)', fontSize: 'var(--text-sm)' }}>{createError}</p>
          )}
          <Button type="submit" disabled={createSubmitting} className="w-full">
            {createSubmitting ? 'Creating...' : 'Create Shift'}
          </Button>
        </form>
      </Modal>

      {/* ── Assign Volunteer Modal ── */}
      <Modal
        open={!!assignShift}
        onClose={closeAssignModal}
        title={assignShift ? `Assign — ${formatShiftDate(assignShift.startTime)}, ${formatShiftTime(assignShift.startTime)}–${formatShiftTime(assignShift.endTime)}` : undefined}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              Task
            </label>
            <select
              value={assignTaskId}
              onChange={(e) => {
                setAssignTaskId(e.target.value ? Number(e.target.value) : '');
                setConflictInfo(null);
                setAssignError('');
                setAssignSuccess('');
              }}
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Select a task...</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} — {task.zone.name} (min {task.minVolunteers} / max {task.maxVolunteers})
                </option>
              ))}
            </select>
          </div>

          {selectedTask && (
            <>
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Suggested Volunteers</p>
                {recLoading && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Scoring candidates...</p>
                )}
                {!recLoading && recommendations.length === 0 && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recommendations available — use manual assignment below.</p>
                )}
                {!recLoading && recommendations.map((rec) => {
                  const vol = volunteers.find((v) => v.id === rec.volunteerId);
                  const conflict = conflictInfo?.volunteerId === rec.volunteerId ? conflictInfo : null;
                  return (
                    <div
                      key={rec.volunteerId}
                      className="p-3 rounded-lg mb-2"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {vol?.name || `Volunteer #${rec.volunteerId}`}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Match {Math.round(rec.score)}% · Skills {Math.round(rec.skills_match)}%
                          </p>
                        </div>
                        {!conflict ? (
                          <Button size="sm" onClick={() => handleAssign(rec.volunteerId)} disabled={assigning}>
                            Assign
                          </Button>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => handleAssign(rec.volunteerId, true)} disabled={assigning}>
                            Assign Anyway
                          </Button>
                        )}
                      </div>
                      {conflict && (
                        <p className="mt-2 text-xs" style={{ color: 'var(--status-red)' }}>
                          ⚠ Already assigned to &quot;{conflict.conflicts[0].taskTitle}&quot; overlapping this time
                          ({formatShiftTime(conflict.conflicts[0].startTime)}–{formatShiftTime(conflict.conflicts[0].endTime)})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Or assign manually
                </label>
                <div className="flex gap-2">
                  <select
                    value={manualVolunteerId}
                    onChange={(e) => setManualVolunteerId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-4 py-2 rounded-lg focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select a volunteer...</option>
                    {activeVolunteers.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.reliabilityScore}%)</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!manualVolunteerId || assigning}
                    onClick={() => manualVolunteerId && handleAssign(manualVolunteerId)}
                  >
                    Assign
                  </Button>
                </div>
                {conflictInfo && conflictInfo.volunteerId === manualVolunteerId && (
                  <div className="mt-2">
                    <p className="text-xs mb-2" style={{ color: 'var(--status-red)' }}>
                      ⚠ Already assigned to &quot;{conflictInfo.conflicts[0].taskTitle}&quot; overlapping this time
                      ({formatShiftTime(conflictInfo.conflicts[0].startTime)}–{formatShiftTime(conflictInfo.conflicts[0].endTime)})
                    </p>
                    <Button size="sm" variant="danger" onClick={() => handleAssign(manualVolunteerId as number, true)} disabled={assigning}>
                      Assign Anyway
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {assignError && <p style={{ color: 'var(--status-red)', fontSize: 'var(--text-sm)' }}>{assignError}</p>}
          {assignSuccess && <p style={{ color: 'var(--status-green)', fontSize: 'var(--text-sm)' }}>✓ {assignSuccess}</p>}
        </div>
      </Modal>
    </div>
  );
}
