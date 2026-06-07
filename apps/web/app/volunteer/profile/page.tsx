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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">Volunteer data not found</p>
          <button
            onClick={() => router.push('/volunteer')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 pb-20">
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.back()}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
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
      <div className="px-4 -mt-16 pb-24">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{volunteer.name}</h1>
              <p className="text-gray-600">{volunteer.email}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  volunteer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {volunteer.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{volunteer.reliabilityScore}</p>
              <p className="text-gray-600 text-sm">Reliability Score</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{volunteer.completedShifts}</p>
              <p className="text-gray-600 text-sm">Completed Shifts</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Phone</span>
              <span className="text-gray-800 font-medium">{volunteer.phone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Age</span>
              <span className="text-gray-800 font-medium">{volunteer.age} years</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Gender</span>
              <span className="text-gray-800 font-medium">{volunteer.gender}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Home State</span>
              <span className="text-gray-800 font-medium">{volunteer.homeState}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Skills</h2>
          {skillsArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillsArray.map((skill, index) => (
                <span key={index} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No skills listed</p>
          )}
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Languages</h2>
          {languagesArray.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languagesArray.map((lang, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {lang}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No languages listed</p>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Certifications</h2>
          {volunteer.certifications ? (
            <p className="text-gray-700">{volunteer.certifications}</p>
          ) : (
            <p className="text-gray-500">No certifications listed</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/volunteer/home')}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🏠</span>
            </div>
            <p className="font-semibold text-gray-800">Home</p>
          </button>
          
          <button
            onClick={() => router.push('/volunteer/report')}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
          >
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="font-semibold text-gray-800">Report Incident</p>
          </button>
        </div>
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
          <button
            onClick={() => router.push('/volunteer/report')}
            className="flex flex-col items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs mt-1">Report</span>
          </button>
          <button className="flex flex-col items-center text-orange-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
