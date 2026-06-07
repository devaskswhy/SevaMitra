'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

interface Zone {
  id: number;
  name: string;
  type: string;
}

export default function IncidentReport() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [severity, setSeverity] = useState(3);
  const [zoneId, setZoneId] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    if (!volunteerId) {
      router.push('/volunteer');
      return;
    }
    fetchZones();
  }, [router]);

  const fetchZones = async () => {
    try {
      const response = await axios.get(`${API_BASE}/zones`);
      setZones(response.data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneId || !type || !description) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const volunteerId = localStorage.getItem('volunteerId');
      await axios.post(`${API_BASE}/incidents`, {
        zoneId: parseInt(zoneId),
        reportedBy: volunteerId,
        severity,
        type,
        description,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/volunteer/home');
      }, 2000);
    } catch (error) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const incidentTypes = [
    'CROWD_CRUSH',
    'MEDICAL_EMERGENCY',
    'FIRE',
    'FIGHT',
    'MISSING_PERSON',
    'THEFT',
    'WATER_ISSUE',
    'INFRASTRUCTURE',
    'OTHER',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Report Incident</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Report Submitted</h2>
            <p className="text-green-600">Thank you for reporting. Redirecting to home...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-gray-800 font-bold mb-4">Severity Level</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`aspect-square rounded-xl font-bold text-2xl transition-all ${
                      severity === level
                        ? level <= 2
                          ? 'bg-green-500 text-white scale-110'
                          : level === 3
                          ? 'bg-amber-500 text-white scale-110'
                          : 'bg-red-500 text-white scale-110'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <span className={`font-bold ${
                  severity <= 2 ? 'text-green-600' : severity === 3 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {severity <= 2 ? 'LOW' : severity === 3 ? 'MEDIUM' : severity === 4 ? 'HIGH' : 'CRITICAL'}
                </span>
              </div>
            </div>

            {/* Zone Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-gray-800 font-bold mb-3">Location / Zone</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg bg-white"
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Type */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-gray-800 font-bold mb-3">Incident Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg bg-white"
                required
              >
                <option value="">Select Type</option>
                {incidentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-gray-800 font-bold mb-3">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg min-h-32 resize-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="flex flex-col items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center text-orange-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Report</span>
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
