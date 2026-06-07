'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

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
      const response = await axios.get(`${API_BASE}/volunteers`);
      const volunteerData = response.data.find((v: Volunteer) => v.id === parseInt(volunteerId!));
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
      <div className="min-h-screen flex items-center justify-center lotus-pattern" style={{ background: '#0D0A1A' }}>
        <div className="saffron-spinner"></div>
        <div className="loading-bar"></div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 lotus-pattern" style={{ background: '#0D0A1A' }}>
        <div className="card p-8 text-center" style={{ maxWidth: '480px' }}>
          <p className="mb-4" style={{ color: '#C4B49A' }}>Volunteer data not found</p>
          <button
            onClick={() => router.push('/volunteer')}
            className="px-6 py-4 rounded-lg font-bold transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF6B00, #FFD700)',
              color: '#0D0A1A',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const skillsArray = volunteer.skills ? volunteer.skills.split(',').map(s => s.trim()) : [];
  const languagesArray = volunteer.languages ? volunteer.languages.split(',').map(l => l.trim()) : [];

  return (
    <div className="min-h-screen lotus-pattern" style={{ background: '#0D0A1A' }}>
      <div className="loading-bar"></div>
      <div className="om-watermark">ॐ</div>
      
      {/* Header */}
      <div className="p-6 pb-20" style={{ background: 'linear-gradient(135deg, #FF6B00, #FFD700)', color: '#0D0A1A' }}>
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-lg transition-colors"
            style={{ background: 'rgba(13, 10, 26, 0.2)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="p-3 rounded-lg transition-colors"
            style={{ background: 'rgba(13, 10, 26, 0.2)' }}
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
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B00, #FFD700)' }}>
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>{volunteer.name}</h1>
              <p style={{ color: '#C4B49A' }}>{volunteer.email}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  volunteer.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {volunteer.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255, 107, 0, 0.1)' }}>
              <p className="text-3xl font-bold" style={{ color: '#FF6B00', fontFamily: 'Poppins, sans-serif' }}>{volunteer.reliabilityScore}</p>
              <p className="text-sm" style={{ color: '#C4B49A' }}>Reliability Score</p>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255, 215, 0, 0.1)' }}>
              <p className="text-3xl font-bold" style={{ color: '#FFD700', fontFamily: 'Poppins, sans-serif' }}>{volunteer.completedShifts}</p>
              <p className="text-sm" style={{ color: '#C4B49A' }}>Completed Shifts</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Personal Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
              <span style={{ color: '#C4B49A' }}>Phone</span>
              <span className="font-medium" style={{ color: '#F5F0E8' }}>{volunteer.phone}</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
              <span style={{ color: '#C4B49A' }}>Age</span>
              <span className="font-medium" style={{ color: '#F5F0E8' }}>{volunteer.age} years</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255, 165, 0, 0.2)' }}>
              <span style={{ color: '#C4B49A' }}>Gender</span>
              <span className="font-medium" style={{ color: '#F5F0E8' }}>{volunteer.gender}</span>
            </div>
            <div className="flex justify-between py-2">
              <span style={{ color: '#C4B49A' }}>Home State</span>
              <span className="font-medium" style={{ color: '#F5F0E8' }}>{volunteer.homeState}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Skills</h2>
          {skillsArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillsArray.map((skill, index) => (
                <span key={index} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'rgba(255, 107, 0, 0.2)', color: '#FF6B00' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#C4B49A' }}>No skills listed</p>
          )}
        </div>

        {/* Languages */}
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Languages</h2>
          {languagesArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languagesArray.map((lang, index) => (
                <span key={index} className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'rgba(255, 215, 0, 0.2)', color: '#FFD700' }}>
                  {lang}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: '#C4B49A' }}>No languages listed</p>
          )}
        </div>

        {/* Certifications */}
        <div className="card p-6 mb-4">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Certifications</h2>
          {volunteer.certifications ? (
            <p style={{ color: '#F5F0E8' }}>{volunteer.certifications}</p>
          ) : (
            <p style={{ color: '#C4B49A' }}>No certifications listed</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255, 107, 0, 0.1)' }}>
              <span className="text-2xl">🏠</span>
            </div>
            <p className="font-semibold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Home</p>
          </button>
          
          <button
            onClick={() => router.push('/volunteer/report')}
            className="card p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(244, 67, 54, 0.1)' }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="font-semibold" style={{ color: '#F5F0E8', fontFamily: 'Poppins, sans-serif' }}>Report Incident</p>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4" style={{ background: '#211835', borderTop: '1px solid rgba(255, 165, 0, 0.3)' }}>
        <div className="flex justify-around">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="flex flex-col items-center transition-colors"
            style={{ color: '#C4B49A' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/volunteer/report')}
            className="flex flex-col items-center transition-colors"
            style={{ color: '#C4B49A' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Report</span>
          </button>
          <button className="flex flex-col items-center" style={{ color: '#FFD700' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
