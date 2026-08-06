'use client';

import { useEffect, useRef, useState } from 'react';
import {
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
  id: string;
}

const DOCK_ITEMS: DockItem[] = [
  { label: 'Home', icon: HomeIcon, id: 'top' },
  { label: 'Zones', icon: MapPinIcon, id: 'zones' },
  { label: 'Zone Map', icon: MapIcon, id: 'zone-map' },
  { label: 'Incidents', icon: AlertTriangleIcon, id: 'incidents' },
  { label: 'Volunteers', icon: UsersIcon, id: 'volunteers' },
  { label: 'Reports', icon: ChartIcon, id: 'reports' },
  { label: 'Shifts', icon: CalendarIcon, id: 'shifts' },
  { label: 'Register', icon: FileTextIcon, id: 'register' },
];

/* ═══════════════════════════════════════════════════════════════
   SCROLL DOCK — GlowDock's replacement for the single-scroll /hub.
   Same visual chrome (bottom-left, flat icon row, no glow), but
   items scrollIntoView a section instead of router.push-ing a
   route, and the active item is whichever section is most in view
   (IntersectionObserver) instead of usePathname(). "Volunteer App"
   is the one item that still navigates for real — /volunteer is a
   separate flow, not a section of this page.
   ═══════════════════════════════════════════════════════════════ */
export default function ScrollDock() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState('top');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = DOCK_ITEMS.map((item) => item.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const visibleRatios = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        let bestId = activeId;
        let bestRatio = 0;
        visibleRatios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        if (bestRatio > 0) setActiveId(bestId);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dockButtons = (size: number) =>
    DOCK_ITEMS.map((item) => {
      const isActive = activeId === item.id;
      return (
        <button
          key={item.id}
          onClick={() => go(item.id)}
          aria-label={item.label}
          aria-current={isActive ? 'true' : undefined}
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

  const volunteerAppButton = (size: number) => (
    <a
      href="/volunteer"
      aria-label="Volunteer App"
      title="Volunteer App"
      className="glow-dock-item"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'transparent',
        border: '1px solid transparent',
        color: 'rgba(255,248,238,0.75)',
        transition: 'background var(--duration-base) var(--ease-sacred), color var(--duration-base) var(--ease-sacred), transform var(--duration-base) var(--ease-sacred)',
      }}
    >
      <SmartphoneIcon size={Math.round(size * 0.44)} />
    </a>
  );

  return (
    <>
      {/* ── Desktop: horizontal dock, bottom-left ── */}
      <nav
        aria-label="Section navigation"
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
        {volunteerAppButton(44)}
      </nav>

      {/* ── Mobile: single toggle that reveals the same dock as a
           bottom sheet — mirrors GlowDock's mobile pattern ── */}
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
            {volunteerAppButton(48)}
          </div>
        </div>
      )}
    </>
  );
}
