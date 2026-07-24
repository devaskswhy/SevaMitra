'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'Volunteers', icon: '👥', path: '/volunteers' },
  { label: 'Zones', icon: '📍', path: '/zones' },
  { label: 'Incidents', icon: '⚠️', path: '/incidents' },
  { label: 'Reports', icon: '📈', path: '/reports' },
  { label: 'Register', icon: '📝', path: '/register' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ background: 'var(--accent-saffron)', color: '#fff', width: '60px', height: '60px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-2xl">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`flex flex-col z-40 fixed top-[56px] h-[calc(100vh-56px)] w-[280px] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{
        background: 'var(--bg-sidebar)',
        borderRight: '2px solid var(--accent-gold)',
        overflowY: 'auto'
      }}>
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200"
                  style={{
                    borderLeft: isActive ? '4px solid var(--accent-saffron)' : '4px solid transparent',
                    background: isActive ? 'rgba(255, 107, 0, 0.2)' : 'transparent',
                    color: 'var(--text-light)'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255, 107, 0, 0.1)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base font-medium" style={{
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-light)',
                    fontFamily: 'var(--font-body)'
                  }}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Volunteer App Link */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(212, 160, 23, 0.3)' }}>
        <button
          onClick={() => router.push('/volunteer')}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200"
          style={{
            borderLeft: '4px solid transparent',
            background: 'transparent',
            color: 'var(--text-light)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span className="text-2xl">📱</span>
          <span className="text-base font-medium" style={{
            color: 'var(--text-light)',
            fontFamily: 'var(--font-body)'
          }}>
            Volunteer App
          </span>
        </button>
      </div>
      </div>
    </>
  );
}
