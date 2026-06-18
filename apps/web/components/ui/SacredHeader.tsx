'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  labelHi?: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड' },
  { href: '/volunteers', label: 'Volunteers', labelHi: 'स्वयंसेवक' },
  { href: '/zones', label: 'Zones', labelHi: 'क्षेत्र' },
  { href: '/incidents', label: 'Incidents', labelHi: 'घटनाएँ' },
  { href: '/reports', label: 'Reports', labelHi: 'रिपोर्ट' },
  { href: '/register', label: 'Register', labelHi: 'पंजीकरण' },
];

export default function SacredHeader() {
  const pathname = usePathname();
  const [time, setTime] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  return (
    <>
      <header
        id="sacred-header"
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #1C0A00 0%, #2A1200 50%, #0D1B2A 100%)',
        }}
      >
        {/* ── Main Header Bar ── */}
        <div className="flex items-center justify-between px-4 md:px-6 h-[60px]">
          {/* OM Symbol + Wordmark */}
          <Link href="/dashboard" className="flex items-center gap-3 group no-underline">
            <motion.span
              className="text-3xl select-none"
              style={{
                color: 'var(--gold)',
                fontFamily: 'var(--font-heading)',
                textShadow: '0 0 20px rgba(212, 160, 23, 0.4)',
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              ॐ
            </motion.span>
            <div className="flex flex-col">
              <span
                className="text-lg md:text-xl font-semibold tracking-wide"
                style={{
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                सेवामित्र
              </span>
              <span
                className="text-[10px] tracking-[0.2em] uppercase hidden md:block"
                style={{ color: 'rgba(212, 160, 23, 0.6)' }}
              >
                Mahakumbh 2025
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--gold)' : 'rgba(255, 248, 238, 0.7)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--cream)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'rgba(255, 248, 238, 0.7)';
                  }}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="sacred-nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, var(--saffron), var(--gold), var(--marigold))',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Live Clock + Mobile Menu ── */}
          <div className="flex items-center gap-4">
            {/* Live status dot + clock */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--status-green)', boxShadow: '0 0 8px rgba(46, 125, 50, 0.5)' }}
              />
              <span
                className="text-xs md:text-sm font-mono tracking-wider hidden sm:block"
                style={{ color: 'rgba(255, 248, 238, 0.8)' }}
              >
                {time ? formatTime(time) : '--:--:--'}
              </span>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2 min-h-0 min-w-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <motion.span
                className="block w-5 h-0.5 rounded-full"
                style={{ background: 'var(--gold)' }}
                animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
              />
              <motion.span
                className="block w-5 h-0.5 rounded-full"
                style={{ background: 'var(--gold)' }}
                animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              />
              <motion.span
                className="block w-5 h-0.5 rounded-full"
                style={{ background: 'var(--gold)' }}
                animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
              />
            </button>
          </div>
        </div>

        {/* ── Animated Marigold Divider Line ── */}
        <motion.div
          className="h-[2px] w-full"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--saffron), var(--gold), var(--marigold), var(--gold), var(--saffron), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '200% 50%'],
          }}
          transition={{
            duration: 4,
            ease: 'linear',
            repeat: Infinity,
          }}
        />
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              className="fixed top-[62px] left-0 right-0 z-50 md:hidden"
              style={{
                background: 'linear-gradient(180deg, #1C0A00, #0D1B2A)',
                borderBottom: '1px solid rgba(212, 160, 23, 0.2)',
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="py-2 px-4">
                {navItems.map((item, i) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-3 px-4 rounded-lg no-underline transition-colors"
                        style={{
                          color: isActive ? 'var(--gold)' : 'var(--cream)',
                          background: isActive ? 'rgba(232, 101, 10, 0.1)' : 'transparent',
                          borderLeft: isActive ? '3px solid var(--saffron)' : '3px solid transparent',
                        }}
                      >
                        <span className="font-medium">{item.label}</span>
                        <span
                          className="text-xs opacity-50"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {item.labelHi}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
