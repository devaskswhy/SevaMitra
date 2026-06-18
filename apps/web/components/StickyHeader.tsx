'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface SearchResult {
  id: string;
  label: string;
  category: 'Zones' | 'Volunteers' | 'Incidents';
  sectionId: string;
  icon: string;
}

interface StickyHeaderProps {
  zones: Array<{ id: number; name: string; type: string }>;
  volunteers: Array<{ id: number; name: string; skills: string }>;
  incidents: Array<{ id: number; type: string; description: string; severity: number }>;
  activeVolunteerCount: number;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function StickyHeader({
  zones,
  volunteers,
  incidents,
  activeVolunteerCount,
}: StickyHeaderProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll listener — collapse wordmark after hero
  useEffect(() => {
    const handleScroll = () => {
      setIsCollapsed(window.scrollY > window.innerHeight * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build searchable index
  const searchIndex = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    zones.forEach((z) => {
      results.push({ id: `zone-${z.id}`, label: z.name, category: 'Zones', sectionId: 'zones', icon: '📍' });
    });
    volunteers.forEach((v) => {
      results.push({ id: `vol-${v.id}`, label: v.name, category: 'Volunteers', sectionId: 'volunteers', icon: '👤' });
    });
    incidents.forEach((i) => {
      results.push({ id: `inc-${i.id}`, label: `${i.type}: ${i.description.substring(0, 40)}`, category: 'Incidents', sectionId: 'incidents', icon: '⚠️' });
    });
    return results;
  }, [zones, volunteers, incidents]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matched = searchIndex.filter((r) => r.label.toLowerCase().includes(q));

    // Group by category, max 3 per category
    const grouped: Record<string, SearchResult[]> = {};
    for (const r of matched) {
      if (!grouped[r.category]) grouped[r.category] = [];
      if (grouped[r.category].length < 3) grouped[r.category].push(r);
    }
    return grouped;
  }, [searchQuery, searchIndex]);

  const hasResults = Object.keys(filteredResults).length > 0;

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

  return (
    <header
      id="sticky-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(28, 10, 0, 0.75)',
        borderBottom: '1px solid rgba(232, 101, 10, 0.2)',
        transition: 'all 300ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: isCollapsed ? '52px' : '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'height 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* ── Left: Wordmark ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'all 300ms ease',
          }}
          onClick={() => scrollToSection('hero')}
        >
          <span
            style={{
              fontSize: isCollapsed ? '24px' : '28px',
              color: '#E8650A',
              fontFamily: 'var(--font-heading)',
              textShadow: '0 0 24px rgba(232, 101, 10, 0.3)',
              transition: 'font-size 300ms ease',
            }}
          >
            ॐ
          </span>
          <div
            style={{
              overflow: 'hidden',
              maxWidth: isCollapsed ? '0px' : '160px',
              opacity: isCollapsed ? 0 : 1,
              transition: 'max-width 300ms ease, opacity 200ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFF8EE',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.2,
              }}
            >
              SevaMitra
            </div>
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: '#D4A017',
                lineHeight: 1.2,
              }}
            >
              Mahakumbh 2025
            </div>
          </div>
        </div>

        {/* ── Center: Smart Search ── */}
        <div
          ref={searchRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            flexShrink: 1,
          }}
        >
          <div style={{ position: 'relative' }}>
            {/* Search icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,248,238,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              placeholder="Search zones, volunteers, incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                width: '100%',
                height: '36px',
                minHeight: '36px',
                padding: '0 14px 0 38px',
                borderRadius: '18px',
                border: '1px solid rgba(232, 101, 10, 0.2)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#FFF8EE',
                fontSize: '13px',
                backdropFilter: 'blur(8px)',
                outline: 'none',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                ...(isSearchFocused
                  ? {
                      borderColor: 'rgba(232, 101, 10, 0.5)',
                      boxShadow: '0 0 0 3px rgba(232, 101, 10, 0.1)',
                    }
                  : {}),
              }}
            />
          </div>

          {/* ── Dropdown ── */}
          {isSearchFocused && searchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'rgba(13, 5, 0, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(232, 101, 10, 0.2)',
                borderRadius: '12px',
                padding: '8px 0',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {!hasResults ? (
                <div
                  style={{
                    padding: '20px 16px',
                    textAlign: 'center',
                    color: 'rgba(255,248,238,0.4)',
                    fontSize: '13px',
                  }}
                >
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                Object.entries(filteredResults).map(([category, results]) => (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      style={{
                        padding: '6px 16px 4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                        color: 'rgba(255,248,238,0.3)',
                      }}
                    >
                      {category}
                    </div>
                    {results.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => scrollToSection(r.sectionId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'transparent',
                          color: '#FFF8EE',
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'left' as const,
                          transition: 'background 150ms ease',
                          minHeight: '36px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(232,101,10,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{r.icon}</span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {r.label}
                        </span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '10px',
                            color: 'rgba(255,248,238,0.25)',
                            flexShrink: 0,
                          }}
                        >
                          → #{r.sectionId}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right: Clock + Volunteer Count ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          {/* Online volunteer count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(29, 185, 84, 0.12)',
              border: '1px solid rgba(29, 185, 84, 0.2)',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#1DB954',
                boxShadow: '0 0 8px rgba(29,185,84,0.5)',
                animation: 'sacred-pulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1DB954',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {activeVolunteerCount}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: 'rgba(29,185,84,0.7)',
                display: 'none',
              }}
              className="hidden sm:inline-block"
            >
              online
            </span>
          </div>

          {/* Clock */}
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              color: 'rgba(255, 248, 238, 0.6)',
              fontVariantNumeric: 'tabular-nums',
            }}
            className="hidden sm:inline-block"
          >
            {time ? formatTime(time) : '--:--:--'}
          </span>
        </div>
      </div>
    </header>
  );
}
