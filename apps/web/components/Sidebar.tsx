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
  { label: 'Reports', icon: '📈', path: '/reports' },
  { label: 'Register', icon: '📝', path: '/register' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col z-40" style={{
      position: 'fixed',
      left: 0,
      top: '56px',
      width: '280px',
      height: 'calc(100vh - 56px)',
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
                    fontFamily: 'Poppins, sans-serif'
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
            fontFamily: 'Poppins, sans-serif'
          }}>
            Volunteer App
          </span>
        </button>
      </div>
    </div>
  );
}
