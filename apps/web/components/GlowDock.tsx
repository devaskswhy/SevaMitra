'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  GridIcon,
  UsersIcon,
  MapPinIcon,
  MapIcon,
  AlertTriangleIcon,
  ChartIcon,
  CalendarIcon,
  FileTextIcon,
  SmartphoneIcon,
  HomeIcon,
  CloseIcon,
  MenuIcon,
  type IconProps,
} from '@/components/icons';

interface DockItem {
  label: string;
  icon: (props: IconProps) => React.JSX.Element;
  path: string;
}

const DOCK_ITEMS: DockItem[] = [
  { label: 'Hub', icon: HomeIcon, path: '/hub' },
  { label: 'Dashboard', icon: GridIcon, path: '/dashboard' },
  { label: 'Volunteers', icon: UsersIcon, path: '/volunteers' },
  { label: 'Zones', icon: MapPinIcon, path: '/zones' },
  { label: 'Zone Map', icon: MapIcon, path: '/map' },
  { label: 'Incidents', icon: AlertTriangleIcon, path: '/incidents' },
  { label: 'Reports', icon: ChartIcon, path: '/reports' },
  { label: 'Shifts', icon: CalendarIcon, path: '/shifts' },
  { label: 'Register', icon: FileTextIcon, path: '/register' },
  { label: 'Volunteer App', icon: SmartphoneIcon, path: '/volunteer' },
];

/* ═══════════════════════════════════════════════════════════════
   GLOW DOCK — the sidebar's replacement. A compact row of flat,
   icon-only buttons, fixed bottom-left (mirrors the reference site's
   minimal-chrome navigation instead of a boxed sidebar list). Bottom-
   *left* specifically because SevaSahayak's own toggle already owns
   bottom-right (see the exact same collision Sidebar's old mobile
   button had, fixed in the Phase 11 QA pass). Deliberately no drop-
   shadow glow — just a flat saffron fill on the active page.
   ═══════════════════════════════════════════════════════════════ */
export default function GlowDock() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (path: string) => {
    setMobileOpen(false);
    router.push(path);
  };

  const dockButtons = (size: number) =>
    DOCK_ITEMS.map((item) => {
      const isActive = pathname === item.path;
      return (
        <button
          key={item.path}
          onClick={() => go(item.path)}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
          title={item.label}
          className="glow-dock-item"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: isActive ? 'var(--saffron)' : 'transparent',
            border: isActive ? '1px solid var(--saffron)' : '1px solid transparent',
            color: isActive ? '#0D0500' : 'rgba(255,248,238,0.75)',
            transition: 'background var(--duration-base) var(--ease-sacred), color var(--duration-base) var(--ease-sacred), transform var(--duration-base) var(--ease-sacred)',
          }}
        >
          <item.icon size={Math.round(size * 0.44)} />
        </button>
      );
    });

  return (
    <>
      {/* ── Desktop: horizontal glowing dock, bottom-left ── */}
      <nav
        aria-label="Function navigation"
        className="hidden md:flex"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 50,
          gap: 'var(--space-2)',
          padding: 'var(--space-2)',
          borderRadius: '999px',
          background: 'rgba(13,5,0,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {dockButtons(44)}
      </nav>

      {/* ── Mobile: single toggle that reveals the same dock as a
           bottom sheet — same interaction pattern the old Sidebar's
           mobile toggle used, just without the full-height nav list ── */}
      <button
        className="md:hidden fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ background: 'var(--accent-saffron)', color: '#fff', width: '60px', height: '60px' }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {mobileOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed bottom-24 left-6 right-6 flex flex-wrap gap-3 p-4 rounded-2xl"
            style={{
              background: 'rgba(13,5,0,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {dockButtons(48)}
          </div>
        </div>
      )}
    </>
  );
}
