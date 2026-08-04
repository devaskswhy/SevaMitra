'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { initScroll } from '@/lib/scroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WaterRipple from '@/components/WaterRipple';
import FloatingTileField from '@/components/FloatingTileField';

// Registered at module scope (not inside a component effect) so it's
// guaranteed to run before any component's effect creates a
// scrollTrigger-based tween — React mounts child effects (HeroSection)
// before parent effects (Home), so registering only inside Home's effect
// left a window where HeroSection's scroll-linked timeline could be
// created before the plugin existed.
gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════════════
   SECTION WAVE SVG
   ═══════════════════════════════════════════════════════════════ */

function SectionWave() {
  return (
    <div className="section-wave">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill="rgba(232, 101, 10, 0.04)"
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION LABEL MARKER
   ═══════════════════════════════════════════════════════════════ */

function SectionLabel({ number, title }: { number: string; title: string }) {
  return (
    <div
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(255,248,238,0.55)',
        marginBottom: 'var(--space-8)',
      }}
    >
      — {number} {title}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO IMAGES
   ═══════════════════════════════════════════════════════════════ */

const HERO_IMAGES = [
  '/GkxMDfdWoAArpe4-scaled.jpg',
  '/Guide-Kumbh-Mela.jpg',
  '/img29.jpg',
];

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION — Parallax Gallery with Crossfade
   ═══════════════════════════════════════════════════════════════ */

function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  /* ── Image crossfade rotator ── */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* ── GSAP parallax + hero text scroll animations ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parallax: slide the background layer up as user scrolls
    gsap.fromTo(
      '.hero-bg-layer',
      { y: 0 },
      {
        y: '25vh',
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    // Hero text shrink / fade on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=600',
        scrub: 1,
      },
    });
    tl.to('.hero-title', { scale: 0.85, opacity: 0.3, y: -60 })
      .to('.hero-subtitle', { opacity: 0, y: -40 }, '<0.1');

    const heroEl = heroRef.current;
    return () => {
      ScrollTrigger.getAll()
        .filter((t) => t.vars.trigger === '#hero' || t.trigger === heroEl)
        .forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0500',
        overflow: 'hidden',
      }}
    >
      {/* ── Parallax image gallery layer ── */}
      <div
        className="hero-bg-layer"
        style={{
          position: 'absolute',
          top: '-25vh',
          left: 0,
          width: '100%',
          height: '125vh',
          zIndex: 0,
        }}
      >
        {HERO_IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            fill
            priority={i === 0}
            sizes="100vw"
            style={{
              objectFit: 'cover',
              opacity: activeIdx === i ? 0.7 : 0,
              transition: 'opacity 2s ease',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* ── Dark overlay gradient ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(to bottom, rgba(13,5,0,0.15) 0%, rgba(13,5,0,0.4) 50%, rgba(13,5,0,0.92) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hero content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '0 var(--space-6)',
          maxWidth: '800px',
          animation: 'fade-in-up 1s ease-out',
        }}
      >
        <div
          className="hero-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xl)', color: '#E8650A', opacity: 0.7, fontFamily: 'var(--font-heading)' }}>ॐ</span>
          <span style={{ width: 'var(--text-display)', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(232,101,10,0.5))' }} />
          <h1
            style={{
              fontSize: 'var(--text-display)',
              fontFamily: 'var(--font-heading)',
              color: '#FFF8EE',
              lineHeight: 1.1,
              textShadow: '0 4px 40px rgba(232, 101, 10, 0.3)',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            || सेवा ही पूजा है ||
          </h1>
          <span style={{ width: 'var(--text-display)', height: '2px', background: 'linear-gradient(90deg, rgba(232,101,10,0.5), transparent)' }} />
          <span style={{ fontSize: 'var(--text-xl)', color: '#E8650A', opacity: 0.7, fontFamily: 'var(--font-heading)' }}>ॐ</span>
        </div>
        <p
          className="hero-subtitle"
          style={{
            fontSize: 'var(--text-lg)',
            color: 'rgba(255,248,238,0.7)',
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          SevaMitra — Mahakumbh 2025 Volunteer Intelligence Platform
        </p>
      </div>

      {/* ── Image dot indicators ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 'var(--space-2)',
          zIndex: 3,
        }}
      >
        {HERO_IMAGES.map((_, i) => (
          // The visual dot stays small (8-24px) by design — the button
          // itself is a full 48x48 tap target with the dot centered
          // inside it, so the compact carousel look doesn't force a
          // tiny hit area (the exact regression class fixed once before
          // on this same dot row, 69831a2).
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            aria-label={`Show image ${i + 1}`}
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'block',
                width: activeIdx === i ? '24px' : '8px',
                height: '8px',
                borderRadius: activeIdx === i ? '4px' : '50%',
                background: activeIdx === i ? '#E8650A' : 'rgba(255,248,238,0.3)',
                transition: 'width 0.3s ease, background 0.3s ease, border-radius 0.3s ease',
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT — reframed as the login/marketing page.
   All the operational sections that used to live here (stats, zones,
   incidents, volunteers, chatbot, activity feed) have real homes
   elsewhere now: dashboard/page.tsx, zones/page.tsx,
   incidents/page.tsx, volunteers/page.tsx, and the global SevaSahayak
   widget (see layout.tsx). The interactive zone map moved to a new
   standalone route, app/map/page.tsx. This page shows no live/
   operational data — it's the pre-login landing experience.
   ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  // FIXED: force scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Lenis smooth scroll + GSAP ScrollTrigger (HeroSection registers its
  // own scroll-linked animations independently; this just wires up the
  // smooth-scroll feel for the page as a whole).
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = initScroll();
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <WaterRipple />

      {/* OM Watermark */}
      <div className="om-watermark" aria-hidden="true">ॐ</div>

      {/* ═════════════════════════════════════════════════════════
         HERO SECTION — Multi-layer parallax image gallery
         ═════════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ═════════════════════════════════════════════════════════
         FEATURE SHOWCASE — floating previews of every operational
         page, scattered around the section heading on load and
         converging into a settled row as the field is scrolled
         through (same behavior as /hub, shared via
         components/FloatingTileField). Signed-out visitors tapping a
         tile go through Google sign-in straight to that destination.
         ═════════════════════════════════════════════════════════ */}
      <FloatingTileField
        settledLabel="One platform, every function"
        onTileClick={(href) => signIn('google', { callbackUrl: href })}
        heroContent={
          <>
            <SectionLabel number="01" title="EXPLORE" />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                color: '#FFF8EE',
                marginBottom: 'var(--space-4)',
                maxWidth: '640px',
              }}
            >
              Every function, one platform
            </h2>
            <p
              style={{
                fontSize: 'var(--text-lg)',
                color: 'rgba(255,248,238,0.6)',
                maxWidth: '520px',
              }}
            >
              Zones, incidents, volunteers, shifts and reports — sign in to reach the live operations hub.
            </p>
          </>
        }
      />

      {/* ═════════════════════════════════════════════════════════
         ABOUT SECTION
         ═════════════════════════════════════════════════════════ */}
      <section
        id="about"
        style={{
          minHeight: '60vh',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#100600',
          padding: 'var(--space-20) var(--space-6)',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <SectionWave />
          <SectionLabel number="02" title="ABOUT" />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: '#FFF8EE',
              marginBottom: 'var(--space-6)',
            }}
          >
            Sacred Service, Coordinated
          </h2>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: 'rgba(255,248,238,0.6)',
              lineHeight: 1.7,
            }}
          >
            SevaMitra is a real-time volunteer coordination system built for
            Mahakumbh 2025 — managing zones, tracking incidents, and
            deploying sevadars across the world&apos;s largest spiritual
            gathering. Tap any function above to sign in and get started.
          </p>
        </div>
      </section>
    </>
  );
}
