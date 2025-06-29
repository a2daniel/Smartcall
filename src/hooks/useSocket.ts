"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { NotificationData, SocketUser } from '@/lib/socket';

interface UseSocketOptions {
  user: SocketUser | null;
  onNotification?: (notification: NotificationData) => void;
}

export function useSocket({ user, onNotification }: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const onNotificationRef = useRef(onNotification);

  // Update the ref when onNotification changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!user || !user.userId || !user.email || !user.role) {
      console.log('Invalid user data, not connecting to socket:', user);
      return;
    }

    console.log('Connecting to socket with user:', user);

    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server, authenticating user:', user);
      setIsConnected(true);
      
      // Authenticate user and join appropriate rooms
      socket.emit('authenticate', user);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    socket.on('notification', (notification: NotificationData) => {
      console.log('Received notification:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Call custom handler if provided
      if (onNotificationRef.current) {
        onNotificationRef.current(notification);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, [user?.userId, user?.email, user?.role]); // Only depend on user properties that matter

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (timestamp: string) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  };

  return {
    isConnected,
    notifications,
    clearNotifications,
    removeNotification,
    socket: socketRef.current,
  };
} 