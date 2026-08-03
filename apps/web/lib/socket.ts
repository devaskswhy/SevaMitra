import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type SocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/**
 * Shared Socket.io client wiring for the pages that need it
 * (dashboard, incidents). socket.io-client already reconnects with
 * exponential backoff by default — the options below just make that
 * explicit — but nothing previously surfaced *that* a drop happened, or
 * refetched the data missed while offline. This hook adds both:
 * `setupHandlers` registers the page's own event listeners once on
 * mount, and `onReconnect` fires specifically when a connection is
 * re-established after a real drop (not on the initial connect), so
 * callers can do a full refetch to catch up.
 */
export function useSocket(
  setupHandlers: (socket: Socket) => void,
  onReconnect: () => void
): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const setupRef = useRef(setupHandlers);
  const reconnectRef = useRef(onReconnect);
  setupRef.current = setupHandlers;
  reconnectRef.current = onReconnect;

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
      : 'http://localhost:4000';

    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('reconnect_attempt', () => setStatus('reconnecting'));
    socket.on('reconnect', () => {
      setStatus('connected');
      reconnectRef.current();
    });
    socket.on('reconnect_failed', () => setStatus('disconnected'));

    setupRef.current(socket);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
