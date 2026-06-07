'use client';

import { useState, useEffect } from 'react';

export default function TopBanner() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50" style={{
      background: 'linear-gradient(90deg, #FF6B00, #FFD700)',
      color: '#0D0A1A'
    }}>
      {/* OM Symbol */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>ॐ</span>
      </div>

      {/* Center Title */}
      <h1 className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
        SevaMitra — Mahakumbh 2025
      </h1>

      {/* Live Clock */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
        <span className="text-lg font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
}
