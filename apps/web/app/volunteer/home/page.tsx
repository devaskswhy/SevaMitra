'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

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

interface Shift {
  id: number;
  startTime: string;
  endTime: string;
}

export default function VolunteerHome() {
  const router = useRouter();
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);

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
      const [assignmentsRes, shiftsRes] = await Promise.all([
        axios.get(`${API_BASE}/assignments`),
        axios.get(`${API_BASE}/shifts`),
      ]);

      const assignments = assignmentsRes.data;
      const shifts = shiftsRes.data;

      // Find current assignment (checked in but not checked out)
      const current = assignments.find(
        (a: Assignment) => a.volunteerId === parseInt(volunteerId!) && a.checkInTime && !a.checkOutTime
      );
      setCurrentAssignment(current || null);

      // Find next shift (future shift without assignment)
      const now = new Date();
      const futureShifts = shifts
        .filter((s: Shift) => new Date(s.startTime) > now)
        .sort((a: Shift, b: Shift) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setNextShift(futureShifts[0] || null);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      // Mock check-in - in real app, this would call the API
      await axios.post(`${API_BASE}/assignments/check-in`, {
        volunteerId: parseInt(volunteerId!),
        timestamp: new Date().toISOString(),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckInLoading(true);
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      // Mock check-out - in real app, this would call the API
      await axios.post(`${API_BASE}/assignments/check-out`, {
        volunteerId: parseInt(volunteerId!),
        timestamp: new Date().toISOString(),
      });
      fetchData();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const volunteerName = localStorage.getItem('volunteerName') || 'Volunteer';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 pb-16">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-orange-100 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold">{volunteerName}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-12 pb-24">
        {/* Current Assignment Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Current Assignment
          </h2>
          
          {currentAssignment ? (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 text-lg">{currentAssignment.task.title}</p>
                <p className="text-gray-600 mt-1">{currentAssignment.task.zone.name}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(currentAssignment.shift.startTime).toLocaleTimeString()} - {new Date(currentAssignment.shift.endTime).toLocaleTimeString()}
                </div>
              </div>
              
              <button
                onClick={handleCheckOut}
                disabled={checkInLoading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkInLoading ? 'Processing...' : 'Check Out'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-gray-600">No active assignment</p>
            </div>
          )}
        </div>

        {/* Next Shift Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Next Shift</h2>
          
          {nextShift ? (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(nextShift.startTime).toLocaleDateString()}
                </div>
                <p className="font-semibold text-gray-800 text-lg">
                  {new Date(nextShift.startTime).toLocaleTimeString()} - {new Date(nextShift.endTime).toLocaleTimeString()}
                </p>
              </div>
              
              {!currentAssignment && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkInLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkInLoading ? 'Processing...' : 'Check In Now'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <p className="text-gray-600">No upcoming shifts</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/volunteer/report')}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="font-semibold text-gray-800">Report Incident</p>
          </button>
          
          <button
            onClick={() => router.push('/volunteer/profile')}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👤</span>
            </div>
            <p className="font-semibold text-gray-800">My Profile</p>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center text-orange-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/report')}
            className="flex flex-col items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1">Report</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/profile')}
            className="flex flex-col items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
