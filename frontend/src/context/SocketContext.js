import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Socket server URL: must be the backend (Socket.io runs there). In dev on port 3000, backend is usually 5000.
const getSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  const envUrl = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL;
  if (envUrl) return envUrl;
  // Dev: frontend often runs on :3000, backend on :5000 – proxy doesn't forward WebSockets, so connect to backend
  const { hostname, port } = window.location;
  if (port === '3000' && hostname === 'localhost') return 'http://localhost:5000';
  return window.location.origin;
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const url = getSocketUrl();
    if (!url) {
      setSocket(null);
      return;
    }
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = socket ? { socket, connected: socket.connected } : { socket: null, connected: false };
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  return ctx;
}

/**
 * Subscribe to a socket event. Cleans up on unmount.
 * @param {import('socket.io-client').Socket | null} socket
 * @param {string} event
 * @param {(...args: any[]) => void} handler
 */
export function useSocketEvent(socket, event, handler) {
  useEffect(() => {
    if (!socket || !event || typeof handler !== 'function') return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, event, handler]);
}
