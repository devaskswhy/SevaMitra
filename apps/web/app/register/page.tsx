'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

const SKILLS = [
  'first_aid',
  'crowd_management',
  'language_hindi',
  'language_english',
  'language_bengali',
  'medical',
  'technical',
  'general',
];

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/volunteers`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        skills: formData.skills.join(','),
        aadhaarHash: 'hash_' + Date.now(),
        age: 25,
        gender: 'M',
        homeState: 'Uttar Pradesh',
      });

      setMessage('✅ Registration successful! Thank you for volunteering.');
      setFormData({ name: '', email: '', phone: '', skills: [] });
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      setMessage(`❌ Registration failed: ${axiosError.response?.data?.error || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Volunteer Registration</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Join us in serving at the Mahakumbh 2025</p>

          <div className="card rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block mb-3" style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Skills</label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILLS.map((skill) => (
                    <label key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--accent-saffron)' }}
                      />
                      <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{skill.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className="p-4 rounded-lg" style={{
                  background: message.includes('✅') ? 'rgba(46, 125, 50, 0.1)' : 'rgba(183, 28, 28, 0.1)',
                  color: message.includes('✅') ? '#2E7D32' : '#B71C1C',
                  border: `1px solid ${message.includes('✅') ? '#2E7D32' : '#B71C1C'}`
                }}>
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 font-semibold rounded-lg transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #D4A017)', color: '#fff', border: 'none' }}
              >
                {loading ? 'Registering...' : 'Register as Volunteer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
