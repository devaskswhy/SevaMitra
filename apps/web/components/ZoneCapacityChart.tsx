'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ZoneCapacityChartProps {
  zones: { name: string; currentLoad: number; maxCapacity: number }[];
}

/**
 * Split out of dashboard/page.tsx and loaded via next/dynamic(ssr:false)
 * there — Recharts was previously bundled into dashboard's initial JS
 * (the single largest route in the app), the same class of bundle bloat
 * MapSection's dynamic import already solved for Leaflet on /map.
 */
export default function ZoneCapacityChart({ zones }: ZoneCapacityChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={zones.map((z) => ({
        name: z.name,
        current: z.currentLoad,
        max: z.maxCapacity,
        percentage: Math.round((z.currentLoad / z.maxCapacity) * 100),
      }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--text-secondary)" />
        <YAxis stroke="var(--text-secondary)" />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          itemStyle={{ color: 'var(--text-primary)' }}
        />
        <Bar dataKey="current" fill="var(--accent-saffron)" name="Current Load" />
        <Bar dataKey="max" fill="var(--accent-gold)" name="Max Capacity" />
      </BarChart>
    </ResponsiveContainer>
  );
}
