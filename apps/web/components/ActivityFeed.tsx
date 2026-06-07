'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ActivityData {
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success';
}

interface Activity extends ActivityData {
  id: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const socket: Socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('Connected to socket');
    });

    socket.on('activity', (data: ActivityData) => {
      setActivities((prev) => [
        { id: Date.now().toString(), ...data },
        ...prev.slice(0, 49),
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-orange-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Activity Feed</h3>

      <div className="space-y-3 h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Waiting for live updates...</p>
            <p className="text-sm mt-2">Socket connection to server</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="border-l-4 border-orange-400 pl-4 py-2 bg-gray-50 rounded-r"
            >
              <p className={`text-sm font-medium ${getTypeColor(activity.type)}`}>
                {activity.message}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}