import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    let socketUrl = import.meta.env.VITE_API_URL;
    if (!socketUrl || socketUrl.includes(' ') || socketUrl.includes('to:')) {
      socketUrl = 'https://taskflow-backend-1-q8ya.onrender.com';
    }
    if (window.location.hostname === 'localhost') {
      socketUrl = 'http://localhost:5000';
    }
    socketUrl = socketUrl.replace(/\/$/, '');
    const socket = io(socketUrl, {
      auth: { userId: user._id },
      transports: ['websocket'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
