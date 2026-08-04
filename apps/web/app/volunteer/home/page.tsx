'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircleIcon, ClipboardIcon, CalendarIcon, AlertTriangleIcon, UserIcon } from '@/components/icons';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Assignment {
  id: number;
  volunteerId: number;
  taskId: number;
  task: {
    id: number;
    title: string;
    zone: {
      name: string;
    };
  };
  shift: {
    id: number;
    startTime: string;
    endTime: string;
  };
  checkInTime: string | null;
  checkOutTime: string | null;
}

// KNOWN LIMITATION: volunteerId is trusted from localStorage with no
// server-side session verification (see apps/web/app/volunteer/page.tsx).
// A future auth phase should replace this with a verified session token.
export default function VolunteerHome() {
  const router = useRouter();
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [nextAssignment, setNextAssignment] = useState<Assignment | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'checkin' | 'checkout' | null>(null);

  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    if (!volunteerId) {
      router.push('/volunteer');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const [assignmentsRes, upcomingShiftsRes] = await Promise.all([
        axios.get(`${API}/assignments`),
        axios.get(`${API}/shifts/upcoming`),
      ]);
      const assignments: Assignment[] = assignmentsRes.data.data || assignmentsRes.data;
      const upcomingShiftIds = new Set(
        (upcomingShiftsRes.data.data || upcomingShiftsRes.data).map((s: { id: number }) => s.id)
      );
      const myAssignments = assignments.filter(
        (a) => a.volunteerId === parseInt(volunteerId!)
      );

      // Current assignment: checked in but not checked out
      const current = myAssignments.find((a) => a.checkInTime && !a.checkOutTime);
      setCurrentAssignment(current || null);

      // Upcoming: not yet checked in, shift is in the server's future-shift
      // set, soonest first. The very next one drives "Check In Now"; the
      // rest render as a short list so the volunteer can see more than
      // just the single next assignment.
      const upcoming = myAssignments
        .filter((a) => !a.checkInTime && upcomingShiftIds.has(a.shift.id))
        .sort((a, b) => new Date(a.shift.startTime).getTime() - new Date(b.shift.startTime).getTime());

      setNextAssignment(upcoming[0] || null);
      setUpcomingShifts(upcoming.slice(1, 5));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!nextAssignment) return;
    setCheckInLoading(true);
    try {
      await axios.post(`${API}/assignments/${nextAssignment.id}/check-in`);
      await fetchData();
      setActionSuccess('checkin');
      setTimeout(() => setActionSuccess(null), 1800);
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentAssignment) return;
    setCheckInLoading(true);
    try {
      await axios.post(`${API}/assignments/${currentAssignment.id}/check-out`);
      await fetchData();
      setActionSuccess('checkout');
      setTimeout(() => setActionSuccess(null), 1800);
    } catch (error) {
      console.error('Failed to check out:', error);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('volunteerId');
    localStorage.removeItem('volunteerName');
    router.push('/volunteer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center lotus-pattern" style={{ background: 'var(--bg-base)' }}>
        <div className="saffron-spinner"></div>
        <div className="loading-bar"></div>
      </div>
    );
  }

  const volunteerName = localStorage.getItem('volunteerName') || 'Volunteer';

  return (
    <div className="min-h-screen lotus-pattern" style={{ background: 'var(--bg-base)' }}>
      <div className="loading-bar"></div>
      <div className="om-watermark">ॐ</div>
      
      {/* Header */}
      <div className="p-6 pb-20" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))', color: 'var(--bg-base)' }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-body)' }}>Welcome back,</p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-body)' }}>{volunteerName}</h1>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="p-3 rounded-lg transition-colors"
            style={{ background: 'var(--overlay-dark)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-16 pb-24">
        {actionSuccess && (
          <div className="text-center py-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 checkmark-pop"
              style={{ background: 'var(--success-tint)' }}
            >
              <CheckCircleIcon size={30} style={{ color: 'var(--status-green)' }} />
            </div>
            <p className="font-bold" style={{ color: 'var(--status-green)', fontFamily: 'var(--font-body)' }}>
              {actionSuccess === 'checkin' ? 'Checked In' : 'Checked Out'}
            </p>
          </div>
        )}

        {/* Current Assignment Card */}
        <Card padding="md" className="mb-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Current Assignment
          </h2>
          
          {currentAssignment ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'var(--saffron-tint)' }}>
                <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{currentAssignment.task.title}</p>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{currentAssignment.task.zone.name}</p>
                <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(currentAssignment.shift.startTime).toLocaleTimeString()} - {new Date(currentAssignment.shift.endTime).toLocaleTimeString()}
                </div>
              </div>
              
              <Button
                onClick={handleCheckOut}
                disabled={checkInLoading}
                variant="danger"
                size="lg"
                className="w-full"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {checkInLoading ? 'Processing...' : 'Check Out'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--saffron-tint)', color: 'var(--accent-saffron)' }}>
                <ClipboardIcon size={30} />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>No active assignment</p>
            </div>
          )}
        </Card>

        {/* Next Shift Card */}
        <Card padding="md" className="mb-4">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Next Shift</h2>
          
          {nextAssignment ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'var(--gold-tint)' }}>
                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(nextAssignment.shift.startTime).toLocaleDateString()}
                </div>
                <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  {nextAssignment.task.title} — {nextAssignment.task.zone.name}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(nextAssignment.shift.startTime).toLocaleTimeString()} - {new Date(nextAssignment.shift.endTime).toLocaleTimeString()}
                </p>
              </div>
              
              {!currentAssignment && (
                <Button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  size="lg"
                  className="w-full"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {checkInLoading ? 'Processing...' : 'Check In Now'}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}>
                <CalendarIcon size={30} />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>No upcoming shifts</p>
            </div>
          )}
        </Card>

        {/* More Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <Card padding="md" className="mb-4">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
              More Upcoming Shifts
            </h2>
            <div className="space-y-3">
              {upcomingShifts.map((a) => (
                <div key={a.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-section-alt)' }}>
                  <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {new Date(a.shift.startTime).toLocaleDateString()}
                  </div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                    {a.task.title} — {a.task.zone.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(a.shift.startTime).toLocaleTimeString()} - {new Date(a.shift.endTime).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/volunteer/report')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--danger-tint)', color: 'var(--status-red)' }}>
              <AlertTriangleIcon size={22} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Report Incident</p>
          </button>

          <button
            onClick={() => router.push('/volunteer/profile')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gold-tint)', color: 'var(--gold)' }}>
              <UserIcon size={22} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>My Profile</p>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'var(--bg-section-alt2)', borderTop: '1px solid var(--border-glow-hover)' }}>
        <div className="flex justify-around">
          <button className="flex flex-col items-center" style={{ color: 'var(--gold)', minWidth: 'var(--tap-target)' }} aria-current="page">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/report')}
            className="flex flex-col items-center transition-colors"
            style={{ color: 'var(--text-secondary)', minWidth: 'var(--tap-target)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>Report</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/profile')}
            className="flex flex-col items-center transition-colors"
            style={{ color: 'var(--text-secondary)', minWidth: 'var(--tap-target)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
