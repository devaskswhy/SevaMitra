'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/volunteers', label: 'Volunteers', icon: '👥' },
  { href: '/zones', label: 'Zones', icon: '🗺️' },
  { href: '/incidents', label: 'Incidents', icon: '⚠️' },
  { href: '/register', label: 'Register', icon: '📝' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white shadow-lg h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-orange-600">Mahakumbh Seva</h2>
        <p className="text-sm text-gray-500">Volunteer Management</p>
      </div>

      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-orange-100 text-orange-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}