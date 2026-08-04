/* ═══════════════════════════════════════════════════════════════
   SHARED ICON SET — outline SVGs (24x24, stroke=currentColor),
   matching the style already used for the bottom-nav / header icon
   buttons across the volunteer flow. Replaces emoji used as UI
   iconography app-wide; sized via the `size` prop, colored via
   currentColor so they inherit whatever color context wraps them.
   ═══════════════════════════════════════════════════════════════ */

import type { CSSProperties, ReactNode } from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function base(children: ReactNode, { size = 20, className, style }: IconProps = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const UsersIcon = (props: IconProps) => base(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>, props);

export const MapPinIcon = (props: IconProps) => base(
  <>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </>, props);

export const AlertTriangleIcon = (props: IconProps) => base(
  <>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>, props);

export const ClipboardIcon = (props: IconProps) => base(
  <>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </>, props);

export const FlameIcon = (props: IconProps) => base(
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />, props);

export const RadioIcon = (props: IconProps) => base(
  <>
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-8.49a6 6 0 0 0 0 8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
  </>, props);

export const WavesIcon = (props: IconProps) => base(
  <>
    <path d="M2 12c1-1.5 2.5-2 4-2s3 .5 4 2 2.5 2 4 2 3-.5 4-2 2.5-2 4-2" />
    <path d="M2 18c1-1.5 2.5-2 4-2s3 .5 4 2 2.5 2 4 2 3-.5 4-2 2.5-2 4-2" />
  </>, props);

export const TentIcon = (props: IconProps) => base(
  <>
    <path d="m3.5 21 8.5-18 8.5 18" />
    <path d="M12 3v18" />
    <path d="M7 14h10" />
  </>, props);

export const MedicalIcon = (props: IconProps) => base(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </>, props);

export const TrafficIcon = (props: IconProps) => base(
  <>
    <rect x="8" y="2" width="8" height="18" rx="3" />
    <path d="M12 20v2" />
    <path d="M11 7h.01M11 11h.01M11 15h.01" />
  </>, props);

export const DoorIcon = (props: IconProps) => base(
  <>
    <path d="M4 21V5a2 2 0 0 1 2-2h7v18" />
    <path d="M13 21h7" />
    <path d="M13 3v18" />
    <path d="M9 12h.01" />
  </>, props);

export const MapIcon = (props: IconProps) => base(
  <>
    <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" />
    <path d="M9 4v14M15 6v14" />
  </>, props);

export const ChartIcon = (props: IconProps) => base(
  <>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-4 4" />
  </>, props);

export const CalendarIcon = (props: IconProps) => base(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>, props);

export const FileTextIcon = (props: IconProps) => base(
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h6" />
  </>, props);

export const SmartphoneIcon = (props: IconProps) => base(
  <>
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M12 18h.01" />
  </>, props);

export const GridIcon = (props: IconProps) => base(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </>, props);

export const DownloadIcon = (props: IconProps) => base(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </>, props);

export const CheckCircleIcon = (props: IconProps) => base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>, props);

export const XCircleIcon = (props: IconProps) => base(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </>, props);

export const ShieldIcon = (props: IconProps) => base(
  <path d="M12 2 4 5v6c0 5.1 3.4 9.4 8 11 4.6-1.6 8-5.9 8-11V5l-8-3Z" />, props);

export const StarIcon = (props: IconProps) => base(
  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z" />, props);

export const MedalIcon = (props: IconProps) => base(
  <>
    <circle cx="12" cy="15" r="6" />
    <path d="m9 10-3-7M15 10l3-7M9.5 15.5 12 13l2.5 2.5" />
  </>, props);

export const RefreshIcon = (props: IconProps) => base(
  <>
    <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
    <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
    <path d="M3 21v-5h5M21 3v5h-5" />
  </>, props);

export const HourglassIcon = (props: IconProps) => base(
  <>
    <path d="M6 2h12M6 22h12" />
    <path d="M6 2c0 5 12 5 12 10s-12 5-12 10M18 2c0 5-12 5-12 10s12 5 12 10" />
  </>, props);

export const HandsPrayingIcon = (props: IconProps) => base(
  <>
    <path d="M12 3v9" />
    <path d="M7 5c0 4-3 6-3 10a4 4 0 0 0 8 0" />
    <path d="M17 5c0 4 3 6 3 10a4 4 0 0 1-8 0" />
  </>, props);

export const VestIcon = (props: IconProps) => base(
  <>
    <path d="M8 3h8l2 5-2 2v11H6V10L4 8Z" />
    <path d="M9 3v18M15 3v18" />
  </>, props);

export const HomeIcon = (props: IconProps) => base(
  <>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <path d="M9 22V12h6v10" />
  </>, props);

export const UserIcon = (props: IconProps) => base(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </>, props);

export const SendIcon = (props: IconProps) => base(
  <path d="m22 2-7 20-4-9-9-4Z" />, props);

export const CloseIcon = (props: IconProps) => base(
  <path d="M18 6 6 18M6 6l12 12" />, props);

export const MenuIcon = (props: IconProps) => base(
  <path d="M3 12h18M3 6h18M3 18h18" />, props);
