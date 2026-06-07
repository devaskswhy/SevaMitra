'use client';

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
  { label: 'Allocate', icon: '🎯', path: '/allocate' },
  { label: 'Reports', icon: '📈', path: '/reports' },
  { label: 'Register', icon: '📝', path: '/register' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-14 bottom-0 w-70 flex flex-col z-40" style={{
      width: '280px',
      background: '#1A1228',
      borderRight: '2px solid #FFD700'
    }}>
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-orange-500/10"
                  style={{
                    borderLeft: isActive ? '4px solid #FF6B00' : '4px solid transparent',
                    background: isActive ? 'rgba(255, 107, 0, 0.15)' : 'transparent'
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-base font-medium" style={{
                    color: isActive ? '#FFD700' : '#F5F0E8',
                    fontFamily: 'Inter, sans-serif'
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
      <div className="p-4 border-t border-orange-500/20">
        <button
          onClick={() => router.push('/volunteer')}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-orange-500/10"
          style={{
            borderLeft: '4px solid transparent',
            background: 'transparent'
          }}
        >
          <span className="text-2xl">📱</span>
          <span className="text-base font-medium" style={{
            color: '#F5F0E8',
            fontFamily: 'Inter, sans-serif'
          }}>
            Volunteer App
          </span>
        </button>
      </div>
    </div>
  );
}
