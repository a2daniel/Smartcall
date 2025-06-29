"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export default function ConnectionStatus({ isConnected, className = "" }: ConnectionStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
        ${isConnected 
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' 
          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300'
        }
        ${className}
      `}
    >
      <motion.div
        animate={{ 
          scale: isConnected ? [1, 1.2, 1] : 1,
          rotate: isConnected ? 0 : [0, -10, 10, 0]
        }}
        transition={{ 
          duration: isConnected ? 2 : 0.5,
          repeat: isConnected ? Infinity : 0,
          repeatType: "loop"
        }}
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
      </motion.div>
      <span>
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </motion.div>
  );
} 