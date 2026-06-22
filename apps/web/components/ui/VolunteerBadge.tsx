'use client';

import { motion } from 'framer-motion';

export interface VolunteerBadgeProps {
  /** Volunteer name */
  name: string;
  /** Assigned role / skill */
  skill: string;
  /** Reliability score 0-100 */
  reliabilityScore: number;
  /** Current availability status */
  status: 'active' | 'on-break' | 'offline';
  /** Optional URL for avatar */
  avatarUrl?: string;
  /** Optional click handler */
  onClick?: () => void;
}

const skillIcons: Record<string, string> = {
  'First Aid': '🏥',
  'Crowd Control': '🛡️',
  'Translation': '🗣️',
  'Navigation': '🧭',
  'Sanitation': '🧹',
  'Security': '🔒',
  'Food Service': '🍛',
  'Transport': '🚐',
  'Communication': '📢',
  'Medical': '⚕️',
};

const statusConfig: Record<string, { color: string; label: string; glow: string }> = {
  active: {
    color: '#2E7D32',
    label: 'Active',
    glow: '0 0 6px rgba(46, 125, 50, 0.5)',
  },
  'on-break': {
    color: '#E65100',
    label: 'On Break',
    glow: '0 0 6px rgba(230, 81, 0, 0.5)',
  },
  offline: {
    color: '#9E9E9E',
    label: 'Offline',
    glow: 'none',
  },
};

export default function VolunteerBadge({
  name,
  skill,
  reliabilityScore,
  status,
  avatarUrl,
  onClick,
}: VolunteerBadgeProps) {
  const statusCfg = statusConfig[status];
  const icon = skillIcons[skill] || '🙏';

  // SVG ring calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (reliabilityScore / 100) * circumference;

  // Score color based on reliability
  const scoreColor =
    reliabilityScore >= 80
      ? '#2E7D32'
      : reliabilityScore >= 60
        ? '#E65100'
        : '#B71C1C';

  return (
    <motion.div
      id={`volunteer-badge-${name.toLowerCase().replace(/\s+/g, '-')}`}
      className="card inline-flex items-center gap-3 px-4 py-3 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* ── Reliability Score Ring ── */}
      <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="var(--cream-dark)"
            strokeWidth="3"
          />
          {/* Score arc */}
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        {/* Inner avatar or initial */}
        <div
          className="absolute inset-[6px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, var(--saffron), var(--marigold))',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white text-sm font-bold">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </span>
          {/* Status dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: statusCfg.color,
              boxShadow: statusCfg.glow,
            }}
            title={statusCfg.label}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {skill}
          </span>
        </div>
      </div>

      {/* ── Score Label ── */}
      <div className="flex-shrink-0 ml-auto pl-3">
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: scoreColor }}
        >
          {reliabilityScore}%
        </span>
      </div>
    </motion.div>
  );
}
