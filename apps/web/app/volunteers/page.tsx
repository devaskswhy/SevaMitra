'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  reliabilityScore: number;
  status: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/volunteers`);
        setVolunteers(res.data);
      } catch (error) {
        console.error('Failed to fetch volunteers:', error);
      }
    };

    fetchVolunteers();
  }, []);

  const filtered = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Volunteers</h1>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Volunteers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-orange-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Skills</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reliability</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.skills.substring(0, 20)}...</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">{v.reliabilityScore}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        v.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">No volunteers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}