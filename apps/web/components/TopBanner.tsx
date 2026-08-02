'use client';

import { useState, useEffect } from 'react';

export default function TopBanner() {
  // Seeded as null rather than `new Date()` — evaluating the clock at
  // module-render time meant the SSR timestamp and the client's first
  // hydration pass never matched, causing a React hydration error on
  // every page that renders this component. Only set a real value once
  // mounted client-side.
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
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
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, #3D1A00 100%)',
      borderBottom: '2px solid var(--accent-gold)',
      height: '56px'
    }}>
      {/* OM Symbol */}
      <div className="flex items-center gap-3">
        <span className="font-bold" style={{ fontSize: '28px', color: 'var(--accent-gold)', fontFamily: "'Tiro Devanagari Sanskrit', serif" }}>ॐ</span>
      </div>

      {/* Center Title */}
      <h1 className="font-bold text-sm md:text-xl truncate flex-1 text-center px-2" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-body)', fontWeight: '600' }}>
        SevaMitra <span className="hidden md:inline">— Mahakumbh 2025</span>
      </h1>

      {/* Live Clock */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4CAF50' }} />
        <span className="font-semibold text-xs md:text-base hidden sm:inline-block" style={{ color: 'var(--text-light)', fontFamily: 'var(--font-body)' }}>
          {time ? formatTime(time) : '--:--:--'}
        </span>
      </div>
    </div>
  );
}
