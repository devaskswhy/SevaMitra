'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { statusToBadge } from '@/components/ui/Badge';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Volunteer {
  id: number;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  languages: string;
  skills: string;
  certifications: string;
  homeState: string;
  status: string;
  reliabilityScore: number;
  completedShifts: number;
}

// KNOWN LIMITATION: volunteerId is trusted from localStorage with no
// server-side session verification (see apps/web/app/volunteer/page.tsx).
// A future auth phase should replace this with a verified session token.
export default function VolunteerProfile() {
  const router = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const volunteerId = localStorage.getItem('volunteerId');
    if (!volunteerId) {
      router.push('/volunteer');
      return;
    }
    fetchVolunteer();
  }, [router]);

  const fetchVolunteer = async () => {
    try {
      const volunteerId = localStorage.getItem('volunteerId');
      const response = await axios.get(`${API}/volunteers`);
      const volunteerData = response.data.data.find((v: Volunteer) => v.id === parseInt(volunteerId!));
      setVolunteer(volunteerData || null);
    } catch (error) {
      console.error('Failed to fetch volunteer data:', error);
    } finally {
      setLoading(false);
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

  if (!volunteer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lotus-pattern" style={{ background: 'var(--bg-base)' }}>
        <Card padding="lg" className="text-center" style={{ maxWidth: '480px' }}>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Volunteer data not found</p>
          <Button onClick={() => router.push('/volunteer')} size="lg" style={{ fontFamily: 'var(--font-body)' }}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  const skillsArray = volunteer.skills ? volunteer.skills.split(',').map(s => s.trim()) : [];
  const languagesArray = volunteer.languages ? volunteer.languages.split(',').map(l => l.trim()) : [];

  return (
    <div className="min-h-screen lotus-pattern" style={{ background: 'var(--bg-base)' }}>
      <div className="loading-bar"></div>
      <div className="om-watermark">ॐ</div>
      
      {/* Header */}
      <div className="p-6 pb-20" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))', color: 'var(--bg-base)' }}>
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-lg transition-colors"
            style={{ background: 'var(--overlay-dark)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
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
        {/* Profile Card */}
        <Card padding="md" className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--saffron), var(--gold))' }}>
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{volunteer.name}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>{volunteer.email}</p>
              <div className="mt-2">
                <Badge tone={statusToBadge(volunteer.status).tone}>
                  {volunteer.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--saffron-tint)' }}>
              <p className="text-3xl font-bold" style={{ color: 'var(--saffron)', fontFamily: 'var(--font-body)' }}>{volunteer.reliabilityScore}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reliability Score</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--gold-tint)' }}>
              <p className="text-3xl font-bold" style={{ color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>{volunteer.completedShifts}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed Shifts</p>
            </div>
          </div>
        </Card>

        {/* Personal Info */}
        <Card padding="md" className="mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Personal Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-glow)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{volunteer.phone}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-glow)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Age</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{volunteer.age} years</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--border-glow)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gender</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{volunteer.gender}</span>
            </div>
            <div className="flex justify-between py-2">
              <span style={{ color: 'var(--text-secondary)' }}>Home State</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{volunteer.homeState}</span>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card padding="md" className="mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Skills</h2>
          {skillsArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillsArray.map((skill, index) => (
                <Badge key={index} tone="saffron">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No skills listed</p>
          )}
        </Card>

        {/* Languages */}
        <Card padding="md" className="mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Languages</h2>
          {languagesArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languagesArray.map((lang, index) => (
                <Badge key={index} tone="gold">
                  {lang}
                </Badge>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No languages listed</p>
          )}
        </Card>

        {/* Certifications */}
        <Card padding="md" className="mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Certifications</h2>
          {volunteer.certifications ? (
            <p style={{ color: 'var(--text-primary)' }}>{volunteer.certifications}</p>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No certifications listed</p>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--saffron-tint)' }}>
              <span className="text-2xl">🏠</span>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Home</p>
          </button>
          
          <button
            onClick={() => router.push('/volunteer/report')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--danger-tint)' }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Report Incident</p>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: 'var(--bg-section-alt2)', borderTop: '1px solid var(--border-glow-hover)' }}>
        <div className="flex justify-around">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="flex flex-col items-center transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/report')}
            className="flex flex-col items-center transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-body)' }}>Report</span>
          </button>
          <button className="flex flex-col items-center" style={{ color: 'var(--gold)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium" style={{ fontFamily: 'var(--font-body)' }}>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
