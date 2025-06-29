"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getReliabilityColor, getReliabilityLabel } from '@/lib/reliability';
import AuditLogTable from '@/components/AuditLogTable';

interface AdminDashboardProps {
  user: any;
}

interface User {
  id: number;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  stats: {
    score: number;
    totalShifts: number;
    completedShifts: number;
    missedShifts: number;
  };
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [reliabilityFilter, setReliabilityFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch('/api/audit-logs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      } else {
        console.error('Failed to load audit logs');
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const updateUserStatus = async (userId: number, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(`User status changed to ${newStatus.toLowerCase()} successfully`);
        
        // Refresh audit logs to show the new action
        fetchAuditLogs();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to home page
        window.location.href = '/';
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    const reliabilityMatch = reliabilityFilter === 'all' || 
      (reliabilityFilter === 'excellent' && user.stats.score >= 0.9) ||
      (reliabilityFilter === 'good' && user.stats.score >= 0.8 && user.stats.score < 0.9) ||
      (reliabilityFilter === 'fair' && user.stats.score >= 0.6 && user.stats.score < 0.8) ||
      (reliabilityFilter === 'poor' && user.stats.score < 0.6);
    
    return roleMatch && reliabilityMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm">Monitor system performance and manage users</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 border-premium hover:bg-accent/50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border-premium shadow-premium bg-card/50 backdrop-blur-sm hover:shadow-premium-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-semibold text-foreground">{users.length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-premium shadow-premium bg-card/50 backdrop-blur-sm hover:shadow-premium-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-semibold text-foreground">{users.filter(u => u.status === 'ACTIVE').length}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Suspended: {users.filter(u => u.status === 'SUSPENDED').length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Inactive: {users.filter(u => u.status === 'INACTIVE').length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-premium shadow-premium bg-card/50 backdrop-blur-sm hover:shadow-premium-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Staff Members</p>
                  <p className="text-3xl font-semibold text-foreground">{users.filter(u => u.role === 'STAFF').length}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-premium shadow-premium bg-card/50 backdrop-blur-sm hover:shadow-premium-lg transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Managers</p>
                  <p className="text-3xl font-semibold text-foreground">{users.filter(u => u.role === 'MANAGER').length}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 mb-8 border-premium shadow-premium bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-3">Filter by Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-premium rounded-lg bg-background text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="all">All Roles</option>
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-3">Filter by Reliability</label>
                <select
                  value={reliabilityFilter}
                  onChange={(e) => setReliabilityFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-premium rounded-lg bg-background text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                >
                  <option value="all">All Levels</option>
                  <option value="excellent">Excellent (≥90%)</option>
                  <option value="good">Good (80-89%)</option>
                  <option value="fair">Fair (60-79%)</option>
                  <option value="poor">Poor (&lt;60%)</option>
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-premium shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold text-foreground">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage user accounts and permissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">User</th>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">Reliability</th>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">Shifts</th>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr 
                      key={user.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-foreground">{user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getReliabilityColor(user.stats.score)}`}>
                            {getReliabilityLabel(user.stats.score)}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">
                            {Math.round(user.stats.score * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="text-foreground font-medium">{user.stats.totalShifts} total</div>
                          <div className="text-xs text-muted-foreground">
                            {user.stats.completedShifts} completed, {user.stats.missedShifts} missed
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : user.status === 'SUSPENDED'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {user.status}
                          </span>
                          {user.lastLoginAt && (
                            <div className="text-xs text-muted-foreground">
                              Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {user.status !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateUserStatus(user.id, 'ACTIVE')}
                              className="shadow-premium hover:shadow-premium-lg transition-all duration-200"
                            >
                              Activate
                            </Button>
                          )}
                          {user.status !== 'SUSPENDED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStatus(user.id, 'SUSPENDED')}
                              className="border-premium hover:bg-accent/50 transition-all duration-200"
                            >
                              Suspend
                            </Button>
                          )}
                          {user.status !== 'INACTIVE' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateUserStatus(user.id, 'INACTIVE')}
                              className="shadow-premium hover:shadow-premium-lg transition-all duration-200"
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <AuditLogTable 
            logs={auditLogs}
            title="Recent System Activity"
            showUser={true}
            loading={logsLoading}
          />
        </div>
      </div>
    </div>
  );
} 