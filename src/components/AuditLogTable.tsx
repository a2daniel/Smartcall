"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { getActionTypeLabel, getActionTypeColor, getActionTypeIcon } from '@/lib/audit';

interface AuditLog {
  id: number;
  actionType: string;
  actionDetail: string;
  timestamp: string;
  ipAddress?: string;
  user: {
    email: string;
    role: string;
  };
}

interface AuditLogTableProps {
  logs: AuditLog[];
  title?: string;
  showUser?: boolean;
  loading?: boolean;
}

export default function AuditLogTable({ 
  logs, 
  title = "Activity Log", 
  showUser = true,
  loading = false 
}: AuditLogTableProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-muted-foreground">No activity recorded yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start space-x-4 p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
          >
            {/* Action Icon */}
            <div className="flex-shrink-0 mt-1">
              <span className="text-xl" title={getActionTypeLabel(log.actionType as any)}>
                {getActionTypeIcon(log.actionType as any)}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.actionType as any)}`}>
                  {getActionTypeLabel(log.actionType as any)}
                </span>
                {showUser && (
                  <span className="text-xs text-muted-foreground">
                    by {log.user.email}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-foreground mb-1">
                {log.actionDetail}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {new Date(log.timestamp).toLocaleDateString()} at{' '}
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.ipAddress && log.ipAddress !== 'unknown' && (
                  <span className="hidden sm:inline">
                    from {log.ipAddress}
                  </span>
                )}
              </div>
            </div>

            {/* Timestamp (Mobile) */}
            <div className="flex-shrink-0 text-xs text-muted-foreground sm:hidden">
              {new Date(log.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {logs.length >= 50 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Showing most recent 50 activities
          </p>
        </div>
      )}
    </Card>
  );
} 