'use client';

import { useState, useEffect } from 'react';
import SectionHeading from './SectionHeading';
import { MapPinIcon, CheckCircleIcon } from '@/components/icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge, { priorityToBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import axios from 'axios';
import { useStaggerReveal } from '@/lib/scroll';

const API = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
  : 'http://localhost:4000/api';

interface Zone {
  id: number;
  name: string;
  type: string;
  maxCapacity: number;
  currentLoad: number;
  priority: string;
}

export default function ZonesSection() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [managingZone, setManagingZone] = useState<Zone | null>(null);
  const [formPriority, setFormPriority] = useState('LOW');
  const [formLoad, setFormLoad] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const openManageZone = (zone: Zone) => {
    setManagingZone(zone);
    setFormPriority(zone.priority);
    setFormLoad(zone.currentLoad);
    setSavedMessage('');
  };

  const handleSaveZone = async () => {
    if (!managingZone) return;
    setSaving(true);
    try {
      await axios.put(`${API}/zones/${managingZone.id}`, {
        priority: formPriority,
        currentLoad: formLoad,
      });
      setZones((prev) =>
        prev.map((z) => (z.id === managingZone.id ? { ...z, priority: formPriority, currentLoad: formLoad } : z))
      );
      setSavedMessage(`${managingZone.name} updated.`);
      setTimeout(() => setManagingZone(null), 900);
    } catch (err) {
      console.error('Failed to update zone:', err);
      setSavedMessage('Update failed — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fetchZones = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API}/zones`);
      setZones(res.data.data || res.data);
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useStaggerReveal('.zone-card', !loading && !error && zones.length > 0);

  return (
    <>
      <SectionHeading icon={MapPinIcon} title="Zones" description="Capacity and priority across every Mahakumbh zone." />

      {error && (
        <Card padding="md" className="text-center mb-6">
          <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Couldn&apos;t load zones.</p>
          <Button onClick={fetchZones} size="sm">
            Retry
          </Button>
        </Card>
      )}

      {!error && loading && (
        <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Loading zones...
        </div>
      )}

      {!error && !loading && zones.length === 0 && (
        <div className="card rounded-lg p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No zones found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <Card key={zone.id} padding="md" className="zone-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{zone.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{zone.type}</p>
              </div>
              <Badge tone={priorityToBadge(zone.priority).tone} variant="solid">
                {zone.priority}
              </Badge>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-muted)' }}>Capacity</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {zone.currentLoad} / {zone.maxCapacity}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(zone.currentLoad / zone.maxCapacity) * 100}%`, background: 'linear-gradient(90deg, var(--saffron), var(--gold))' }}
                ></div>
              </div>
            </div>

            <Button size="sm" className="w-full mt-4" onClick={() => openManageZone(zone)}>
              Manage Zone
            </Button>
          </Card>
        ))}
      </div>

      <Modal open={!!managingZone} onClose={() => setManagingZone(null)} title={managingZone ? `Manage ${managingZone.name}` : undefined}>
        {managingZone && (
          <div className="space-y-4">
            <div>
              <label htmlFor="zone-priority" className="block mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Priority
              </label>
              <select
                id="zone-priority"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="zone-load" className="block mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Current Load (of {managingZone.maxCapacity})
              </label>
              <input
                id="zone-load"
                type="number"
                min={0}
                max={managingZone.maxCapacity}
                value={formLoad}
                onChange={(e) => setFormLoad(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {savedMessage && (
              <p role="status" className="text-sm flex items-center gap-2" style={{ color: 'var(--status-green)' }}>
                <CheckCircleIcon size={14} /> {savedMessage}
              </p>
            )}

            <Button className="w-full" onClick={handleSaveZone} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
