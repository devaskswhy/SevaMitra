'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

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
      await axios.post(`${API_BASE}/volunteers`, {
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
    <div className="flex h-screen bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Registration</h1>
          <p className="text-gray-600 mb-8">Join us in serving at the Mahakumbh 2025</p>

          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Skills</label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILLS.map((skill) => (
                    <label key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{skill.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
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