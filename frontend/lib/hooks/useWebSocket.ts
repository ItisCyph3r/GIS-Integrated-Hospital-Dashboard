'use client';

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export interface WebSocketHookOptions {
  onAmbulanceUpdate?: (data: unknown) => void;
  onRequestCreated?: (data: unknown) => void;
  onRequestAccepted?: (data: unknown) => void;
  onRequestStatusUpdate?: (data: unknown) => void;
  onRequestCancelled?: (data: unknown) => void;
  onRequestCompleted?: (data: unknown) => void;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Only create socket once
    if (socketRef.current) {
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); 

  // Update event listeners when callbacks change
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Remove old listeners
    socket.off('ambulance:location');
    socket.off('request:created');
    socket.off('request:accepted');
    socket.off('request:status');
    socket.off('request:cancelled');
    socket.off('request:completed');

    // Add new listeners
    if (options.onAmbulanceUpdate) {
      socket.on('ambulance:location', options.onAmbulanceUpdate);
    }

    if (options.onRequestCreated) {
      socket.on('request:created', options.onRequestCreated);
    }

    if (options.onRequestAccepted) {
      socket.on('request:accepted', options.onRequestAccepted);
    }

    if (options.onRequestStatusUpdate) {
      socket.on('request:status', options.onRequestStatusUpdate);
    }

    if (options.onRequestCancelled) {
      socket.on('request:cancelled', options.onRequestCancelled);
    }

    if (options.onRequestCompleted) {
      socket.on('request:completed', options.onRequestCompleted);
    }
  }, [
    options.onAmbulanceUpdate,
    options.onRequestCreated,
    options.onRequestAccepted,
    options.onRequestStatusUpdate,
    options.onRequestCancelled,
    options.onRequestCompleted,
  ]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
  };
}
