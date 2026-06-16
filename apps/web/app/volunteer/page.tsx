'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

export default function VolunteerLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setShowOtp(true);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API}/volunteers`);
      const vols = response.data.data || response.data;
      const volunteer = vols.find((v: { phone: string; id: number; name: string }) => v.phone === `+91${phone}`);
      
      if (volunteer) {
        localStorage.setItem('volunteerId', volunteer.id.toString());
        localStorage.setItem('volunteerName', volunteer.name);
        router.push('/volunteer/home');
      } else {
        setError('Volunteer not found. Please register first.');
      }
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lotus-pattern flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="loading-bar"></div>
      <div className="om-watermark">ॐ</div>
      
      <div className="card p-8 w-full max-w-md" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #FF6B00, #D4A017)' }}>
            <span className="text-5xl">🙏</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            SevaMitra Volunteer
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Login to access your dashboard
          </p>
        </div>

        {!showOtp ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block mb-2" style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                Phone Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-lg" style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', color: 'var(--accent-gold)' }}>
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 rounded-r-lg text-lg"
                  maxLength={10}
                  inputMode="numeric"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(183, 28, 28, 0.08)', border: '1px solid #B71C1C', color: '#B71C1C' }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                color: '#fff',
                border: 'none',
                fontSize: '18px'
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block mb-2" style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full text-lg text-center tracking-widest"
                maxLength={6}
                inputMode="numeric"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.5em'
                }}
              />
              <p className="text-sm mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Demo: Any 6-digit number works
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(183, 28, 28, 0.08)', border: '1px solid #B71C1C', color: '#B71C1C' }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #D4A017)',
                color: '#fff',
                border: 'none',
                fontSize: '18px'
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setOtp('');
                setError('');
              }}
              className="w-full px-6 py-4 rounded-lg font-medium transition-all"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            New volunteer?{' '}
            <a href="/register" className="font-bold hover:underline" style={{ color: 'var(--accent-saffron)' }}>
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
