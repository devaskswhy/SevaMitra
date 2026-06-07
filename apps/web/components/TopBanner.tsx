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
    <div className="flex items-center justify-between px-6" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: '#1A1228',
      color: '#FFD700',
      borderBottom: '1px solid rgba(255, 165, 0, 0.4)',
      height: '56px'
    }}>
      {/* OM Symbol */}
      <div className="flex items-center gap-3">
        <span className="font-bold" style={{ fontSize: '28px', color: '#FFD700', fontFamily: 'Poppins, sans-serif' }}>ॐ</span>
      </div>

      {/* Center Title */}
      <h1 className="font-bold" style={{ fontSize: '20px', color: '#FFD700', fontFamily: 'Poppins, sans-serif', fontWeight: '600' }}>
        SevaMitra — Mahakumbh 2025
      </h1>

      {/* Live Clock */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-semibold" style={{ fontSize: '16px', color: '#FF6B00', fontFamily: 'Inter, sans-serif' }}>
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
}
