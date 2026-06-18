'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  startTime: number;
}

const RIPPLE_DURATION = 600;
const MAX_RADIUS = 80;
const MAX_RIPPLES = 15;
const STROKE_COLOR = 'rgba(232, 101, 10, 0.4)';
const STROKE_WIDTH = 1.5;

export default function WaterRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameRef = useRef<number>(0);

  const addRipple = useCallback((x: number, y: number) => {
    const ripples = ripplesRef.current;
    if (ripples.length >= MAX_RIPPLES) {
      ripples.shift();
    }
    ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: MAX_RADIUS,
      opacity: 0.3,
      startTime: performance.now(),
    });
  }, []);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to window
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ripples = ripplesRef.current;
    const alive: Ripple[] = [];

    for (const ripple of ripples) {
      const elapsed = time - ripple.startTime;
      const progress = Math.min(elapsed / RIPPLE_DURATION, 1);

      if (progress >= 1) continue;

      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentRadius = Math.max(0, easedProgress * ripple.maxRadius);
      const currentOpacity = ripple.opacity * (1 - progress);

      if (currentRadius <= 0) continue;

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = STROKE_COLOR.replace('0.4', String(currentOpacity));
      ctx.lineWidth = STROKE_WIDTH;
      ctx.stroke();

      // Second ring slightly behind
      if (currentRadius > 15) {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, currentRadius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = STROKE_COLOR.replace('0.4', String(currentOpacity * 0.5));
        ctx.lineWidth = STROKE_WIDTH * 0.75;
        ctx.stroke();
      }

      alive.push(ripple);
    }

    ripplesRef.current = alive;
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Throttled mousemove — add ripple every 80ms max
    let lastRippleTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastRippleTime < 80) return;
      lastRippleTime = now;
      addRipple(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        addRipple(touch.clientX, touch.clientY);
      }
    };

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [addRipple, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  );
}
