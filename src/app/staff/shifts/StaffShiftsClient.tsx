"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StaffShiftsList from "./StaffShiftsList";
import StaffCalendar from "./StaffCalendar";
import ReliabilityScore from "@/components/ReliabilityScore";
import { ReliabilityStats } from "@/lib/reliability";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/useSocket";
import { NotificationData } from "@/lib/socket";
import NotificationContainer from "@/components/NotificationContainer";
import AuditLogTable from "@/components/AuditLogTable";

interface StaffShiftsClientProps {
  initialOpenShifts: any[];
  initialAssignedShifts: any[];
  user: any;
  reliabilityStats: ReliabilityStats | null;
}

export default function StaffShiftsClient({ 
  initialOpenShifts, 
  initialAssignedShifts, 
  user,
  reliabilityStats
}: StaffShiftsClientProps) {
  const [openShifts, setOpenShifts] = useState(initialOpenShifts);
  const [assignedShifts, setAssignedShifts] = useState(initialAssignedShifts);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const previousOpenShiftsRef = useRef<any[]>(initialOpenShifts);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch open shifts
      const openRes = await fetch('/api/shifts/open');
      const openData = await openRes.json();
      const newOpenShifts = openData.shifts || [];

      // Check for new shifts that match user's potential skills
      if (previousOpenShiftsRef.current.length > 0 && user?.role === 'STAFF') {
        const previousShiftIds = previousOpenShiftsRef.current.map((shift: any) => shift.id);
        const newShifts = newOpenShifts.filter((shift: any) => !previousShiftIds.includes(shift.id));
        
        // Show toast for new shifts (only from polling, not from real-time notifications)
        newShifts.forEach((shift: any) => {
          toast.info(`New ${shift.requiredSkill} shift available`, {
            description: `${new Date(shift.start).toLocaleDateString()} • ${new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(shift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            duration: 6000,
          });
        });
      }

      previousOpenShiftsRef.current = newOpenShifts;
      setOpenShifts(newOpenShifts);

      // Fetch assigned shifts for current user
      if (user?.id) {
        const assignedRes = await fetch(`/api/shifts/assigned?userId=${user.id}`);
        const assignedData = await assignedRes.json();
        setAssignedShifts(assignedData.shifts || []);
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

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
    if (notification.type === 'NEW_SHIFT') {
      // Show toast for new shifts
      toast.info(`New ${notification.shift?.requiredSkill} shift available`, {
        description: `${new Date(notification.shift?.start || '').toLocaleDateString()} • ${new Date(notification.shift?.start || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(notification.shift?.end || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        duration: 6000,
      });
      
      // Refresh shifts to show new one
      fetchShifts();
      
      // Also refresh audit logs
      fetchAuditLogs();
    }
  }, [fetchShifts, fetchAuditLogs]);

  const { notifications, removeNotification, isConnected } = useSocket({
    user: user ? {
      userId: user.id,
      role: user.role,
      email: user.email
    } : null,
    onNotification: handleNotification
  });

  useEffect(() => {
    // Initial fetch of audit logs
    fetchAuditLogs();
    
    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchShifts();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchShifts, fetchAuditLogs]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Real-time Notifications */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
        maxNotifications={3}
      />

      {/* Header */}
      <div className="bg-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your shifts and track your performance</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
            {reliabilityStats && (
              <div className="flex-shrink-0">
                <ReliabilityScore stats={reliabilityStats} compact />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Layout: Grid with Performance + Calendar side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Performance, Available Shifts & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Performance Section - Desktop only detailed view */}
            {reliabilityStats && (
              <div className="hidden lg:block">
                <ReliabilityScore stats={reliabilityStats} />
              </div>
            )}

            {/* Available Shifts Section */}
            <motion.div 
              className="bg-card rounded-xl shadow-sm border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Available Shifts</h2>
                    <p className="text-muted-foreground text-sm mt-1">View and accept open shift requests</p>
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      <span className="text-xs">Updating...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <StaffShiftsList shifts={openShifts} user={user} />
                )}
              </div>
            </motion.div>

            {/* My Shifts Section */}
            <motion.div 
              className="bg-card rounded-xl shadow-sm border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-bold text-foreground">My Shifts</h2>
                <p className="text-muted-foreground text-sm mt-1">Your accepted and upcoming shifts</p>
              </div>
              
              <div className="p-6">
                {assignedShifts.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-muted-foreground/50 text-6xl mb-4">📅</div>
                    <p className="text-foreground font-medium">No assigned shifts</p>
                    <p className="text-muted-foreground text-sm mt-1">Check back for new opportunities</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {assignedShifts.map((shift: any, index: number) => (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className="p-4 bg-accent/30 rounded-lg border border-border/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                                {shift.requiredSkill}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(shift.start).toLocaleDateString()} • {new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium text-foreground">Requested by:</span> {shift.callOutLogs[0]?.user?.email || <span className="italic">System</span>}
                              </p>
                              {shift.callOutLogs[0]?.reason && (
                                <p>
                                  <span className="font-medium text-foreground">Reason:</span> {shift.callOutLogs[0].reason}
                                </p>
                              )}
                              {shift.callOutLogs[0]?.filledAt && (
                                <p className="text-emerald-600">
                                  <span className="font-medium">Accepted:</span> {new Date(shift.callOutLogs[0].filledAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* My Activity Section */}
            <motion.div 
              className="bg-card rounded-xl shadow-sm border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="p-6">
                <AuditLogTable 
                  logs={auditLogs}
                  title="My Activity"
                  showUser={false}
                  loading={logsLoading}
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Calendar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <StaffCalendar shifts={assignedShifts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 