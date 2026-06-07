'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBanner from '@/components/TopBanner';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

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
        const res = await axios.get(`${API}/volunteers`);
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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <TopBanner />
      <Sidebar />
      <div className="md:ml-[280px] pt-[56px] transition-all duration-300 min-h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Volunteers</h1>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Volunteers Table */}
          <div className="card rounded-lg overflow-hidden">
            <table className="w-full">
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Skills</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Reliability</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: 'var(--accent-deep)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, index) => (
                  <tr key={v.id} style={{ background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.name}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.email}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{v.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(255, 107, 0, 0.12)', color: 'var(--accent-saffron)' }}>
                        {v.skills.substring(0, 20)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>{v.reliabilityScore}%</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold text-white" style={{
                        background: v.status === 'ACTIVE' ? '#2E7D32' : '#B71C1C'
                      }}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No volunteers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
