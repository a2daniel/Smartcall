"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, Calendar } from 'lucide-react';
import { NotificationData } from '@/lib/socket';
import { Button } from '@/components/ui/button';

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function NotificationToast({ 
  notification, 
  onDismiss, 
  autoClose = true, 
  duration = 8000 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'NEW_SHIFT':
        return '🔔';
      case 'SHIFT_ACCEPTED':
        return '✅';
      case 'SHIFT_CANCELLED':
        return '❌';
      default:
        return '📢';
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'NEW_SHIFT':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/30';
      case 'SHIFT_ACCEPTED':
        return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30';
      case 'SHIFT_CANCELLED':
        return 'border-red-200 bg-red-50 dark:bg-red-950/30';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/30';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className={`
            relative p-4 rounded-xl border-2 shadow-lg backdrop-blur-sm
            ${getNotificationColor()}
            max-w-md w-full mx-auto
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getNotificationIcon()}</span>
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {notification.type === 'NEW_SHIFT' && 'New Shift Available'}
                  {notification.type === 'SHIFT_ACCEPTED' && 'Shift Accepted'}
                  {notification.type === 'SHIFT_CANCELLED' && 'Shift Cancelled'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {notification.message}
            </p>

            {notification.shift && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {notification.shift.requiredSkill}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(notification.shift.start)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatTime(notification.shift.start)} - {formatTime(notification.shift.end)}
                    </span>
                  </div>
                </div>

                {notification.shift.callOutLogs?.[0] && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Requested by: {notification.shift.callOutLogs[0].user.email}</span>
                  </div>
                )}

                {notification.shift.callOutLogs?.[0]?.reason && (
                  <div className="text-xs text-muted-foreground italic">
                    "{notification.shift.callOutLogs[0].reason}"
                  </div>
                )}
              </div>
            )}

            {notification.acceptedBy && (
              <div className="flex items-center gap-1 text-xs text-emerald-600">
                <User className="h-3 w-3" />
                <span>Accepted by: {notification.acceptedBy.email}</span>
              </div>
            )}
          </div>

          {/* Progress bar for auto-close */}
          {autoClose && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-primary/30 rounded-b-xl"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 