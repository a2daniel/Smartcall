"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationData } from '@/lib/socket';
import NotificationToast from './NotificationToast';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onDismiss: (timestamp: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxNotifications?: number;
}

export default function NotificationContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right',
  maxNotifications = 5 
}: NotificationContainerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div 
      className={`
        fixed z-50 pointer-events-none
        ${getPositionClasses()}
      `}
    >
      <div className="space-y-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {visibleNotifications.map((notification, index) => (
            <motion.div
              key={notification.timestamp}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 30,
                layout: { duration: 0.3 }
              }}
              style={{ zIndex: maxNotifications - index }}
            >
              <NotificationToast
                notification={notification}
                onDismiss={() => onDismiss(notification.timestamp)}
                autoClose={true}
                duration={8000}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Overflow indicator */}
      {notifications.length > maxNotifications && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-xs text-muted-foreground border"
        >
          +{notifications.length - maxNotifications} more notification{notifications.length - maxNotifications !== 1 ? 's' : ''}
        </motion.div>
      )}
    </div>
  );
} 