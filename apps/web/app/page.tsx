/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { initScroll, EASE, DUR } from '@/lib/scroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { io } from 'socket.io-client';
import axios from 'axios';
import StickyHeader from '@/components/StickyHeader';
import WaterRipple from '@/components/WaterRipple';
import dynamic from 'next/dynamic';

const MapSection = dynamic(() => import('@/components/MapSection'), { ssr: false });
import SevaSahayak from '@/components/SevaSahayak';
const SevaSahayakFloat = dynamic(
  () => import('@/components/SevaSahayak'), { ssr: false }
);

/* ═══════════════════════════════════════════════════════════════
   API CONFIG
   ═══════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api')
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  skills: string;
  reliabilityScore: number;
  status: string;
}

interface Zone {
  id: number;
  name: string;
  type: string;
  maxCapacity: number;
  currentLoad: number;
  priority: string;
}

interface Incident {
  id: number;
  zoneId: number;
  type: string;
  severity: number;
  description: string;
  reportedBy: string;
  status?: string;
  volunteersDeployed?: Volunteer[];
  resolvedAt: string | null;
  createdAt?: string;
}

interface Task {
  id: number;
  title: string;
  zoneId: number;
  skillsRequired: string;
}

interface Assignment {
  id: number;
  volunteerId: number;
  taskId: number;
  shiftId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface VolunteerRecommendation {
  volunteerId: number;
  name: string;
  score: number;
  skillMatch: number;
  availability: number;
  distance: number;
}

interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success';
}

interface DeployIncidentResponse {
  success: boolean;
  data: {
    assignedVolunteer: {
      name: string;
      phone: string;
      skills: string;
    };
    estimatedResolution: string;
    incident: Incident;
  };
}

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
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(255,248,238,0.2)',
        marginBottom: '32px',
      }}
    >
      — {number} {title}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPER: useCountUp Hook
   ═══════════════════════════════════════════════════════════════ */

function useCountUp(end: number, duration: number = 1200, shouldStart: boolean = true): string {
  const [display, setDisplay] = useState('0');
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const animate = useCallback(
    (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end).toLocaleString('en-IN'));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    },
    [end, duration]
  );

  useEffect(() => {
    if (!shouldStart) return;
    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [shouldStart, animate]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD with count-up
   ═══════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  icon,
  visible,
}: {
  label: string;
  value: number;
  icon: string;
  visible: boolean;
}) {
  const display = useCountUp(value, 1200, visible);

  return (
    <div className="glass-card stat-card" style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div
        className="stat-number"
        style={{
          fontSize: '36px',
          fontWeight: 800,
          color: '#E8650A',
          lineHeight: 1,
          marginBottom: '8px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: 'rgba(255,248,238,0.5)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {/* Bottom progress accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #E8650A, #F5A623, transparent)',
          width: visible ? '70%' : '0%',
          transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getCapacityGradient(ratio: number): string {
  if (ratio > 0.8) return 'linear-gradient(90deg, #E65100, #E8650A)';
  if (ratio > 0.5) return 'linear-gradient(90deg, #F5A623, #E8650A)';
  return 'linear-gradient(90deg, #1DB954, #F5A623)';
}

function getSeverityConfig(severity: number) {
  if (severity >= 4) return { color: '#B71C1C', bg: 'rgba(183,28,28,0.15)', label: 'CRITICAL' };
  if (severity >= 3) return { color: '#E65100', bg: 'rgba(230,81,0,0.15)', label: 'HIGH' };
  if (severity >= 2) return { color: '#D4A017', bg: 'rgba(212,160,23,0.15)', label: 'MEDIUM' };
  return { color: '#1DB954', bg: 'rgba(29,185,84,0.15)', label: 'LOW' };
}

function getZoneIcon(type: string): string {
  const icons: Record<string, string> = {
    GHAT: '🏊', CAMP: '🏕', MEDICAL: '🏥', TRAFFIC: '🚦',
    ENTRY_EXIT: '🚪', CROWD_CONTROL: '👥',
  };
  return icons[type] || '📍';
}

function getResolvedDurationLabel(incident: Incident): string {
  if (!incident.createdAt || !incident.resolvedAt) return 'N/A';
  const created = new Date(incident.createdAt).getTime();
  const resolved = new Date(incident.resolvedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(resolved) || resolved <= created) return 'N/A';

  const totalMinutes = Math.round((resolved - created) / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes} minutes`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

/* ═══════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK
   ═══════════════════════════════════════════════════════════════ */

const FALLBACK_VOLUNTEERS: Volunteer[] = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@sevamitra.in', phone: '9876543210', skills: 'Medical, First Aid', reliabilityScore: 92, status: 'ACTIVE' },
  { id: 2, name: 'Priya Sharma', email: 'priya@sevamitra.in', phone: '9876543211', skills: 'Navigation, Languages', reliabilityScore: 88, status: 'ACTIVE' },
  { id: 3, name: 'Amit Singh', email: 'amit@sevamitra.in', phone: '9876543212', skills: 'Security, Crowd Control', reliabilityScore: 95, status: 'ACTIVE' },
  { id: 4, name: 'Sunita Devi', email: 'sunita@sevamitra.in', phone: '9876543213', skills: 'First Aid, Counseling', reliabilityScore: 79, status: 'ACTIVE' },
  { id: 5, name: 'Vikram Yadav', email: 'vikram@sevamitra.in', phone: '9876543214', skills: 'Traffic, Security', reliabilityScore: 85, status: 'ACTIVE' },
  { id: 6, name: 'Meera Gupta', email: 'meera@sevamitra.in', phone: '9876543215', skills: 'Medical, Hindi/English', reliabilityScore: 91, status: 'ACTIVE' },
  { id: 7, name: 'Suresh Patel', email: 'suresh@sevamitra.in', phone: '9876543216', skills: 'Crowd Control, Navigation', reliabilityScore: 83, status: 'ACTIVE' },
  { id: 8, name: 'Anita Verma', email: 'anita@sevamitra.in', phone: '9876543217', skills: 'Counseling, Lost & Found', reliabilityScore: 87, status: 'ACTIVE' },
];

const FALLBACK_ZONES: Zone[] = [
  { id: 1, name: 'Triveni Sangam', type: 'GHAT', maxCapacity: 100, currentLoad: 88, priority: 'HIGH' },
  { id: 2, name: 'Sector 1 Ghat', type: 'GHAT', maxCapacity: 100, currentLoad: 45, priority: 'LOW' },
  { id: 3, name: 'Sector 2 Ghat', type: 'GHAT', maxCapacity: 100, currentLoad: 32, priority: 'LOW' },
  { id: 4, name: 'Sector 3 Ghat', type: 'GHAT', maxCapacity: 100, currentLoad: 67, priority: 'MEDIUM' },
  { id: 5, name: 'Sector 4 Ghat', type: 'GHAT', maxCapacity: 100, currentLoad: 71, priority: 'MEDIUM' },
  { id: 6, name: 'Medical Camp North', type: 'MEDICAL', maxCapacity: 100, currentLoad: 28, priority: 'LOW' },
  { id: 7, name: 'Medical Camp South', type: 'MEDICAL', maxCapacity: 100, currentLoad: 35, priority: 'LOW' },
  { id: 8, name: 'Parking Zone A', type: 'PARKING', maxCapacity: 100, currentLoad: 74, priority: 'MEDIUM' },
  { id: 9, name: 'Parking Zone B', type: 'PARKING', maxCapacity: 100, currentLoad: 55, priority: 'MEDIUM' },
  { id: 10, name: 'VIP Enclosure', type: 'VIP', maxCapacity: 100, currentLoad: 40, priority: 'LOW' },
  { id: 11, name: 'Food Court Zone', type: 'FACILITY', maxCapacity: 100, currentLoad: 58, priority: 'MEDIUM' },
  { id: 12, name: 'Gate 2 Entry', type: 'GATE', maxCapacity: 100, currentLoad: 93, priority: 'HIGH' },
];

const FALLBACK_INCIDENTS: Incident[] = [
  { id: 1, zoneId: 1, type: 'Medical Emergency', severity: 4, description: 'Requires immediate attention at Triveni Sangam ghat area', reportedBy: 'System', resolvedAt: null },
  { id: 2, zoneId: 12, type: 'Crowd Surge', severity: 5, description: 'Gate 2 Entry exceeding capacity — immediate crowd control needed', reportedBy: 'Zone Monitor', resolvedAt: null },
  { id: 3, zoneId: 4, type: 'Lost Person', severity: 3, description: 'Elderly pilgrim reported missing near Sector 3 Ghat', reportedBy: 'Volunteer', resolvedAt: null },
  { id: 4, zoneId: 8, type: 'Traffic Jam', severity: 2, description: 'Vehicle congestion blocking emergency route in Parking Zone A', reportedBy: 'Traffic Cell', resolvedAt: '2025-01-15T10:30:00Z' },
];

const FALLBACK_TASKS: Task[] = [
  { id: 1, title: 'Medical Response — Triveni Sangam', zoneId: 1, skillsRequired: 'Medical, First Aid' },
  { id: 2, title: 'Crowd Control — Gate 2 Entry', zoneId: 12, skillsRequired: 'Security, Crowd Control' },
  { id: 3, title: 'Search & Rescue — Sector 3', zoneId: 4, skillsRequired: 'Navigation, Languages' },
  { id: 4, title: 'Traffic Management — Parking A', zoneId: 8, skillsRequired: 'Traffic, Security' },
  { id: 5, title: 'Counseling Support — Medical Camp', zoneId: 6, skillsRequired: 'Counseling, First Aid' },
];

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
      .to('.hero-subtitle', { opacity: 0, y: -40 }, '<0.1')
      .to('.hero-cta', { opacity: 0, y: -20 }, '<0.1');

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
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
          padding: '0 24px',
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
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#E8650A', opacity: 0.7, fontFamily: 'var(--font-heading)' }}>ॐ</span>
          <span style={{ width: 'clamp(40px, 8vw, 80px)', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(232,101,10,0.5))' }} />
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 80px)',
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
          <span style={{ width: 'clamp(40px, 8vw, 80px)', height: '2px', background: 'linear-gradient(90deg, rgba(232,101,10,0.5), transparent)' }} />
          <span style={{ fontSize: 'clamp(24px, 4vw, 40px)', color: '#E8650A', opacity: 0.7, fontFamily: 'var(--font-heading)' }}>ॐ</span>
        </div>
        <p
          className="hero-subtitle"
          style={{
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            color: 'rgba(255,248,238,0.7)',
            marginBottom: '40px',
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          SevaMitra — Mahakumbh 2025 Volunteer Intelligence Platform
        </p>
        <button
          className="btn-sacred btn-sacred-primary hero-cta"
          style={{ fontSize: '16px', padding: '16px 36px', borderRadius: '12px' }}
          onClick={() => {
            document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Explore Operations ↓
        </button>
      </div>

      {/* ── Image dot indicators ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 3,
        }}
      >
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            aria-label={`Show image ${i + 1}`}
            style={{
              width: activeIdx === i ? '24px' : '8px',
              height: '8px',
              borderRadius: activeIdx === i ? '4px' : '50%',
              background: activeIdx === i ? '#E8650A' : 'rgba(255,248,238,0.3)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'width 0.3s ease, background 0.3s ease, border-radius 0.3s ease',
            }}
          />
        ))}
      </div>


    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  const [stats, setStats] = useState({
    totalActiveVolunteers: 0,
    zonesOverCapacity: 0,
    openIncidents: 0,
    pendingAssignments: 0,
  });
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<VolunteerRecommendation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [, setLoading] = useState(true);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [deployingIncidentIds, setDeployingIncidentIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [highlightedIncidentIds, setHighlightedIncidentIds] = useState<number[]>([]);

  // FIXED: force scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  // Lenis smooth scroll + GSAP ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = initScroll();

    const ctx = gsap.context(() => {
      // Animate every section below hero
      const sections = document.querySelectorAll<HTMLElement>(
        '#zones, #map, #incidents, #chatbot, #volunteers, section:not(#hero):not(#stats)'
      );
      sections.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: DUR.slow,
            ease: EASE,
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Storytelling Pinned Sequence for Stats
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const statsTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#stats',
            start: 'top top',
            end: '+=2000',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        statsTl
          // Section label slides in first
          .fromTo('.stats-chapter-label',
            { x: -40, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.3 }
          )
          // Heading reveals
          .fromTo('.stats-heading',
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: EASE },
            '-=0.1'
          )
          // Cards stagger in one by one
          .fromTo('.stat-card',
            { y: 80, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, stagger: 0.2, duration: 0.4, ease: EASE },
            '-=0.2'
          );
      });

      mm.add('(max-width: 767px)', () => {
        // Mobile fallback: simple fade in
        gsap.fromTo(
          '.stat-card',
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: DUR.base,
            ease: EASE,
            stagger: 0.12,
            scrollTrigger: {
              trigger: '#stats',
              start: 'top 80%',
            },
          }
        );
      });
    });

    return () => {
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  /* ── Data Fetching ── */
  const fetchData = useCallback(async () => {
    try {
      const [volunteersRes, zonesRes, incidentsRes, resolvedRes, tasksRes, assignmentsRes] = await Promise.all([
        axios.get(`${API}/volunteers`),
        axios.get(`${API}/zones`),
        axios.get(`${API}/incidents`),
        axios.get(`${API}/incidents/resolved`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/assignments`),
      ]);

      const volunteersData = volunteersRes.data.data || volunteersRes.data;
      const zonesData = zonesRes.data.data || zonesRes.data;
      const incidentsData = incidentsRes.data.data || incidentsRes.data;
      const resolvedData = resolvedRes.data.data || resolvedRes.data;
      const tasksData = tasksRes.data.data || tasksRes.data;
      const assignmentsData = assignmentsRes.data.data || assignmentsRes.data;
      const resolvedById = new Map<number, Incident>(
        (resolvedData as Incident[]).map((incident: Incident) => [incident.id, incident])
      );
      const mergedIncidents = [
        ...(incidentsData as Incident[]).filter((incident: Incident) => !resolvedById.has(incident.id)),
        ...Array.from(resolvedById.values()),
      ];

      const activeVolunteers = volunteersData.filter((v: Volunteer) => v.status === 'ACTIVE').length;
      const zonesOver80 = zonesData.filter((z: Zone) => (z.currentLoad / z.maxCapacity) > 0.8).length;
      const openIncidents = mergedIncidents.filter((i: Incident) => !i.resolvedAt).length;
      const pendingAssignments = assignmentsData.filter((a: Assignment) => !a.checkInTime).length;

      setStats({ totalActiveVolunteers: activeVolunteers, zonesOverCapacity: zonesOver80, openIncidents, pendingAssignments });
      setVolunteers(volunteersData);
      setZones(zonesData);
      setIncidents(mergedIncidents);
      setTasks(tasksData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data, using fallback:', error);

      // Compute stats from fallback data so cards aren't all 0
      const activeVolunteers = FALLBACK_VOLUNTEERS.filter((v) => v.status === 'ACTIVE').length;
      const zonesOver80 = FALLBACK_ZONES.filter((z) => (z.currentLoad / z.maxCapacity) > 0.8).length;
      const openIncidents = FALLBACK_INCIDENTS.filter((i) => !i.resolvedAt).length;

      setStats({
        totalActiveVolunteers: activeVolunteers,
        zonesOverCapacity: zonesOver80,
        openIncidents,
        pendingAssignments: 3,
      });
      setVolunteers(FALLBACK_VOLUNTEERS);
      setZones(FALLBACK_ZONES);
      setIncidents(FALLBACK_INCIDENTS);
      setTasks(FALLBACK_TASKS);
      setLoading(false);
    }
  }, []);

  /* ── Socket.io ── */
  const initSocket = useCallback(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : 'http://localhost:4000';
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => console.log('Socket connected'));

    socketInstance.on('activity', (data: Activity) => {
      setActivities((prev) => [{ ...data, id: data.id || Date.now().toString() }, ...prev.slice(0, 49)]);
    });

    socketInstance.on('assignment:updated', (data: string) => {
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Assignment updated: ${data}`, timestamp: new Date(), type: 'info' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socketInstance.on('incident:reported', (data: string) => {
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Incident reported: ${data}`, timestamp: new Date(), type: 'warning' },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socketInstance.on('incident:deployed', (incident: Incident) => {
      setIncidents((prev) => {
        const withoutIncident = prev.filter((item) => item.id !== incident.id);
        return [incident, ...withoutIncident];
      });
      const volunteerName = incident.volunteersDeployed?.[0]?.name || 'Volunteer';
      setToastMessage(`✅ Deployed! ${volunteerName} assigned.`);
    });

    socketInstance.on('incident:resolved', (incident: Incident) => {
      setIncidents((prev) => {
        const withoutIncident = prev.filter((item) => item.id !== incident.id);
        return [incident, ...withoutIncident];
      });
    });

    socketInstance.on('incident:new', (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev.filter((item) => item.id !== incident.id)]);
      setHighlightedIncidentIds((prev) =>
        prev.includes(incident.id) ? prev : [incident.id, ...prev]
      );
      window.setTimeout(() => {
        setHighlightedIncidentIds((prev) => prev.filter((id) => id !== incident.id));
      }, 4500);
    });

    return () => { socketInstance.disconnect(); };
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const cleanup = initSocket();
    return cleanup;
  }, [fetchData, initSocket]);

  /* ── Actions ── */
  const handleDeployVolunteers = async (incidentId: number) => {
    setDeployingIncidentIds((prev) =>
      prev.includes(incidentId) ? prev : [...prev, incidentId]
    );
    try {
      const response = await axios.post<DeployIncidentResponse>(`${API}/incidents/${incidentId}/deploy`);
      const data = response.data.data;
      setIncidents((prev) => {
        const withoutIncident = prev.filter((incident) => incident.id !== incidentId);
        return data?.incident ? [data.incident, ...withoutIncident] : withoutIncident;
      });
      if (data?.assignedVolunteer) {
        setToastMessage(
          `✅ Deployed! ${data.assignedVolunteer.name} assigned. Est. resolution: ${data.estimatedResolution}`
        );
      }
      setActivities((prev) => [
        { id: Date.now().toString(), message: `Volunteers deployed for incident #${incidentId}`, timestamp: new Date(), type: 'success' },
        ...prev.slice(0, 49),
      ]);
    } catch (error) {
      console.error('Failed to deploy volunteers:', error);
      window.alert('Deployment failed. Please try again.');
    } finally {
      setDeployingIncidentIds((prev) => prev.filter((id) => id !== incidentId));
    }
  };

  const handleFindBestVolunteers = async () => {
    if (!selectedTask) return;
    try {
      const response = await axios.get(`${API}/allocate/recommend`, { params: { taskId: selectedTask } });
      const recs = response.data.data || response.data;
      setRecommendations(recs.slice(0, 5));
    } catch (error) {
      console.error('Failed to get API recommendations, using local scoring:', error);

      // Local fallback: score volunteers by skill match + reliability
      const task = currentTasks.find((t) => t.id === selectedTask);
      const requiredSkills = task ? task.skillsRequired.toLowerCase().split(/,\s*/) : [];

      const localRecs: VolunteerRecommendation[] = currentVolunteers
        .map((v) => {
          const volSkills = v.skills.toLowerCase().split(/,\s*/);
          const matched = requiredSkills.filter((rs) => volSkills.some((vs) => vs.includes(rs) || rs.includes(vs)));
          const skillMatch = requiredSkills.length > 0 ? Math.round((matched.length / requiredSkills.length) * 100) : 50;
          const availability = v.status === 'ACTIVE' ? 80 + Math.round(Math.random() * 20) : 20;
          const distance = Math.round(Math.random() * 4 * 10) / 10 + 0.5;
          const score = Math.round(skillMatch * 0.4 + v.reliabilityScore * 0.35 + availability * 0.25);
          return { volunteerId: v.id, name: v.name, score, skillMatch, availability, distance };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRecommendations(localRecs);
    }
  };

  /* ── Derived data ── */
  const currentVolunteers = volunteers.length ? volunteers : FALLBACK_VOLUNTEERS;
  const currentZones = zones.length ? zones : FALLBACK_ZONES;
  const currentIncidents = incidents.length ? incidents : FALLBACK_INCIDENTS;
  const currentTasks = tasks.length ? tasks : FALLBACK_TASKS;

  const filteredVolunteers = currentVolunteers.filter(
    (v) => v.name.toLowerCase().includes(volunteerSearch.toLowerCase()) || v.email.toLowerCase().includes(volunteerSearch.toLowerCase())
  );
  const unresolvedIncidents = currentIncidents.filter((i) => !i.resolvedAt);
  const resolvedIncidents = currentIncidents.filter((i) => i.resolvedAt);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <>
      <WaterRipple />
      <StickyHeader
        zones={zones}
        volunteers={volunteers}
        incidents={incidents}
        activeVolunteerCount={stats.totalActiveVolunteers}
      />

      {/* OM Watermark */}
      <div className="om-watermark" aria-hidden="true">ॐ</div>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '92px',
            right: '20px',
            zIndex: 1200,
            background: 'rgba(17, 34, 17, 0.95)',
            border: '1px solid rgba(29,185,84,0.5)',
            color: '#D6FFE0',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            maxWidth: '360px',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
         HERO SECTION — Multi-layer parallax image gallery
         ═════════════════════════════════════════════════════════ */}
      <HeroSection />

      {/* ═════════════════════════════════════════════════════════
         STATS SECTION
         ═════════════════════════════════════════════════════════ */}
      <section id="stats" style={{ minHeight: '100vh', width: '100%', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#100600', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <SectionWave />
            <div className="stats-chapter-label">
              <SectionLabel number="01" title="OPERATIONS" />
            </div>
            <h2
              className="stats-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                color: '#FFF8EE',
                marginBottom: '48px',
              }}
            >
              Real-Time Operations
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
              }}
            >
              <StatCard label="Active Volunteers" value={stats.totalActiveVolunteers} icon="👥" visible={true} />
              <StatCard label="Zones >80% Capacity" value={stats.zonesOverCapacity} icon="📍" visible={true} />
              <StatCard label="Open Incidents" value={stats.openIncidents} icon="⚠️" visible={true} />
              <StatCard label="Pending Assignments" value={stats.pendingAssignments} icon="📋" visible={true} />
            </div>

            {/* Quick Allocation Panel */}
            <div className="glass-card" style={{ marginTop: '40px', padding: '28px' }}>
              <h3 style={{ color: '#FFF8EE', fontSize: '18px', fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: '16px' }}>
                ⚡ Quick Volunteer Allocation
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,248,238,0.4)', marginBottom: '6px', fontWeight: 500 }}>
                    Select Task
                  </label>
                  <select
                    value={selectedTask || ''}
                    onChange={(e) => setSelectedTask(Number(e.target.value))}
                    style={{
                      width: '100%',
                      height: '44px',
                      minHeight: '44px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(232,101,10,0.2)',
                      borderRadius: '10px',
                      color: '#FFF8EE',
                      padding: '0 12px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="" style={{ background: '#1C0A00' }}>Choose a task...</option>
                    {currentTasks.map((task) => (
                      <option key={task.id} value={task.id} style={{ background: '#1C0A00' }}>{task.title}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleFindBestVolunteers}
                  disabled={!selectedTask}
                  className="btn-sacred btn-sacred-primary"
                  style={{
                    opacity: selectedTask ? 1 : 0.4,
                    cursor: selectedTask ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Find Best Volunteers
                </button>
              </div>

              {recommendations.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: 'rgba(255,248,238,0.6)', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Top Recommendations
                  </h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {recommendations.map((rec) => (
                      <div
                        key={rec.volunteerId}
                        className="glass-card"
                        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{rec.name}</span>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'rgba(255,248,238,0.5)' }}>
                          <span>Skill: <b style={{ color: '#D4A017' }}>{rec.skillMatch}%</b></span>
                          <span>Avail: <b style={{ color: '#1DB954' }}>{rec.availability}%</b></span>
                          <span>Dist: <b style={{ color: '#FFF8EE' }}>{rec.distance}km</b></span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#E8650A' }}>{rec.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      {/* ═════════════════════════════════════════════════════════
         ZONES SECTION
         ═════════════════════════════════════════════════════════ */}
      {/* FIXED: section visibility */}
      <section id="zones" style={{ minHeight: '400px', width: '100%', position: 'relative', zIndex: 2, opacity: 1, visibility: 'visible', display: 'block', background: '#0D0500', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionWave />
          <div>
            <SectionLabel number="02" title="ZONE MANAGEMENT" />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                color: '#FFF8EE',
                marginBottom: '48px',
              }}
            >
              Zone Status Overview
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {currentZones.map((zone) => {
                const ratio = zone.maxCapacity > 0 ? zone.currentLoad / zone.maxCapacity : 0;
                const pct = Math.min(ratio * 100, 100);

                return (
                  <div key={zone.id} className="glass-card" style={{ padding: '24px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '20px' }}>{getZoneIcon(zone.type)}</span>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-body)', color: '#FFF8EE' }}>{zone.name}</h3>
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,248,238,0.35)' }}>{zone.type}</span>
                      </div>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#fff',
                          background: zone.priority === 'HIGH' ? '#B71C1C' : zone.priority === 'MEDIUM' ? '#E65100' : '#1DB954',
                        }}
                      >
                        {zone.priority}
                      </span>
                    </div>

                    {/* Capacity */}
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: 'rgba(255,248,238,0.4)' }}>Capacity</span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {zone.currentLoad.toLocaleString()} / {zone.maxCapacity.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: '3px',
                            background: getCapacityGradient(ratio),
                            width: `${pct}%`,
                            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
                          }}
                        />
                      </div>
                      <div style={{ textAlign: 'right', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: ratio > 0.8 ? '#E8650A' : ratio > 0.5 ? '#F5A623' : '#1DB954' }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
         ZONE MAP SECTION
         ═════════════════════════════════════════════════════════ */}
      <section
        id="map"
        style={{
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          zIndex: 2,
          background: '#100600',
          padding: '80px 24px 48px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p
            style={{
              color: 'rgba(255,248,238,0.4)',
              fontSize: '12px',
              letterSpacing: '0.15em',
              marginBottom: '8px',
            }}
          >
            — 03 ZONE MAP
          </p>
          <h2
            style={{
              color: '#FFF8EE',
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: '500',
              marginBottom: '8px',
            }}
          >
            Mahakumbh Zone Intelligence
          </h2>
          <p
            style={{
              color: 'rgba(255,248,238,0.5)',
              marginBottom: '32px',
              fontSize: '15px',
            }}
          >
            Live density monitoring across all 12 sectors
          </p>
          <MapSection />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
         INCIDENTS SECTION
         ═════════════════════════════════════════════════════════ */}
      {/* FIXED: section visibility */}
      <section id="incidents" style={{ minHeight: '400px', width: '100%', position: 'relative', zIndex: 2, opacity: 1, visibility: 'visible', display: 'block', background: '#0D0500', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionWave />
          <div>
            <SectionLabel number="03" title="INCIDENT MANAGEMENT" />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                color: '#FFF8EE',
                marginBottom: '48px',
              }}
            >
              Incident Tracker
            </h2>

            {/* Active Incidents */}
            {unresolvedIncidents.length > 0 && (
              <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'rgba(255,248,238,0.5)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Active ({unresolvedIncidents.length})
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {unresolvedIncidents.map((incident) => {
                    const sev = getSeverityConfig(incident.severity);
                    const isDeploying = deployingIncidentIds.includes(incident.id);
                    const isHighlighted = highlightedIncidentIds.includes(incident.id);
                    return (
                      <div
                        key={incident.id}
                        className="glass-card"
                        style={{
                          padding: '24px',
                          borderLeft: `4px solid ${sev.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px',
                          animation: isHighlighted ? 'sacred-pulse 1.25s ease-in-out 3' : 'none',
                        }}
                      >
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: sev.color,
                                background: sev.bg,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {sev.label}
                            </span>
                            {incident.severity >= 5 && (
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: '#ff2d2d',
                                  animation: 'sacred-pulse 1s ease-in-out infinite',
                                  boxShadow: '0 0 0 4px rgba(255,45,45,0.2)',
                                }}
                              />
                            )}
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{incident.type}</span>
                          </div>
                          <p style={{ color: 'rgba(255,248,238,0.55)', fontSize: '13px', lineHeight: 1.5 }}>
                            {incident.description}
                          </p>
                          {incident.reportedBy && (
                            <p style={{ color: 'rgba(255,248,238,0.25)', fontSize: '11px', marginTop: '6px' }}>
                              Reported by: {incident.reportedBy}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeployVolunteers(incident.id)}
                          disabled={isDeploying}
                          className="btn-sacred btn-sacred-primary"
                          style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '10px 20px', minWidth: '140px', opacity: isDeploying ? 0.75 : 1 }}
                        >
                          {isDeploying ? '⏳ Deploying...' : '🔥 Deploy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {unresolvedIncidents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,248,238,0.3)' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>✅</p>
                <p>No active incidents</p>
              </div>
            )}

            {/* Resolved Incidents */}
            {resolvedIncidents.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-body)', color: 'rgba(255,248,238,0.3)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Resolved ({resolvedIncidents.length})
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {resolvedIncidents.map((incident) => {
                    const resolverName = incident.volunteersDeployed?.[0]?.name || 'Unassigned';
                    const resolvedIn = getResolvedDurationLabel(incident);
                    return (
                    <div
                      key={incident.id}
                      className="glass-card"
                      style={{
                        padding: '16px 20px',
                        borderLeft: '4px solid #1DB954',
                        opacity: 0.75,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{incident.type}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,248,238,0.45)', marginBottom: '8px' }}>{incident.description}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,248,238,0.35)' }}>
                          Resolved by: <span style={{ color: '#E7FFE9' }}>{resolverName}</span>
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,248,238,0.35)' }}>
                          Resolved in: <span style={{ color: '#E7FFE9' }}>{resolvedIn}</span>
                        </p>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#1DB954', padding: '2px 8px', borderRadius: '4px', background: 'rgba(29,185,84,0.15)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ✅ RESOLVED
                      </span>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
         CHATBOT SECTION
         ═════════════════════════════════════════════════════════ */}
      <section id="chatbot" style={{
        minHeight: '100vh', width: '100%', position: 'relative',
        zIndex: 2, background: '#0D0500', padding: '80px 24px 48px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,248,238,0.4)', fontSize: '12px',
            letterSpacing: '0.15em', marginBottom: '8px' }}>— 04 AI ASSISTANT</p>
          <h2 style={{ color: '#FFF8EE', fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: '500', marginBottom: '8px' }}>SevaSahayak</h2>
          <p style={{ color: 'rgba(255,248,238,0.5)', marginBottom: '32px',
            fontSize: '15px' }}>
            AI guide for pilgrims and volunteers — Shahi Snaan schedules, 
            crowd levels, zone assignments
          </p>
          <div style={{ background: 'rgba(255,255,255,0.04)', 
            border: '1px solid rgba(232,101,10,0.15)', borderRadius: '20px',
            overflow: 'hidden' }}>
            <SevaSahayak isInline={true} />
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
         VOLUNTEERS SECTION
         ═════════════════════════════════════════════════════════ */}
      {/* FIXED: section visibility */}
      <section id="volunteers" style={{ minHeight: '400px', width: '100%', position: 'relative', zIndex: 2, opacity: 1, visibility: 'visible', display: 'block', background: '#100600', padding: '100px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionWave />
          <div>
            <SectionLabel number="04" title="VOLUNTEER ROSTER" />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                color: '#FFF8EE',
                marginBottom: '32px',
              }}
            >
              Volunteer Directory
            </h2>

            {/* Search filter */}
            <div style={{ marginBottom: '28px', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Filter by name or email..."
                value={volunteerSearch}
                onChange={(e) => setVolunteerSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  minHeight: '42px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(232, 101, 10, 0.15)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#FFF8EE',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Skills</th>
                    <th>Reliability</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, fontSize: '14px' }}>{v.name}</td>
                      <td style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}>{v.email}</td>
                      <td style={{ color: 'rgba(255,248,238,0.5)', fontSize: '13px' }}>{v.phone}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500, background: 'rgba(232,101,10,0.12)', color: '#E8650A' }}>
                          {v.skills.length > 20 ? v.skills.substring(0, 20) + '...' : v.skills}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: v.reliabilityScore >= 80 ? '#1DB954' : v.reliabilityScore >= 60 ? '#F5A623' : '#B71C1C', fontVariantNumeric: 'tabular-nums' }}>
                          {v.reliabilityScore}%
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#fff',
                            background: v.status === 'ACTIVE' ? '#1DB954' : '#B71C1C',
                          }}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVolunteers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,248,238,0.3)', fontSize: '14px' }}>
                  No volunteers found.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
         LIVE ACTIVITY FEED (Bottom section)
         ═════════════════════════════════════════════════════════ */}
      {/* FIXED: section visibility */}
      <section style={{ minHeight: '400px', width: '100%', position: 'relative', zIndex: 2, opacity: 1, visibility: 'visible', display: 'block', background: '#0D0500', padding: '80px 24px 120px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionWave />
          <SectionLabel number="05" title="LIVE FEED" />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 4vw, 42px)',
              color: '#FFF8EE',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1DB954', animation: 'sacred-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#E8650A', fontFamily: 'var(--font-body)' }}>LIVE</span>
            </span>
            Activity Feed
          </h2>

          <div className="glass-card" style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,248,238,0.3)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📡</p>
                <p style={{ fontSize: '14px' }}>Waiting for live updates...</p>
                <p style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,248,238,0.2)' }}>Connected to Socket.io</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${activity.type === 'warning' ? '#E65100' : activity.type === 'success' ? '#1DB954' : '#1565C0'}`,
                      background: activity.type === 'warning' ? 'rgba(230,81,0,0.06)' : activity.type === 'success' ? 'rgba(29,185,84,0.06)' : 'rgba(21,101,192,0.06)',
                    }}
                  >
                    <p style={{ fontSize: '13px', fontWeight: 500, color: activity.type === 'warning' ? '#E65100' : activity.type === 'success' ? '#1DB954' : '#4FC3F7' }}>
                      {activity.message}
                    </p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,248,238,0.2)', marginTop: '2px' }}>
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating Chatbot Bubble */}
      <SevaSahayakFloat isInline={false} />
    </>
  );
}
