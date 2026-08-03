import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const EASE = 'power3.inOut';
export const DUR = { fast: 0.3, base: 0.6, slow: 1.1 };

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 1.8,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/**
 * Staggered scroll/mount reveal for a grid of cards — the same
 * fromTo(opacity/y, stagger, ScrollTrigger start:'top 85%') pattern the
 * old page.tsx stats section used. `ready` gates the effect until the
 * matched elements actually exist in the DOM (feature pages fetch data
 * client-side, so the grid renders after an initial loading state).
 */
export function useStaggerReveal(selector: string, ready: boolean = true) {
  useEffect(() => {
    if (typeof window === 'undefined' || !ready) return;
    gsap.registerPlugin(ScrollTrigger);
    const els = gsap.utils.toArray<HTMLElement>(selector);
    if (els.length === 0) return;

    const tween = gsap.fromTo(
      els,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: DUR.slow,
        ease: EASE,
        stagger: 0.1,
        scrollTrigger: {
          trigger: els[0],
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [selector, ready]);
}
