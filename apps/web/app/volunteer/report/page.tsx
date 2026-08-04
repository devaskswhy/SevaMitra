'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@/components/icons';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Zone {
  id: number;
  name: string;
  type: string;
}

// KNOWN LIMITATION: volunteerId is trusted from localStorage with no
// server-side session verification (see apps/web/app/volunteer/page.tsx).
// A future auth phase should replace this with a verified session token.
export default function IncidentReport() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [severity, setSeverity] = useState(3);
  const [zoneId, setZoneId] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
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
      const response = await axios.get(`${API}/zones`);
      setZones(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
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
      await axios.post(`${API}/incidents`, {
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
    } catch {
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
    <div className="min-h-screen lotus-pattern" style={{ background: 'var(--bg-base)' }}>
      <div className="loading-bar"></div>
      <div className="om-watermark">ॐ</div>
      
      {/* Header */}
      <div className="p-6" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))', color: 'var(--bg-base)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-3 rounded-lg transition-colors"
            style={{ background: 'var(--overlay-dark)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-body)' }}>Report Incident</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-24">
        {success ? (
          <Card padding="lg" className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 checkmark-pop"
              style={{ background: 'var(--success-tint)', color: 'var(--status-green)' }}
            >
              <CheckCircleIcon size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--status-green)', fontFamily: 'var(--font-body)' }}>Report Submitted</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Thank you for reporting. Redirecting to home...</p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity Selector */}
            <Card padding="md">
              <label id="severity-level-label" className="block mb-4" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: '600' }}>Severity Level</label>
              <div className="grid grid-cols-5 gap-2" role="group" aria-labelledby="severity-level-label">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    aria-pressed={severity === level}
                    aria-label={`Severity level ${level}`}
                    className={`aspect-square rounded-xl font-bold text-2xl transition-all ${
                      severity === level
                        ? level <= 2
                          ? 'scale-110'
                          : level === 3
                          ? 'scale-110'
                          : 'scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      background: severity === level
                        ? level <= 2
                          ? 'var(--status-green)'
                          : level === 3
                          ? 'var(--status-amber)'
                          : 'var(--status-red)'
                        : 'var(--bg-section-alt)',
                      color: severity === level ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-glow-hover)'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <span className={`font-bold ${
                  severity <= 2 ? 'text-green-400' : severity === 3 ? 'text-amber-400' : 'text-red-400'
                }`} style={{ fontFamily: 'var(--font-body)' }}>
                  {severity <= 2 ? 'LOW' : severity === 3 ? 'MEDIUM' : severity === 4 ? 'HIGH' : 'CRITICAL'}
                </span>
              </div>
            </Card>

            {/* Zone Selector */}
            <Card padding="md">
              <label htmlFor="zone" className="block mb-3" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: '600' }}>Location / Zone</label>
              <select
                id="zone"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-section-alt)',
                  border: '1px solid var(--border-glow-hover)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                required
              >
                <option value="">Select Zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.type})
                  </option>
                ))}
              </select>
            </Card>

            {/* Incident Type */}
            <Card padding="md">
              <label htmlFor="incident-type" className="block mb-3" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: '600' }}>Incident Type</label>
              <select
                id="incident-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-section-alt)',
                  border: '1px solid var(--border-glow-hover)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                required
              >
                <option value="">Select Type</option>
                {incidentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </Card>

            {/* Description */}
            <Card padding="md">
              <label htmlFor="description" className="block mb-3" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)', fontWeight: '600' }}>Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
                className="w-full min-h-32 resize-none"
                style={{
                  background: 'var(--bg-section-alt)',
                  border: '1px solid var(--border-glow-hover)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                required
              />
            </Card>

            {error && (
              <div role="alert" className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--danger-tint)', border: '1px solid var(--status-red)', color: 'var(--status-red)' }}>
                <XCircleIcon size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} size="lg" className="w-full" style={{ fontFamily: 'var(--font-body)' }}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'var(--bg-section-alt2)', borderTop: '1px solid var(--border-glow-hover)' }}>
        <div className="flex justify-around">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="flex flex-col items-center transition-colors"
            style={{ color: 'var(--text-secondary)', minWidth: 'var(--tap-target)' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>Home</span>
          </button>
          <button className="flex flex-col items-center" style={{ color: 'var(--gold)', minWidth: 'var(--tap-target)' }} aria-current="page">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Report</span>
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
