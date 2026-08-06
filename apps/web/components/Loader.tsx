"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import gsap from "gsap";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC PRELOADER — SevaMitra
   Full-screen sacred loading ritual with OM symbol,
   randomised progress counter, and GSAP curtain wipe.
   ═══════════════════════════════════════════════════════════════ */

function startCounter() {
  let progress = 0;
  const start = Date.now();
  const minDuration = 2200;

  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);

      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        // 300ms dwell then curtain wipe
        setTimeout(() => {
          gsap.to('.loader-overlay', {
            yPercent: -100,
            duration: 1.1,
            ease: 'power4.inOut',
            onComplete: () => {
              const el = document.querySelector('.loader-overlay') as HTMLElement;
              if (el) el.style.display = 'none';
            }
          });
        }, 300);
      }, remaining);
    }

    const counter = document.querySelector('.loader-counter');
    if (counter) counter.textContent = Math.floor(progress) + '%';
  }, 120);
}

export default function Loader() {
  const { data: session } = useSession();
  // First name from the signed-in Google account when there is one (admin/
  // coordinator flow); everyone else (signed-out visitors, the volunteer
  // phone+OTP persona, which never populates this NextAuth session) gets
  // the same generic greeting as before.
  const firstName = session?.user?.name?.split(' ')[0];
  const greeting = firstName ? `Namaste, ${firstName}` : 'Namaste';

  useEffect(() => {
    // Always show full loader on every visit
    // To re-enable skip: uncomment sessionStorage lines below
    // const seen = sessionStorage.getItem('seen_loader');
    // if (seen) { setFastFade(true); return; }
    // sessionStorage.setItem('seen_loader', 'true');

    // Reset state so animation always starts fresh
    gsap.set('.loader-om', { scale: 0, opacity: 0 });
    gsap.set('.loader-greeting', { opacity: 0, y: 8 });
    gsap.set('.loader-counter', { opacity: 0 });
    gsap.set('.loader-overlay', { yPercent: 0, display: 'flex' });

    // OM symbol scale-in with glow
    gsap.to('.loader-om', {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.7)',
      onComplete: () => {
        // Greeting + counter fade in after OM appears
        gsap.to('.loader-greeting', { opacity: 1, y: 0, duration: 0.4 });
        gsap.to('.loader-counter', { opacity: 1, duration: 0.3 });
        startCounter();
      }
    });
  }, []);

  return (
    <div
      className="loader-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0500",
        overflow: "hidden",
      }}
    >
      {/* ── Subtle radial glow behind OM ─────────────────────── */}
      <div
        style={{
          position: "absolute",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,101,10,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── OM Symbol ────────────────────────────────────────── */}
      <span
        className="loader-om"
        style={{
          fontFamily: "var(--font-tiro), 'Tiro Devanagari Sanskrit', serif",
          fontSize: "48px",
          color: "#E8650A",
          lineHeight: 1,
          opacity: 0,
          transform: "scale(0)",
          userSelect: "none",
          textShadow: "0 0 40px rgba(232,101,10,0.25)",
        }}
      >
        ॐ
      </span>

      {/* ── Personalized greeting ─────────────────────────────── */}
      <p
        className="loader-greeting"
        style={{
          marginTop: "16px",
          fontFamily: "var(--font-heading)",
          fontSize: "var(--text-lg)",
          color: "#FFF8EE",
          opacity: 0,
          userSelect: "none",
        }}
      >
        {greeting}
      </p>

      {/* ── Progress Counter ─────────────────────────────────── */}
      <span
        className="loader-counter"
        style={{
          marginTop: "20px",
          fontSize: "13px",
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontWeight: 400,
          color: "rgba(255,248,238,0.4)",
          letterSpacing: "0.2em",
          fontVariantNumeric: "tabular-nums",
          opacity: 0,
          userSelect: "none",
        }}
      >
        0%
      </span>
    </div>
  );
}
