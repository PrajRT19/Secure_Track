import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * Custom hook that manages a persistent socket.io connection.
 *
 * Features:
 * - Authenticates via JWT in the handshake
 * - Automatically reconnects on disconnect
 * - Cleans up on unmount / token change
 * - Returns stable `on`, `off`, `emit` helpers
 *
 * @param {string|null} token - JWT from localStorage (null = don't connect)
 * @returns {{ socketRef, on, off, emit, isConnected }}
 */
const useSocket = (token) => {
  const socketRef = useRef(null);
  const listenersRef = useRef({}); // event -> [callbacks]

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    // Create socket with JWT in the auth handshake
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socketRef.current = socket;
  }, [token]);

  // Connect when token is available
  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  /**
   * Register a socket event listener.
   * Safe to call multiple times — deduplicates via internal registry.
   */
  const on = useCallback((event, callback) => {
    if (!socketRef.current) return;
    // Remove any previous listener for this event+callback pair
    socketRef.current.off(event, callback);
    socketRef.current.on(event, callback);

    if (!listenersRef.current[event]) listenersRef.current[event] = new Set();
    listenersRef.current[event].add(callback);
  }, []);

  /**
   * Remove a specific event listener.
   */
  const off = useCallback((event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
    listenersRef.current[event]?.delete(callback);
  }, []);

  /**
   * Emit an event to the server.
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socketRef, on, off, emit };
};

export default useSocket;
