"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { NotificationData } from "@/lib/socket";
import NotificationContainer from "@/components/NotificationContainer";
import AuditLogTable from "@/components/AuditLogTable";

export default function CallOutLogList() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'filled'>('all');
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const previousLogsRef = useRef<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Get user info from session
  useEffect(() => {
    const match = document.cookie.match(/session=([^;]+)/);
    if (match) {
      try {
        const session = JSON.parse(decodeURIComponent(match[1]));
        setUser(session);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/callout-logs');
      const data = await res.json();
      const newLogs = data.logs || [];
      
      // Check for newly filled shifts
      if (previousLogsRef.current.length > 0) {
        const previouslyOpenLogs = previousLogsRef.current.filter((log: any) => !log.acceptedBy);
        const nowFilledLogs = newLogs.filter((log: any) => 
          log.acceptedBy && previouslyOpenLogs.some((prevLog: any) => 
            prevLog.id === log.id && !prevLog.acceptedBy
          )
        );
        
        // Show toast for newly filled shifts
        nowFilledLogs.forEach((log: any) => {
          toast.success(`Shift accepted by ${log.acceptedBy.email}`, {
            description: `${log.user.email}'s call-out has been filled`,
            duration: 5000,
          });
        });
      }
      
      previousLogsRef.current = newLogs;
      setLogs(newLogs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch call-out logs:', error);
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/audit-logs/user/${user.id}?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [user?.id]);

  // Real-time notifications
  const handleNotification = useCallback((notification: NotificationData) => {
    if (notification.type === 'SHIFT_ACCEPTED') {
      // Show toast for accepted shifts
      toast.success(`Shift accepted by ${notification.acceptedBy?.email}`, {
        description: `${notification.shift?.requiredSkill} shift has been filled`,
        duration: 5000,
      });
      
      // Refresh logs to show updated status
      fetchLogs();
      
      // Also refresh audit logs
      fetchAuditLogs();
    }
  }, [fetchLogs, fetchAuditLogs]);

  const { notifications, removeNotification, isConnected } = useSocket({
    user: user ? {
      userId: user.id,
      role: user.role,
      email: user.email
    } : null,
    onNotification: handleNotification
  });

  useEffect(() => {
    fetchLogs();
    
    // Fetch audit logs when user is available
    if (user?.id) {
      fetchAuditLogs();
    }
    
    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLogs, fetchAuditLogs, user?.id]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'open') return !log.acceptedBy;
    if (filter === 'filled') return log.acceptedBy;
    return true; // 'all'
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="text-muted-foreground py-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-2">Loading call-outs...</p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Real-time Notifications */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
        maxNotifications={3}
      />

      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
              <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="h-10 flex-1 sm:flex-none"
            >
              All ({logs.length})
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              onClick={() => setFilter('open')}
              className="h-10 flex-1 sm:flex-none"
            >
              Open ({logs.filter((l: any) => !l.acceptedBy).length})
            </Button>
            <Button
              variant={filter === 'filled' ? 'default' : 'outline'}
              onClick={() => setFilter('filled')}
              className="h-10 flex-1 sm:flex-none"
            >
              Filled ({logs.filter((l: any) => l.acceptedBy).length})
            </Button>
          </div>
        </motion.div>

      <AnimatePresence mode="wait">
        {filteredLogs.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            key="empty"
          >
            <motion.div 
              className="text-6xl mb-4 text-muted-foreground/50"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse" as const
              }}
            >
              📋
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-muted-foreground font-medium text-lg mb-2">
                No call-outs found
              </p>
              <p className="text-muted-foreground/70 text-sm">
                {filter === 'all' 
                  ? "No call-outs have been logged yet" 
                  : `No ${filter} call-outs to display`}
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            key="list"
          >
            <AnimatePresence>
              {filteredLogs.map((log: any, index: number) => (
                <motion.div
                  key={log.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`p-4 sm:p-6 rounded-lg border-l-4 cursor-default ${
                    log.acceptedBy 
                      ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/30' 
                      : 'bg-red-50 border-red-500 dark:bg-red-950/30'
                  }`}
                  style={{ 
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-semibold text-foreground">{log.user.email}</span>
                        <motion.span 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.acceptedBy 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          {log.acceptedBy ? '✅ FILLED' : '🔴 OPEN'}
                        </motion.span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      
                      <p className="text-sm text-foreground">
                        {log.reason || <span className="italic text-muted-foreground">No reason provided</span>}
                      </p>
                      
                      {log.acceptedBy && (
                        <motion.div 
                          className="mt-3 p-3 bg-background/50 rounded-md border border-border/50"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-sm text-foreground">
                            <span className="font-medium">Accepted by:</span> {log.acceptedBy.email}
                          </p>
                          {log.filledAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              on {new Date(log.filledAt).toLocaleString()}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    {/* My Activity Section */}
    {user && (
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AuditLogTable 
          logs={auditLogs}
          title="My Activity"
          showUser={false}
          loading={logsLoading}
        />
      </motion.div>
    )}
    </>
  );
} 